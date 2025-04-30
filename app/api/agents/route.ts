// File: app/api/market_trends/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Property Agents request:', body);

        // const flaskResponse = await fetch('http://127.0.0.1:5000/api/search_agents', {
        const flaskResponse = await fetch('https://cs532-project-dubl.onrender.com/api/search_agents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!flaskResponse.ok) {
            console.error('Flask API Agents response was not ok:', flaskResponse.status);
            throw new Error('Property Agents search failed');
        }

        const data = await flaskResponse.json();
        console.log(`Received Property Agents data for: ${body.location || body.zipCode}`);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in Property Agents API route:', error);
        return NextResponse.json(
            { error: 'Failed to fetch Property Agents', trends: null },
            { status: 500 }
        );
    }
}