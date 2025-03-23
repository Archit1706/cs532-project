// File: app/api/extract_features/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Feature extraction request:', body);

    const extractionPrompt = `
      You are a real estate assistant that extracts structured data from user queries.
      
      Extract the following information from this query:
      - Query type: general, property_search, property_detail, market_info, legal, preferences
      - Zip code: Any US zip code mentioned
      - Property features: bedrooms, bathrooms, square footage, property type, year built, etc.
      - Location features: neighborhood, city, proximity requirements
      - Specific action: show_listings, show_details, compare_properties, analyze_market, etc.
      - Filters: price range, min/max values for features, must-have amenities
      - Sort preference: price_asc, price_desc, newest, etc.
      
      Respond in valid JSON format with these fields (use null for missing values).
      
      User query: ${body.message}
    `;

    // Forward to Flask backend for LLM processing
    const flaskResponse = await fetch('https://cs532-project.onrender.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: extractionPrompt,
        is_system_query: true
      }),
    });

    if (!flaskResponse.ok) {
      console.error('Flask API response for feature extraction was not ok:', flaskResponse.status);
      throw new Error('Feature extraction failed');
    }

    const data = await flaskResponse.json();
    console.log('Raw feature extraction response:', data);

    // Try to parse JSON from LLM response
    try {
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedFeatures = JSON.parse(jsonMatch[0]);
        
        return NextResponse.json({
          features: extractedFeatures,
          success: true
        });
      } else {
        // No JSON found
        return NextResponse.json({
          features: null,
          success: false,
          error: "Could not extract features"
        });
      }
    } catch (parseError) {
      console.error('Error parsing feature JSON:', parseError);
      return NextResponse.json({
        features: null,
        success: false,
        error: "Invalid feature format"
      });
    }
  } catch (error) {
    console.error('Error in feature extraction route:', error);
    return NextResponse.json(
      { error: 'Failed to extract features', success: false },
      { status: 500 }
    );
  }
}