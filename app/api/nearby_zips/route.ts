// app/api/nearby_zips/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zipCode } = body;
    
    if (!zipCode || zipCode.length !== 5) {
      return NextResponse.json({ 
        error: "ZIP code is required and must be 5 digits", 
        nearby_zips: [] 
      }, { status: 400 });
    }
    
    console.log(`Fetching nearby ZIP codes for: ${zipCode}`);
    
    // Use ZipCodeAPI.com's API to find nearby zip codes
    // This is a paid service, so we'll need the API key from environment variables
    const apiKey = process.env.ZIPCODE_API_KEY;
    
    if (!apiKey) {
      console.warn("ZIPCODE_API_KEY not found in environment variables. Using fallback method.");
      return NextResponse.json({ nearby_zips: getFallbackNearbyZips(zipCode) });
    }
    
    try {
      // Make the API call
      const radius = 10; // 10 miles radius
      const url = `https://www.zipcodeapi.com/rest/${apiKey}/radius.json/${zipCode}/${radius}/mile`;
      const response = await axios.get(url);
      
      const data = response.data as { zip_codes?: { zip_code: string }[] };
      if (response.status === 200 && data.zip_codes) {
        const nearbyZips = data.zip_codes.map((item: any) => item.zip_code);
        return NextResponse.json({ nearby_zips: nearbyZips });
      } else {
        console.warn("Unexpected response format from ZIP code API. Using fallback method.");
        return NextResponse.json({ nearby_zips: getFallbackNearbyZips(zipCode) });
      }
    } catch (error) {
      console.warn(`Error from ZIP code API: ${error}. Using fallback method.`);
      return NextResponse.json({ nearby_zips: getFallbackNearbyZips(zipCode) });
    }
  } catch (error) {
    console.error('Error in nearby_zips API route:', error);
    // Instead of returning a 500, return a 200 with empty results to prevent breaking the UI
    return NextResponse.json({ 
      nearby_zips: [],
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 200 });
  }
}

// Fallback function to generate nearby ZIP codes synthetically
// This is used when the ZIP code API is unavailable or fails
function getFallbackNearbyZips(zipCode: string): string[] {
  // Zip code areas are often sequential, so we can simulate nearby zips
  // by incrementing and decrementing the last 2 digits of the zip code
  const prefix = zipCode.substring(0, 3);
  const baseNum = parseInt(zipCode.substring(3), 10);
  
  const nearbyZips = [];
  // Generate 5 nearby zips by incrementing/decrementing the last 2 digits
  for (let i = 1; i <= 5; i++) {
    // Add zipcode with higher value
    const higherZip = prefix + String(baseNum + i).padStart(2, '0');
    // Add zipcode with lower value
    const lowerZip = prefix + String(Math.max(0, baseNum - i)).padStart(2, '0');
    
    nearbyZips.push(higherZip);
    if (baseNum - i >= 0) nearbyZips.push(lowerZip);
    
    // Stop once we have 5 zip codes
    if (nearbyZips.length >= 5) break;
  }
  
  return nearbyZips.slice(0, 5); // Return max 5 nearby zip codes
}