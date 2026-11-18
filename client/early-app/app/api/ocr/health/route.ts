import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ocrBaseUrl = process.env.OCR_SERVICE_URL || 'http://localhost:8000'

  try {
    const targetUrl = new URL('/health', ocrBaseUrl)
    const response = await fetch(targetUrl, { method: 'GET' })
    const data = await response.json()
    return NextResponse.json({
      service: 'early-app-gateway',
      ocrServiceStatus: response.ok ? 'connected' : 'unhealthy',
      ocrBaseUrlConfigured: Boolean(process.env.OCR_SERVICE_URL),
      targetResponse: data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        service: 'early-app-gateway',
        ocrServiceStatus: 'unreachable',
        error: String(error),
      },
      { status: 503 }
    )
  }
}
