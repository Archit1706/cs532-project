import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log(`Fetching properties for zip code ${body.zipCode}`);
    
    // Forward the request to the Flask backend
    const flaskResponse = await fetch('http://localhost:5000/api/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!flaskResponse.ok) {
      console.error('Flask API properties response was not ok:', flaskResponse.status, flaskResponse.statusText);
      return NextResponse.json({ 
        error: `Properties search failed with status: ${flaskResponse.status}`,
        results: [] 
      });
    }

    const data = await flaskResponse.json();
    console.log(`Received ${data.results?.length || 0} properties for zip code ${body.zipCode}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in properties API route:', error);
    return NextResponse.json(
      { error: 'Failed to process properties request', results: [] },
      { status: 200 }
    );
  }
}