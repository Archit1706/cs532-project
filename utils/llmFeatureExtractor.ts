// Enhanced llmFeatureExtractor.ts

// Keep the existing function structure but enhance regex patterns
import { FeatureExtraction } from "@/types/chat";

export async function extractFeaturesWithLLM(query: string): Promise<FeatureExtraction> {
  console.log(`🔍 Extracting features for query: "${query}"`);
  
  // Create a more robust default extraction with initial parsing from the query
  const defaultExtraction: FeatureExtraction = {
    queryType: 'general',
    propertyFeatures: {},
    locationFeatures: {},
    actionRequested: null,
    filters: {
      amenities: []
    },
    sortBy: undefined
  };

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

  // ENHANCEMENT: Better bedroom range detection
  // 1. Range pattern (e.g., "2-3 bedrooms", "2 to 3 bedrooms")
  const bedroomRangeMatch = query.match(/(\d+)(?:-|\s+to\s+)(\d+)\s+(?:bed|bedroom|bedrooms|br)/i);
  if (bedroomRangeMatch) {
    const minBeds = parseInt(bedroomRangeMatch[1]);
    const maxBeds = parseInt(bedroomRangeMatch[2]);
    defaultExtraction.propertyFeatures.bedrooms = [minBeds, maxBeds];
    console.log(`🛏️ Detected bedroom range: ${minBeds}-${maxBeds} bedrooms`);
    
    // Set to property search type as we detected bedrooms
    defaultExtraction.queryType = 'property_search';
    defaultExtraction.actionRequested = 'show_listings';
  } 
  // 2. "At least X bedrooms" pattern
  else {
    const moreThanBedroomsMatch = query.match(/(?:at\s+least|more\s+than)\s+(\d+)\s+(?:bed|bedroom|bedrooms|br)/i);
    if (moreThanBedroomsMatch) {
      const minBeds = parseInt(moreThanBedroomsMatch[1]);
      defaultExtraction.propertyFeatures.bedrooms = [minBeds, 10]; // null indicates no upper limit
      console.log(`🛏️ Detected at least ${minBeds} bedrooms requirement`);
      
      // Set to property search type as we detected bedrooms
      defaultExtraction.queryType = 'property_search';
      defaultExtraction.actionRequested = 'show_listings';
    } 
    // 3. Exact bedrooms match
    else {
      const exactBedroomsMatch = query.match(/(\d+)\s+(?:bed|bedroom|bedrooms|br)/i);
      if (exactBedroomsMatch) {
        const bedCount = parseInt(exactBedroomsMatch[1]);
        defaultExtraction.propertyFeatures.bedrooms = bedCount;
        console.log(`🛏️ Detected ${bedCount} bedrooms requirement`);
        
        // Set to property search type as we detected bedrooms
        defaultExtraction.queryType = 'property_search';
        defaultExtraction.actionRequested = 'show_listings';
      }
    }
  }
  
  // ENHANCEMENT: Better bathroom range detection
  // 1. Range pattern
  const bathroomRangeMatch = query.match(/(\d+(?:\.\d+)?)(?:-|\s+to\s+)(\d+(?:\.\d+)?)\s+(?:bath|bathroom|bathrooms|ba)/i);
  if (bathroomRangeMatch) {
    const minBaths = parseFloat(bathroomRangeMatch[1]);
    const maxBaths = parseFloat(bathroomRangeMatch[2]);
    defaultExtraction.propertyFeatures.bathrooms = [minBaths, maxBaths];
    console.log(`🚿 Detected bathroom range: ${minBaths}-${maxBaths} bathrooms`);
  } 
  // 2. "At least X bathrooms" pattern
  else {
    const moreThanBathroomsMatch = query.match(/(?:at\s+least|more\s+than)\s+(\d+(?:\.\d+)?)\s+(?:bath|bathroom|bathrooms|ba)/i);
    if (moreThanBathroomsMatch) {
      const minBaths = parseFloat(moreThanBathroomsMatch[1]);
      defaultExtraction.propertyFeatures.bathrooms = [minBaths, 10]; // null indicates no upper limit
      console.log(`🚿 Detected at least ${minBaths} bathrooms requirement`);
    } 
    // 3. Exact bathrooms match
    else {
      const exactBathroomsMatch = query.match(/(\d+(?:\.\d+)?)\s+(?:bath|bathroom|bathrooms|ba)/i);
      if (exactBathroomsMatch) {
        const bathCount = parseFloat(exactBathroomsMatch[1]);
        defaultExtraction.propertyFeatures.bathrooms = bathCount;
        console.log(`🚿 Detected ${bathCount} bathrooms requirement`);
      }
    }
  }
  
  // ENHANCEMENT: Expanded property type detection
  const propertyTypes = ['house', 'condo', 'apartment', 'townhouse', 'duplex', 'single family', 'multi-family'];
  for (const type of propertyTypes) {
    if (query.toLowerCase().includes(type)) {
      defaultExtraction.propertyFeatures.propertyType = type;
      console.log(`🏠 Detected property type: ${type}`);
      
      // Set to property search type if we found a property type
      if (!defaultExtraction.queryType) {
        defaultExtraction.queryType = 'property_search';
        defaultExtraction.actionRequested = 'show_listings';
      }
      break;
    }
  }
  
  // ENHANCEMENT: Better price range detection
  // 1. Between $X and $Y pattern
  const priceRangeMatch = query.match(/(?:between|from)\s+\$?(\d+(?:\.\d+)?[k|K|m|M]?)\s+(?:and|to)\s+\$?(\d+(?:\.\d+)?[k|K|m|M]?)/i);
  if (priceRangeMatch) {
    const minStr = priceRangeMatch[1].toLowerCase();
    const maxStr = priceRangeMatch[2].toLowerCase();
    
    // Handle K and M suffixes (e.g., 500k, 1.5M)
    const min = minStr.endsWith('k') 
      ? parseFloat(minStr) * 1000 
      : minStr.endsWith('m') 
        ? parseFloat(minStr) * 1000000 
        : parseFloat(minStr);
      
    const max = maxStr.endsWith('k') 
      ? parseFloat(maxStr) * 1000 
      : maxStr.endsWith('m') 
        ? parseFloat(maxStr) * 1000000 
        : parseFloat(maxStr);
      
    defaultExtraction.filters.priceRange = [min, max];
    console.log(`💰 Detected price range: $${min} - $${max}`);
  } 
  // 2. "Under $X" pattern
  else {
    const underPriceMatch = query.match(/(?:under|below|less than|up to|no more than)\s+\$?(\d+(?:\.\d+)?[k|K|m|M]?)/i);
    if (underPriceMatch) {
      const maxStr = underPriceMatch[1].toLowerCase();
      
      // Handle K and M suffixes
      const maxPrice = maxStr.endsWith('k') 
        ? parseFloat(maxStr) * 1000 
        : maxStr.endsWith('m') 
          ? parseFloat(maxStr) * 1000000 
          : parseFloat(maxStr);
          
      defaultExtraction.filters.priceRange = [0, maxPrice];
      console.log(`💰 Detected maximum price: $${maxPrice}`);
    }
    // 3. "At least $X" or "Minimum $X" pattern
    else {
      const minPriceMatch = query.match(/(?:at least|minimum|more than|over|above)\s+\$?(\d+(?:\.\d+)?[k|K|m|M]?)/i);
      if (minPriceMatch) {
        const minStr = minPriceMatch[1].toLowerCase();
        
        // Handle K and M suffixes
        const minPrice = minStr.endsWith('k') 
          ? parseFloat(minStr) * 1000 
          : minStr.endsWith('m') 
            ? parseFloat(minStr) * 1000000 
            : parseFloat(minStr);
            
        defaultExtraction.filters.priceRange = [minPrice, 100000000]; // null indicates no upper limit
        console.log(`💰 Detected minimum price: $${minPrice}`);
      }
    }
  }
  
  // ENHANCEMENT: Square footage detection
  // 1. Range pattern
  const sqftRangeMatch = query.match(/(\d+(?:\.\d+)?)(?:-|\s+to\s+)(\d+(?:\.\d+)?)\s+(?:sq\s*ft|square\s*feet|sqft)/i);
  if (sqftRangeMatch) {
    const minSqft = parseFloat(sqftRangeMatch[1]);
    const maxSqft = parseFloat(sqftRangeMatch[2]);
    defaultExtraction.propertyFeatures.squareFeet = [minSqft, maxSqft];
    console.log(`📏 Detected square footage range: ${minSqft}-${maxSqft} sq ft`);
  } 
  // 2. "At least X sq ft" pattern
  else {
    const minSqftMatch = query.match(/(?:at least|minimum|more than)\s+(\d+(?:\.\d+)?)\s+(?:sq\s*ft|square\s*feet|sqft)/i);
    if (minSqftMatch) {
      const minSqft = parseFloat(minSqftMatch[1]);
      defaultExtraction.propertyFeatures.squareFeet = [minSqft, 1000000000000]; // null indicates no upper limit
      console.log(`📏 Detected minimum square footage: ${minSqft} sq ft`);
    } 
    // 3. Exact square footage match
    else {
      const exactSqftMatch = query.match(/(\d+(?:\.\d+)?)\s+(?:sq\s*ft|square\s*feet|sqft)/i);
      if (exactSqftMatch) {
        const sqft = parseFloat(exactSqftMatch[1]);
        defaultExtraction.propertyFeatures.squareFeet = sqft;
        console.log(`📏 Detected ${sqft} sq ft requirement`);
      }
    }
  }
  
  // ENHANCEMENT: Year built detection
  // 1. Range pattern
  const yearBuiltRangeMatch = query.match(/built\s+(?:between|from)\s+(\d{4})\s+(?:and|to)\s+(\d{4})/i);
  if (yearBuiltRangeMatch) {
    const minYear = parseInt(yearBuiltRangeMatch[1]);
    const maxYear = parseInt(yearBuiltRangeMatch[2]);
    defaultExtraction.propertyFeatures.yearBuilt = [minYear, maxYear];
    console.log(`🏗️ Detected year built range: ${minYear}-${maxYear}`);
  } 
  // 2. "Built after X" pattern
  else {
    const afterYearMatch = query.match(/built\s+(?:after|since|newer than)\s+(\d{4})/i);
    if (afterYearMatch) {
      const minYear = parseInt(afterYearMatch[1]);
      defaultExtraction.propertyFeatures.yearBuilt = [minYear, 2030]; // null indicates no upper limit
      console.log(`🏗️ Detected minimum build year: ${minYear}`);
    } 
    // 3. "Built before X" pattern
    else {
      const beforeYearMatch = query.match(/built\s+(?:before|prior to|older than)\s+(\d{4})/i);
      if (beforeYearMatch) {
        const maxYear = parseInt(beforeYearMatch[1]);
        defaultExtraction.propertyFeatures.yearBuilt = [0, maxYear]; // 0 indicates no lower limit
        console.log(`🏗️ Detected maximum build year: ${maxYear}`);
      }
    }
  }
  
  // ENHANCEMENT: Amenities detection
  const amenities = [
    'pool', 'garage', 'basement', 'patio', 'deck', 'balcony', 'fireplace', 
    'backyard', 'garden', 'ac', 'air conditioning', 'central air', 'heating',
    'washer', 'dryer', 'dishwasher', 'hardwood', 'granite', 'stainless steel',
    'fenced yard', 'pet friendly', 'view', 'waterfront', 'elevator'
  ];
  
  const detectedAmenities = [];
  for (const amenity of amenities) {
    if (query.toLowerCase().includes(amenity)) {
      detectedAmenities.push(amenity);
      console.log(`🏝️ Detected amenity: ${amenity}`);
    }
  }
  
  if (detectedAmenities.length > 0) {
    defaultExtraction.filters.amenities = detectedAmenities;
  }
  
  // ENHANCEMENT: Transit-Amenities workflow detection
  const transitAmenityTypes = [
    'restaurant', 'coffee shop', 'cafe', 'coffee', 'bar', 'pub', 'grocery', 
    'supermarket', 'store', 'shop', 'mall', 'shopping center', 'school', 
    'university', 'college', 'hospital', 'clinic', 'doctor', 'dentist', 
    'pharmacy', 'drugstore', 'park', 'playground', 'gym', 'fitness', 
    'theater', 'cinema', 'movie', 'museum', 'library', 'church', 'temple',
    'mosque', 'transportation', 'bus', 'train', 'subway', 'station', 'transit',
    'airport', 'gas station', 'bank', 'atm', 'post office', 'police', 'fire station'
  ];
  
  const amenityPatterns = [
    /(?:nearby|close to|close by|within \d+ miles of|within walking distance of|near)\s+(?:a\s+)?([a-z\s]+)/i,
    /(?:find|show|locate|search for)\s+(?:a\s+)?([a-z\s]+)\s+(?:nearby|close|near|in the area)/i,
    /(?:find|show|locate|search for)\s+(?:the\s+)?([a-z\s]+)\s+(?:around|in)/i,
    /(?:how far is the|where is the nearest|how long to get to the|route to|directions to)\s+(?:the\s+)?([a-z\s]+)/i
  ];
  
  let transitAmenityType = null;
  
  // First check if we see any amenity types directly mentioned
  for (const type of transitAmenityTypes) {
    if (query.toLowerCase().includes(type)) {
      transitAmenityType = type;
      break;
    }
  }
  
  // If not, try to extract it from patterns
  if (!transitAmenityType) {
    for (const pattern of amenityPatterns) {
      const match = query.match(pattern);
      if (match) {
        const extractedType = match[1].trim().toLowerCase();
        // See if the extracted type contains any of our known amenity types
        for (const type of transitAmenityTypes) {
          if (extractedType.includes(type)) {
            transitAmenityType = type;
            break;
          }
        }
        if (transitAmenityType) break;
      }
    }
  }
  
  // If we found a transit/amenity type, set the query type accordingly
  if (transitAmenityType) {
    defaultExtraction.queryType = 'transit_amenities';
    defaultExtraction.actionRequested = 'show_amenities';
    defaultExtraction.locationFeatures.proximity = {
      to: transitAmenityType,
      distance: 1, // Default to 1 mile
      unit: 'miles'
    };
    console.log(`🏙️ Detected transit/amenity query for: ${transitAmenityType}`);
    
    // Extract distance if specified
    const distanceMatch = query.match(/within\s+(\d+(?:\.\d+)?)\s+(mile|miles|km|kilometers)/i);
    if (distanceMatch) {
      const distance = parseFloat(distanceMatch[1]);
      const unit = distanceMatch[2].toLowerCase().startsWith('mile') ? 'miles' : 'km';
      defaultExtraction.locationFeatures.proximity.distance = distance;
      defaultExtraction.locationFeatures.proximity.unit = unit;
      console.log(`📏 Detected proximity: within ${distance} ${unit}`);
    }
    
    // Check if route is requested
    if (/route|direction|path|how to get|way to/i.test(query)) {
      defaultExtraction.actionRequested = 'show_route';
      console.log(`🗺️ Detected route request`);
    }
  }
  
  // Various action detection heuristics for property searches
  if (/show\s+(?:me\s+)?(?:the\s+)?properties/i.test(query) ||
     /find\s+(?:me\s+)?(?:a\s+)?home/i.test(query) ||
     /looking\s+for\s+(?:a\s+)?(?:house|property|apartment|condo)/i.test(query) ||
     /properties in/i.test(query) ||
     /houses? (?:in|around|near)/i.test(query) ||
     /(?:buy|rent|purchase) (?:a )?(?:house|home|property|apartment|condo)/i.test(query)) {
    defaultExtraction.actionRequested = 'show_listings';
    defaultExtraction.queryType = 'property_search';
    console.log(`🔍 Detected property search request`);
  } 
  // Market analysis requests
  else if (/market|trends|price|appreciation|depreciation|statistics|median|average|analysis|report|data|forecast|prediction|outlook/i.test(query)) {
    defaultExtraction.actionRequested = 'analyze_market';
    defaultExtraction.queryType = 'market_info';
    console.log(`📊 Detected market analysis request`);
  }
  
  // ENHANCEMENT: Sorting preferences
  if (/cheapest|lowest price|affordable|least expensive|low to high|ascending/i.test(query)) {
    defaultExtraction.sortBy = 'price_asc';
    console.log(`⬆️ Detected sort preference: price ascending`);
  } else if (/expensive|luxury|high end|most expensive|priciest|premium|high to low|descending/i.test(query)) {
    defaultExtraction.sortBy = 'price_desc';
    console.log(`⬇️ Detected sort preference: price descending`);
  } else if (/newest|recent|new listing|just listed|latest/i.test(query)) {
    defaultExtraction.sortBy = 'newest';
    console.log(`📅 Detected sort preference: newest first`);
  } else if (/oldest|earliest/i.test(query)) {
    defaultExtraction.sortBy = 'oldest';
    console.log(`📅 Detected sort preference: oldest first`);
  } else if (/biggest|largest|most spacious|roomiest/i.test(query)) {
    defaultExtraction.sortBy = 'sqft_desc';
    console.log(`📏 Detected sort preference: largest first`);
  }
  
  // If we've extracted some meaningful property features, default to property search
  if (Object.keys(defaultExtraction.propertyFeatures).length > 0 && !defaultExtraction.queryType) {
    defaultExtraction.queryType = 'property_search';
    defaultExtraction.actionRequested = 'show_listings';
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
          message: `Extract real estate and amenity search features from this query: "${query}"
          
          Return ONLY a valid JSON object like this example:
          {
            "queryType": "property_search",
            "propertyFeatures": {
              "bedrooms": 3,
              "bathrooms": 2
            },
            "locationFeatures": {
              "city": "Chicago",
              "proximity": {
                "to": "coffee shop",
                "distance": 1,
                "unit": "miles"
              }
            },
            "filters": {
              "priceRange": [200000, 500000],
              "amenities": ["pool", "garage"]
            },
            "actionRequested": "show_listings",
            "sortBy": "price_asc"
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