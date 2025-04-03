// utils/llmFeatureExtractor.ts
import { FeatureExtraction } from 'types/chat';
import { extractRealEstateFeatures } from './extractRealEstateFeatures';

// Helper for pretty formatting extracted features
function formatFeatures(features: FeatureExtraction): string {
  return JSON.stringify(features, null, 2);
}

export async function extractFeaturesWithLLM(query: string): Promise<FeatureExtraction> {
    console.log(`🔍 Extracting features for query: "${query}"`);
    
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
    if (zipCodeMatch) {
        defaultExtraction.extractedZipCode = zipCodeMatch[1];
        console.log(`📍 Detected ZIP code: ${defaultExtraction.extractedZipCode}`);
    }

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
        console.log('🤖 Sending feature extraction request to LLM API...');
        
        const llmResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: prompt,
                is_system_query: true
            })
        });

        if (!llmResponse.ok) {
            const errorMsg = `LLM API error: ${llmResponse.status}`;
            console.error(`❌ ${errorMsg}`);
            throw new Error(errorMsg);
        }

        const data = await llmResponse.json();
        console.log('✅ Received LLM response');
        
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            console.error('❌ No JSON found in LLM response');
            console.log('Raw LLM response:', data.response);
            throw new Error("No JSON found in LLM response");
        }

        try {
            const extractedFeatures = JSON.parse(jsonMatch[0]);
            
            const result = {
                ...defaultExtraction,
                ...extractedFeatures,
                extractedZipCode: extractedFeatures.zipCode || defaultExtraction.extractedZipCode
            };
            
            console.log('📊 Extracted features:');
            console.log(formatFeatures(result));
            
            return result;
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            console.log('Raw JSON string:', jsonMatch[0]);
            throw parseError;
        }
    } catch (error) {
        console.error("❌ LLM feature extraction failed:", error);
        
        // Fallback to regex-based extraction
        console.log('⚠️ Falling back to regex-based feature extraction');
        const fallbackFeatures = extractRealEstateFeatures(query);
        
        console.log('📊 Fallback features:');
        console.log(formatFeatures(fallbackFeatures));
        
        return fallbackFeatures;
    }
}