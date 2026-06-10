import { NextRequest, NextResponse } from 'next/server'

const ML_SERVICE_PORT = 5001

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const port = searchParams.get('XTransformPort') || ML_SERVICE_PORT
  
  searchParams.delete('XTransformPort')
  
  const path = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const endpoint = request.nextUrl.pathname.replace('/api', '')
  
  try {
    const response = await fetch(`http://localhost:${port}${endpoint}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('API proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to ML service' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const port = searchParams.get('XTransformPort') || ML_SERVICE_PORT
  
  searchParams.delete('XTransformPort')
  
  const path = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const endpoint = request.nextUrl.pathname.replace('/api', '')
  
  try {
    const body = await request.json()
    
    const response = await fetch(`http://localhost:${port}${endpoint}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('API proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to ML service' },
      { status: 500 }
    )
  }
}
