import axios from 'axios'
import { createSupabaseServerClient, createSupabaseBrowserClient } from './supabase'
import fs from 'fs'
import path from 'path'

const GROK_API_BASE_URL = 'https://api.x.ai/v1'

export interface CallGrokOptions {
  prompt?: string
  promptName?: string
  userId: string
  feature: string
  imageUrls?: string[]
  variables?: Record<string, string>
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
  variables = {}
}: CallGrokOptions): Promise<CallGrokResult> {
  const apiKey = process.env.GROK_API_KEY

  if (!apiKey) {
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
      return {
        success: false,
        error: 'No prompt provided'
      }
    }

    // Replace variables in prompt
    finalPrompt = replaceVariables(finalPrompt, variables)

    // Prepare the message content
    let messageContent: any = finalPrompt

    // If there are images, structure the content as an array
    if (imageUrls.length > 0) {
      messageContent = [
        { type: 'text', text: finalPrompt },
        ...imageUrls.map(url => ({
          type: 'image_url',
          image_url: { url }
        }))
      ]
    }

    // Make the API call to Grok
    const response = await axios.post(
      `${GROK_API_BASE_URL}/chat/completions`,
      {
        messages: [{ role: 'user', content: messageContent }],
        model: 'grok-fast-reasoning-4',
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
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

    // Parse the JSON response
    let parsedData: any
    try {
      parsedData = JSON.parse(content)
    } catch (parseError) {
      return {
        success: false,
        error: `Failed to parse JSON response: ${parseError}`,
        tokensUsed
      }
    }

    // Log token usage to Supabase (server-side context)
    try {
      const supabase = createSupabaseServerClient()
      await supabase.from('token_usage_log').insert({
        user_id: userId,
        feature_name: feature,
        tokens_used: tokensUsed,
      })
    } catch (dbError) {
      console.error('Failed to log token usage:', dbError)
      // Don't fail the entire operation if logging fails
    }

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