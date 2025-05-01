// app/api/custom_amenities/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zipCode, amenityType } = body;
    
    console.log(`Fetching ${amenityType} data for ${zipCode}`);
    
    if (!zipCode || zipCode.length !== 5) {
      return NextResponse.json({ 
        error: "Invalid zip code", 
        results: [] 
      });
    }
    
    // Convert amenity type to search query term
    // Translate common amenity types to search terms
    let searchType = amenityType;
    
    if (amenityType.includes('coffee')) {
      searchType = 'Coffee Shop';
    } else if (amenityType.includes('school')) {
      searchType = 'School';
    } else if (amenityType.includes('grocery')) {
      searchType = 'Grocery Store';
    } else if (amenityType.includes('hospital')) {
      searchType = 'Hospital';
    } else if (amenityType.includes('park')) {
      searchType = 'Park';
    } else if (amenityType.includes('library')) {
      searchType = 'Library';
    }
    
    // Forward the request to your existing location API endpoint
    // which already has the integration with Google/SerpAPI
    const response = await fetch('https://cs532-project-dubl.onrender.com/api/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zipCode,
        type: searchType
      }),
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return NextResponse.json({
        error: `Search failed with status: ${response.status}`,
        results: []
      });
    }
    
    const data = await response.json();
    console.log(`Received ${data.results?.length || 0} ${amenityType} results for zip code ${zipCode}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in custom amenities API route:', error);
    return NextResponse.json(
      { error: 'Failed to process request', results: [] },
      { status: 500 }
    );
  }
}