// app/api/chat/route.ts - Add better error handling

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Request received at Next.js API route:', body);

    // Add timeout to the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      // Forward the request to the Flask backend
      const flaskResponse = await fetch('https://cs532-project-dubl.onrender.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!flaskResponse.ok) {
        console.error('Flask API response was not ok:', flaskResponse.status, flaskResponse.statusText);
        
        // Return a graceful error response instead of throwing
        return NextResponse.json(
          { 
            error: `Backend error: ${flaskResponse.status} ${flaskResponse.statusText}`, 
            response: 'Sorry, there was an error connecting to the AI service. Please try again in a moment.',
            session_id: body.session_id || '',
            extracted_features: {}
          },
          { status: 200 } // Return 200 so frontend doesn't crash
        );
      }

      const data = await flaskResponse.json();
      console.log('Response from Flask backend:', data);

      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error in API route:', fetchError);
      
      // Handle timeout specifically
      const errorMessage = (fetchError instanceof Error && fetchError.name === 'AbortError') 
        ? 'Request timed out. The backend service may be slow or unavailable.'
        : 'Failed to connect to backend service.';
        
      return NextResponse.json(
        { 
          error: errorMessage, 
          response: 'Sorry, there was an error connecting to the AI service. Please try again in a moment.',
          session_id: body.session_id || '',
          extracted_features: {}
        },
        { status: 200 } // Return 200 so frontend doesn't crash
      );
    }
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request', 
        response: 'Sorry, there was an error processing your request. Please try again.',
        session_id: '',
        extracted_features: {}
      },
      { status: 200 } // Return 200 so frontend doesn't crash
    );
  }
}