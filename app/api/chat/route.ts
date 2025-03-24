import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Request received at Next.js API route:', body);

    // Forward the request to the Flask backend
    const flaskResponse = await fetch('https://cs532-project.onrender.com/api/chat', {
      // const flaskResponse = await fetch('http://127.0.0.1:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!flaskResponse.ok) {
      console.error('Flask API response was not ok:', flaskResponse.status, flaskResponse.statusText);
      throw new Error('Flask API response was not ok');
    }

    const data = await flaskResponse.json();
    console.log('Response from Flask backend:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to process request', response: 'Sorry, there was an error connecting to the AI service.', session_id: '' },
      { status: 500 }
    );
  }
}