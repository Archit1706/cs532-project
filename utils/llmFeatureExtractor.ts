// utils/llmFeatureExtractor.ts
import { FeatureExtraction } from "@/types/chat";

export async function extractFeaturesWithLLM(query: string): Promise<FeatureExtraction> {
  console.log(`🔍 Extracting features for query: "${query}"`);
  
  // Create a more robust default extraction with initial parsing from the query
  const defaultExtraction: FeatureExtraction = {
    queryType: 'general',
    propertyFeatures: {},
    locationFeatures: {},
    actionRequested: null,
    filters: {},
    sortBy: undefined
  };

  // Do some direct regex extraction before even trying the LLM
  
  // Try to detect zip code
  const zipCodeMatch = query.match(/\b(\d{5})\b/);
  if (zipCodeMatch) {
    defaultExtraction.extractedZipCode = zipCodeMatch[1];
    console.log(`📍 Detected ZIP code: ${defaultExtraction.extractedZipCode}`);
  }

  // Extract city
  const cityRegex = /\bin\s+([A-Za-z\s.]+?)(?:,|\s+\d{5}|\s*$|\s+which|\s+with|\s+that|\s+has)/i;
  const cityMatch = query.match(cityRegex);
  if (cityMatch) {
    defaultExtraction.locationFeatures.city = cityMatch[1].trim();
    console.log(`🏙️ Detected city: ${defaultExtraction.locationFeatures.city}`);
  }

  // Try to detect "more than X bedrooms/bathrooms" patterns
  const moreThanBedroomsMatch = query.match(/more than (\d+)(?:\s+|-)(?:bed|bedroom|bedrooms|br)/i);
  if (moreThanBedroomsMatch) {
    const bedCount = parseInt(moreThanBedroomsMatch[1]);
    defaultExtraction.propertyFeatures.bedrooms = bedCount + 1;
    console.log(`🛏️ Detected more than ${bedCount} bedrooms requirement`);
    
    // Set to property search type as we detected bedrooms
    defaultExtraction.queryType = 'property_search';
    defaultExtraction.actionRequested = 'show_listings';
  }
  
  // Check for exact bedrooms match
  const exactBedroomsMatch = query.match(/(\d+)(?:\s+|-)(?:bed|bedroom|bedrooms|br)/i);
  if (exactBedroomsMatch && !moreThanBedroomsMatch) {
    const bedCount = parseInt(exactBedroomsMatch[1]);
    defaultExtraction.propertyFeatures.bedrooms = bedCount;
    console.log(`🛏️ Detected ${bedCount} bedrooms requirement`);
    
    // Set to property search type as we detected bedrooms
    defaultExtraction.queryType = 'property_search';
    defaultExtraction.actionRequested = 'show_listings';
  }
  
  // More than X bathrooms
  const moreThanBathroomsMatch = query.match(/more than (\d+)(?:\s+|-)(?:bath|bathroom|bathrooms|ba)/i);
  if (moreThanBathroomsMatch) {
    const bathCount = parseInt(moreThanBathroomsMatch[1]);
    defaultExtraction.propertyFeatures.bathrooms = bathCount + 1;
    console.log(`🚿 Detected more than ${bathCount} bathrooms requirement`);
    
    // Set to property search type as we detected bathrooms
    defaultExtraction.queryType = 'property_search';
    defaultExtraction.actionRequested = 'show_listings';
  }
  
  // Exact bathrooms match
  const exactBathroomsMatch = query.match(/(\d+)(?:\s+|-)(?:bath|bathroom|bathrooms|ba)/i);
  if (exactBathroomsMatch && !moreThanBathroomsMatch) {
    const bathCount = parseInt(exactBathroomsMatch[1]);
    defaultExtraction.propertyFeatures.bathrooms = bathCount;
    console.log(`🚿 Detected ${bathCount} bathrooms requirement`);
  }
  
  // Set property type if specified
  const propertyTypes = ['house', 'condo', 'apartment', 'townhouse'];
  for (const type of propertyTypes) {
    if (query.toLowerCase().includes(type)) {
      defaultExtraction.propertyFeatures.propertyType = type;
      console.log(`🏠 Detected property type: ${type}`);
      break;
    }
  }
  
  // Price range detection
  const priceRangeMatch = query.match(/between\s+\$?(\d+[k|K]?)\s+and\s+\$?(\d+[k|K]?)/i);
  if (priceRangeMatch) {
    const min = priceRangeMatch[1].toLowerCase().endsWith('k') 
      ? parseInt(priceRangeMatch[1]) * 1000 
      : parseInt(priceRangeMatch[1]);
      
    const max = priceRangeMatch[2].toLowerCase().endsWith('k') 
      ? parseInt(priceRangeMatch[2]) * 1000 
      : parseInt(priceRangeMatch[2]);
      
    defaultExtraction.filters.priceRange = [min, max];
    console.log(`💰 Detected price range: $${min} - $${max}`);
  } else {
    const underPriceMatch = query.match(/(?:under|below|less than)\s+\$?(\d+[k|K]?)/i);
    if (underPriceMatch) {
      const maxPrice = underPriceMatch[1].toLowerCase().endsWith('k') 
        ? parseInt(underPriceMatch[1]) * 1000 
        : parseInt(underPriceMatch[1]);
        
      defaultExtraction.filters.priceRange = [0, maxPrice];
      console.log(`💰 Detected maximum price: $${maxPrice}`);
    }
  }
  
  // Various action detection heuristics
  if (/show\s+(?:me\s+)?(?:the\s+)?properties/i.test(query) ||
     /find\s+(?:me\s+)?(?:a\s+)?home/i.test(query) ||
     /looking\s+for\s+(?:a\s+)?(?:house|property|apartment|condo)/i.test(query) ||
     /properties in/i.test(query)) {
    defaultExtraction.actionRequested = 'show_listings';
    defaultExtraction.queryType = 'property_search';
  } else if (/market|trends|price|appreciation/i.test(query)) {
    defaultExtraction.actionRequested = 'analyze_market';
    defaultExtraction.queryType = 'market_info';
  }
  
  // If we've extracted some meaningful property features, default to property search
  if (Object.keys(defaultExtraction.propertyFeatures).length > 0) {
    defaultExtraction.queryType = 'property_search';
    if (!defaultExtraction.actionRequested) {
      defaultExtraction.actionRequested = 'show_listings';
    }
  }

  try {
    console.log('🤖 Sending feature extraction request to LLM API...');
    
    // Try to make the API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      // Use a simplified prompt to avoid JSON parsing issues
      const llmResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Extract real estate search features from this query: "${query}"
          
          Return ONLY a valid JSON object like this example:
          {
            "queryType": "property_search",
            "propertyFeatures": {
              "bedrooms": 3,
              "bathrooms": 2
            },
            "locationFeatures": {
              "city": "Chicago"
            },
            "filters": {
              "priceRange": [200000, 500000]
            }
          }
          
          ONLY return JSON. NO explanation or other text.`,
          is_system_query: true
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!llmResponse.ok) {
        console.error(`❌ LLM API error: ${llmResponse.status}`);
        console.log('⚠️ Using regex-extracted features instead');
        return defaultExtraction;
      }

      const data = await llmResponse.json();
      console.log('✅ Received LLM response');
      
      // Use a more robust regex to find JSON in the LLM response
      const jsonMatch = data.response.match(/(\{[\s\S]*\})/);

      if (!jsonMatch) {
        console.error('❌ No JSON found in LLM response');
        console.log('Raw LLM response:', data.response);
        console.log('⚠️ Using regex-extracted features instead');
        return defaultExtraction;
      }

      try {
        // Try to parse the JSON
        const extractedFeatures = JSON.parse(jsonMatch[0]);
        
        // Merge with default extraction, prioritizing LLM features but ensuring
        // we don't lose regex-extracted features that LLM might have missed
        const result: FeatureExtraction = {
          ...defaultExtraction,
          queryType: extractedFeatures.queryType || defaultExtraction.queryType,
          propertyFeatures: {
            ...defaultExtraction.propertyFeatures,
            ...extractedFeatures.propertyFeatures
          },
          locationFeatures: {
            ...defaultExtraction.locationFeatures,
            ...extractedFeatures.locationFeatures
          },
          filters: {
            ...defaultExtraction.filters,
            ...extractedFeatures.filters
          },
          actionRequested: extractedFeatures.actionRequested || defaultExtraction.actionRequested,
          sortBy: extractedFeatures.sortBy || defaultExtraction.sortBy
        };
        
        // Make sure we don't lose ZIP code
        result.extractedZipCode = extractedFeatures.zipCode || defaultExtraction.extractedZipCode;
        
        console.log('📊 Final extracted features:');
        console.log(JSON.stringify(result, null, 2));
        
        return result;
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.log('Raw JSON string:', jsonMatch[0]);
        console.log('⚠️ Using regex-extracted features instead');
        return defaultExtraction;
      }
    } catch (abortError) {
      clearTimeout(timeoutId);
      console.error('❌ Request aborted or timed out:', abortError);
      console.log('⚠️ Using regex-extracted features instead');
      return defaultExtraction;
    }
  } catch (error) {
    console.error("❌ LLM feature extraction failed:", error);
    console.log('⚠️ Using regex-extracted features instead');
    return defaultExtraction;
  }
}