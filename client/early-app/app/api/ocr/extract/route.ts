import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const ocrBaseUrl = process.env.OCR_SERVICE_URL || 'http://localhost:8000'

  try {
    const contentType = request.headers.get('content-type') || ''
    
    // Forward the request to the internal OCR microservice
    const targetUrl = new URL('/internal/extract', ocrBaseUrl)

    let response: Response
    if (contentType.includes('application/json')) {
      const jsonBody = await request.json()
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonBody),
      })
    } else {
      const formData = await request.formData()
      response = await fetch(targetUrl, {
        method: 'POST',
        body: formData,
      })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[early-app API] OCR forwarding error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'OCR_SERVICE_UNAVAILABLE',
          message: 'Unable to reach internal OCR microservice at bound OCR_SERVICE_URL',
        },
      },
      { status: 502 }
    )
  }
}
