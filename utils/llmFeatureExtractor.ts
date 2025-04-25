// utils/llmFeatureExtractor.ts - Improved error handling

import { FeatureExtraction } from "@/types/chat";

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

  // Try to detect zip code regardless of API success
  const zipCodeMatch = query.match(/\b(\d{5})\b/);
  if (zipCodeMatch) {
      defaultExtraction.extractedZipCode = zipCodeMatch[1];
      console.log(`📍 Detected ZIP code: ${defaultExtraction.extractedZipCode}`);
  }

  // Build the extraction prompt
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

  ONLY return the JSON. No explanation or other text.
`;

  try {
      console.log('🤖 Sending feature extraction request to LLM API...');
      
      // Try to make the API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      try {
          const llmResponse = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  message: prompt,
                  is_system_query: true
              }),
              signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (!llmResponse.ok) {
              console.error(`❌ LLM API error: ${llmResponse.status}`);
              // Don't throw, just log and return the default
              console.log('⚠️ Falling back to default extraction');
              return defaultExtraction;
          }

          const data = await llmResponse.json();
          console.log('✅ Received LLM response');
          
          const jsonMatch = data.response.match(/\{[\s\S]*\}/);

          if (!jsonMatch) {
              console.error('❌ No JSON found in LLM response');
              console.log('Raw LLM response:', data.response);
              // Don't throw, just return the default
              return defaultExtraction;
          }

          try {
              const extractedFeatures = JSON.parse(jsonMatch[0]);
              
              const result = {
                  ...defaultExtraction,
                  ...extractedFeatures,
                  extractedZipCode: extractedFeatures.zipCode || defaultExtraction.extractedZipCode
              };
              
              console.log('📊 Extracted features:');
              console.log(JSON.stringify(result, null, 2));
              
              return result;
          } catch (parseError) {
              console.error('❌ JSON parse error:', parseError);
              console.log('Raw JSON string:', jsonMatch[0]);
              // Don't throw, just return the default
              return defaultExtraction;
          }
      } catch (abortError) {
          clearTimeout(timeoutId);
          console.error('❌ Request aborted or timed out:', abortError);
          return defaultExtraction;
      }
  } catch (error) {
      console.error("❌ LLM feature extraction failed:", error);
      // Always return a valid result even on error
      return defaultExtraction;
  }
}