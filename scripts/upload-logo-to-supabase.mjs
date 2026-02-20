#!/usr/bin/env node
/**
 * One-time script: Upload logo to Supabase Storage and print the public URL.
 * Run: node --env-file=.env.local scripts/upload-logo-to-supabase.mjs
 * (Or: export vars from .env.local, then node scripts/upload-logo-to-supabase.mjs)
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey)
const BUCKET = 'email-assets'
const LOGO_PATH = join(__dirname, '..', 'public', 'logo', 'logo.png')

async function main() {
  try {
    // Ensure bucket exists and is public
    const { data: buckets } = await supabase.storage.listBuckets()
    const exists = buckets?.some((b) => b.name === BUCKET)
    if (!exists) {
      const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
      if (error) {
        console.error('Failed to create bucket:', error.message)
        process.exit(1)
      }
      console.log(`Created bucket: ${BUCKET}`)
    }

    const logoBuffer = readFileSync(LOGO_PATH)
    const { error } = await supabase.storage.from(BUCKET).upload('logo.png', logoBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

    if (error) {
      console.error('Upload failed:', error.message)
      process.exit(1)
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl('logo.png')
    console.log('\n✅ Logo uploaded successfully!\n')
    console.log('Public URL (use this in your Supabase email templates):')
    console.log(data.publicUrl)
    console.log('')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
