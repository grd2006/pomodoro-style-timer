import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Hello, World!' })
}

export async function POST(request) {
  const body = await request.json()
  return NextResponse.json({ message: 'Hello from POST', data: body })
}