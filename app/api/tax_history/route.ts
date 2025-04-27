// app/api/tax_history/route.ts
import { NextResponse } from 'next/server';
import http from 'http';
import https from 'https';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zpid } = body;
    
    if (!zpid) {
      return NextResponse.json({ error: "Property ID (zpid) is required" }, { status: 400 });
    }
    
    console.log(`Fetching tax history data for property ID: ${zpid}`);
    
    // Make a request to the Zillow API
    const rapidApiKey = process.env.ZILLOW_RAPIDAPI_KEY || '';
    
    // Create a promise to handle the HTTP request
    const fetchTaxHistory = () => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'zillow-com1.p.rapidapi.com',
          port: 443,
          path: `/priceAndTaxHistory?zpid=${zpid}`,
          method: 'GET',
          headers: {
            'x-rapidapi-key': rapidApiKey,
            'x-rapidapi-host': 'zillow-com1.p.rapidapi.com'
          }
        };
        
        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const jsonData = JSON.parse(data);
                resolve(jsonData);
              } catch (error) {
                reject(new Error('Error parsing JSON response'));
              }
            } else {
              reject(new Error(`API returned status code ${res.statusCode}`));
            }
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        req.end();
      });
    };
    
    try {
      const data = await fetchTaxHistory();
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error fetching tax history data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tax history data', message: (error as Error).message },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in tax_history API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}