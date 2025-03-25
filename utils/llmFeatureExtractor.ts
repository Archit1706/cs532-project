// utils/llmFeatureExtractor.ts
import { FeatureExtraction } from 'types/chat';
import { extractRealEstateFeatures } from './extractRealEstateFeatures';

export async function extractFeaturesWithLLM(query: string): Promise<FeatureExtraction> {
    const defaultExtraction: FeatureExtraction = {
        queryType: 'general',
        extractedZipCode: undefined,
        propertyFeatures: {},
        locationFeatures: {},
        actionRequested: null,
        filters: {},
        sortBy: undefined
    };

    const zipCodeMatch = query.match(/\b(\d{5})\b/);
    if (zipCodeMatch) defaultExtraction.extractedZipCode = zipCodeMatch[1];

    const prompt = `
    You are a real estate query analyzer. Extract key features and intentions from this query:

    "${query}"

    Return a JSON object with these fields (use null for missing values):
    {
      "queryType": "property_search"|"property_detail"|"market_info"|"legal"|"preferences",
      "propertyFeatures": {
        "bedrooms": number or [min, max],
        "bathrooms": number or [min, max],
        "squareFeet": number or [min, max],
        "propertyType": "house"|"condo"|"apartment"|"townhouse"|string
      },
      "locationFeatures": {
        "city": string,
        "neighborhood": string,
        "proximity": {
          "to": string,
          "distance": number,
          "unit": "miles"|"minutes"
        }
      },
      "actionRequested": "show_listings"|"show_details"|"analyze_market"|"show_restaurants"|"show_transit"|null,
      "filters": {
        "priceRange": [min, max],
        "amenities": [string array]
      },
      "sortBy": "price_asc"|"price_desc"|"newest"|null
    }

    ONLY return the JSON. No explanation.
  `;

    try {
        const llmResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: prompt,
                is_system_query: true
            })
        });

        if (!llmResponse.ok) throw new Error(`LLM API error: ${llmResponse.status}`);

        const data = await llmResponse.json();
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);

        if (!jsonMatch) throw new Error("No JSON found in LLM response");

        const extractedFeatures = JSON.parse(jsonMatch[0]);

        return {
            ...defaultExtraction,
            ...extractedFeatures,
            extractedZipCode: extractedFeatures.zipCode || defaultExtraction.extractedZipCode
        };
    } catch (error) {
        console.error("LLM feature extraction failed:", error);
        return extractRealEstateFeatures(query);
    }
}
