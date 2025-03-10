import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if the Flask backend is reachable
    const response = await fetch('http://localhost:5000/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: 'ok',
        backend: 'connected',
        backend_details: data
      });
    } else {
      return NextResponse.json({
        status: 'warning',
        backend: 'error',
        message: 'Flask backend returned an error'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      backend: 'disconnected',
      message: 'Could not connect to Flask backend'
    }, { status: 200 });
  }
}