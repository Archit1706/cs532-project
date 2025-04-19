import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zipCode, type } = body;

    console.log(`Fetching ${type} data for zip code ${zipCode}`);

    if (!zipCode || zipCode.length !== 5) {
      return NextResponse.json({ error: 'Invalid zip code' }, { status: 400 });
    }

    // Forward the request to the Flask backend
    const flaskResponse = await fetch('https://cs532-project-dubl.onrender.com/api/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zipCode,
        type
      }),
    });
    if (!flaskResponse.ok) {
      console.error('Flask API location response was not ok:', flaskResponse.status, flaskResponse.statusText);
      // Instead of throwing, return a formatted error
      return NextResponse.json({
        error: `Location search failed with status: ${flaskResponse.status}`,
        results: []
      }, { status: 200 }); // Return 200 to allow frontend to handle gracefully
    }

    const data = await flaskResponse.json();
    console.log(`Received ${data.results?.length || 0} ${type} results for zip code ${zipCode}`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in location API route:', error);
    return NextResponse.json(
      { error: 'Failed to process location request', results: [] },
      { status: 500 }
    );
  }
}