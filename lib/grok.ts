import axios from 'axios'
import { createSupabaseServerClient } from './supabase-server'
import fs from 'fs'
import path from 'path'

const GROK_API_BASE_URL = 'https://api.x.ai/v1'

/**
 * Future: web_search / view_image / x_keyword_search tools
 * x.ai supports tools via /v1/responses (not chat/completions).
 * To enable: switch to responses API, add tools: [{ type: 'web_search' }],
 * and handle tool_calls in the response loop for iterative search + answer.
 */

export interface CallGrokOptions {
  prompt?: string
  promptName?: string
  userId: string
  feature: string
  imageUrls?: string[]
  variables?: Record<string, string>
  /** Use 'text' for long-form output (e.g. PDF content) to avoid JSON truncation; default 'json' */
  responseFormat?: 'json' | 'text'
  /** Max tokens for response (default from API); use 4096+ for long structured output */
  maxTokens?: number
}

/**
 * Load a prompt file dynamically
 */
export async function loadPrompt(promptName: string): Promise<string> {
  try {
    const promptPath = path.join(process.cwd(), 'prompts', `${promptName}.txt`)
    return fs.readFileSync(promptPath, 'utf8')
  } catch (error) {
    console.error(`Error loading prompt ${promptName}:`, error)
    return ''
  }
}

/**
 * Replace variables in prompt template
 */
function replaceVariables(template: string, variables: Record<string, string> = {}): string {
  let result = template
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value)
  })
  return result
}

export interface CallGrokResult {
  success: boolean
  data?: any
  error?: string
  tokensUsed?: number
}

export async function callGrok({
  prompt,
  promptName,
  userId,
  feature,
  imageUrls = [],
  variables = {},
  responseFormat = 'json',
  maxTokens
}: CallGrokOptions): Promise<CallGrokResult> {
  const apiKey = process.env.GROK_API_KEY

  if (!apiKey) {
    console.log('[Grok] Skipped (no API key):', { feature, userId })
    return {
      success: false,
      error: 'GROK_API_KEY environment variable is not set'
    }
  }

  try {
    // Load prompt if promptName is provided
    let finalPrompt = prompt
    if (promptName && !prompt) {
      finalPrompt = await loadPrompt(promptName)
    }

    if (!finalPrompt) {
      console.log('[Grok] Skipped (no prompt):', { feature, userId })
      return {
        success: false,
        error: 'No prompt provided'
      }
    }

    // Replace variables in prompt
    finalPrompt = replaceVariables(finalPrompt, variables)

    console.log('[Grok] Called:', { feature, userId, promptLength: finalPrompt?.length, hasImages: imageUrls.length > 0 })

    // Prepare the message content
    let messageContent: any = finalPrompt

    // If there are images, structure the content as an array (x.ai chat completions vision format)
    if (imageUrls.length > 0) {
      messageContent = [
        { type: 'text', text: finalPrompt },
        ...imageUrls.map((url: string) => ({
          type: 'image_url',
          image_url: { url, detail: 'high' as const }
        }))
      ]
    }

    // Make the API call to Grok (grok-4-1-fast-reasoning supports vision; longer timeout for reasoning models)
    const requestBody: Record<string, unknown> = {
      messages: [{ role: 'user', content: messageContent }],
      model: 'grok-4-1-fast-reasoning',
      temperature: 0.3,
      ...(maxTokens != null && { max_tokens: maxTokens }),
    }
    if (responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' }
    }

    const response = await axios.post(
      `${GROK_API_BASE_URL}/chat/completions`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: imageUrls.length > 0 ? 120000 : 60000, // 2 min for vision, 1 min for text
      }
    )

    const tokensUsed = response.data.usage?.total_tokens || 0
    const content = response.data.choices?.[0]?.message?.content

    if (!content) {
      return {
        success: false,
        error: 'No content received from Grok API',
        tokensUsed
      }
    }

    // Parse the response (JSON or plain text)
    let parsedData: any
    if (responseFormat === 'text') {
      parsedData = content
    } else {
      try {
        parsedData = JSON.parse(content)
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse JSON response: ${parseError}`,
          tokensUsed
        }
      }
    }

    // Log token usage to Supabase (server-side context)
    try {
      const supabase = await createSupabaseServerClient()
      await supabase.from('token_usage_log').insert({
        user_id: userId,
        feature_name: feature,
        tokens_used: tokensUsed,
      })
    } catch (dbError) {
      console.error('Failed to log token usage:', dbError)
      // Don't fail the entire operation if logging fails
    }

    console.log('[Grok] Success:', { feature, userId, tokensUsed })

    return {
      success: true,
      data: parsedData,
      tokensUsed
    }

  } catch (error: any) {
    console.error('Grok API error:', error)

    let errorMessage = 'Unknown error occurred'
    if (error.response) {
      // API responded with error status
      errorMessage = `API Error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown API error'}`
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error: Unable to reach Grok API'
    } else {
      // Other error
      errorMessage = error.message || 'Unknown error'
    }

    console.log('[Grok] Error:', { feature, userId, error: errorMessage })

    return {
      success: false,
      error: errorMessage
    }
  }
}

// Legacy class for backward compatibility
export class GrokAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateCompletion(prompt: string, options?: {
    maxTokens?: number
    temperature?: number
    model?: string
  }) {
    try {
      const response = await axios.post(
        `${GROK_API_BASE_URL}/chat/completions`,
        {
          messages: [{ role: 'user', content: prompt }],
          model: options?.model || 'grok-beta',
          max_tokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data
    } catch (error) {
      console.error('Grok API error:', error)
      throw error
    }
  }

  async analyzeHealthData(data: any) {
    const prompt = `Analyze the following health data and provide insights: ${JSON.stringify(data)}`
    return this.generateCompletion(prompt)
  }
}

// Factory function to create Grok API instance (legacy)
export function createGrokClient() {
  const apiKey = process.env.GROK_API_KEY
  if (!apiKey) {
    throw new Error('GROK_API_KEY environment variable is not set')
  }
  return new GrokAPI(apiKey)
}