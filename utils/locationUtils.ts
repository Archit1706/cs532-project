// utils/locationUtils.ts
import { LocationData, LocationResponse, AgentsResponse } from 'types/chat';

export async function fetchLocationData(zip: string): Promise<LocationData> {
    const [restaurantsResponse, transitResponse, agentsResponse] = await Promise.all([
        fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zipCode: zip, type: 'Restaurants' })
        }),
        fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zipCode: zip, type: 'Bus Stop' })
        }),
        fetch('/api/agents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location: zip })
        })

    ]);

    let restaurantsData: LocationResponse = { results: [] };
    let transitData: LocationResponse = { results: [] };
    let agentsData: AgentsResponse = { agents: [] };

    if (restaurantsResponse.ok) {
        restaurantsData = await restaurantsResponse.json();
    }

    if (transitResponse.ok) {
        transitData = await transitResponse.json();
    }

    if (agentsResponse.ok) {
        agentsData = await agentsResponse.json();
    }

    return {
        restaurants: restaurantsData.results || [],
        transit: transitData.results || [],
        zipCode: zip,
        agents: agentsData.agents || []
    };
}
