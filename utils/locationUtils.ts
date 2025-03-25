// utils/locationUtils.ts
import { LocationData, LocationResponse } from 'types/chat';

export async function fetchLocationData(zip: string): Promise<LocationData> {
    const [restaurantsResponse, transitResponse] = await Promise.all([
        fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zipCode: zip, type: 'Restaurants' })
        }),
        fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zipCode: zip, type: 'Transit station' })
        })
    ]);

    let restaurantsData: LocationResponse = { results: [] };
    let transitData: LocationResponse = { results: [] };

    if (restaurantsResponse.ok) {
        restaurantsData = await restaurantsResponse.json();
    }

    if (transitResponse.ok) {
        transitData = await transitResponse.json();
    }

    return {
        restaurants: restaurantsData.results || [],
        transit: transitData.results || [],
        zipCode: zip
    };
}
