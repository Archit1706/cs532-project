// File: app/api/market_trends/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Market trends request:', body);

    // const flaskResponse = await fetch('http://127.0.0.1:5000/api/market_trends', {
    const flaskResponse = await fetch('https://cs532-project.onrender.com/api/market_trends', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!flaskResponse.ok) {
      console.error('Flask API market trends response was not ok:', flaskResponse.status);
      throw new Error('Market trends search failed');
    }

    const data = await flaskResponse.json();
    console.log(`Received market trends data for: ${body.location || body.zipCode}`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in market trends API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market trends', trends: null },
      { status: 500 }
    );
  }
}