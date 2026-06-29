import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'frontend', 'public', 'images', 'logos', 'company-logo.png')
    const data = await fs.readFile(filePath)
    return new Response(data, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.redirect(new URL('/images/logos/company-logo.png', 'http://localhost'))
  }
}
