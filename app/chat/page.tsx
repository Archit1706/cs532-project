"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
// At the top with other imports
import ReactMarkdown from 'react-markdown';


interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
}

// Add this interface near the top of app/chat/page.tsx with other interfaces
// Feature extraction interface
interface FeatureExtraction {
  queryType: 'general' | 'property_search' | 'property_detail' | 'market_info' | 'legal' | 'preferences';
  propertyFeatures: {
    bedrooms?: number | [number, number]; // Exact or range
    bathrooms?: number | [number, number];
    squareFeet?: number | [number, number];
    propertyType?: string; // house, condo, apartment, etc.
    yearBuilt?: number | [number, number];
    amenities?: string[];
    parking?: boolean | string;
    newConstruction?: boolean;
  };
  locationFeatures: {
    city?: string;
    neighborhood?: string;
    zipCode?: string;
    proximity?: Array<{
      to?: string; // schools, transit, downtown, etc.
      distance?: number;
      unit?: 'miles' | 'minutes' | string;
    }>;
  };
  extractedZipCode?: string;
  actionRequested?: 'show_listings' | 'show_details' | 'show_restaurants' | 'show_transit' | 'analyze_market' | null;
  filters: {
    priceRange?: [number, number];
    maxPrice?: number;
    minPrice?: number;
    maxTaxes?: number;
    mustHave?: string[];
    mustNotHave?: string[];
    schoolRating?: number;
    walkScore?: number;
    crimeRate?: string; // low, medium, high
  };
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest' | string;
  timeFrame?: 'immediately' | 'within_month' | 'within_year' | string;
}


// Add error property to LocationResult interface
interface LocationResult {
  title: string;
  address: string;
  distance?: number;
  category?: string;
}

// Add error property to the data responses
interface LocationResponse {
  results: LocationResult[];
  error?: string;
}
interface LocationData {
  restaurants: LocationResult[];
  transit: LocationResult[];
  zipCode: string;
}




const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: 'I can help you search properties, track market trends, set preferences, and answer legal questions. What would you like to know?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [zipCode, setZipCode] = useState<string>(''); // Changed to empty by default
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null); // Added for property details view

  const [searchedZipCodes, setSearchedZipCodes] = useState<string[]>([]);
  // const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Zip code and location data
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

// Add this to your Chat component's state declarations
const [selectedLanguage, setSelectedLanguage] = useState('en');
const [isTranslating, setIsTranslating] = useState(false);

  // Add to your state variables
  const [activeTab, setActiveTab] = useState<'restaurants' | 'transit' | 'properties' | 'market' | null>('properties');
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState<boolean>(false);

    // Add to existing state variables in app/chat/page.tsx
    const [marketTrends, setMarketTrends] = useState<any>(null);
    const [isLoadingMarketTrends, setIsLoadingMarketTrends] = useState<boolean>(false);
    
    // Add fetch function for market trends
    const fetchMarketTrends = async (location?: string, zipCode?: string) => {
        console.log('Fetching market trends for:', location || zipCode);
        
        setIsLoadingMarketTrends(true);
        
        try {
          const response = await fetch('/api/market_trends', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              location: location,
              zipCode: zipCode
            }),
          });
      
          if (!response.ok) {
            throw new Error(`Market trends API returned ${response.status}`);
          }
      
          const data = await response.json();
          console.log('Market trends data:', data);
          
          setMarketTrends(data.trends);
        } catch (error) {
          console.error('Error fetching market trends:', error);
        } finally {
          setIsLoadingMarketTrends(false);
        }
      };
    

  interface Property {
    imgSrc?: string;
    address: string;
    price: number | string;
    beds: number;
    baths: number;
    sqft: number | string;
    type: string;
  }

  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'hi', name: 'Hindi' },
    { code: 'zh', name: 'Chinese' },
    { code: 'de', name: 'German' }
  ];
  


  // Check backend connectivity on component mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();

        if (data.backend === 'connected') {
          console.log('Backend connected:', data);
          setBackendStatus('connected');
        } else {
          console.error('Backend connection issue:', data);
          setBackendStatus('error');
        }
      } catch (error) {
        console.error('Health check error:', error);
        setBackendStatus('error');
      }
    };

    checkBackendStatus();
    //fetchLocationData('02108'); // Load default Boston data on mount
  }, []);

  // Auto-scroll to bottom when messages change
  // Use a single useEffect for scroll behavior
  useEffect(() => {
    if (messagesEndRef.current) {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages]);


// Add this function to handle language selection
const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setSelectedLanguage(e.target.value);
};


// Tool calling agent function that uses LLM for feature extraction with fallback
const analyzeQueryForTools = async (query: string) => {
  // Try LLM-based analysis first
  try {
    const llmAnalysis = await analyzeQueryForTools_by_LLM(query);
    console.log('LLM extracted features:', llmAnalysis);
    return llmAnalysis;
  } catch (error) {
    console.warn('Error using LLM for feature extraction, falling back to pattern matching:', error);
    return analyzeQueryForTools_by_PatternMatching(query);
  }
};


// LLM-based feature extraction
const analyzeQueryForTools_by_LLM = async (query: string) => {
  const prompt = `
  Analyze this real estate related query and extract mentioned features. 
  For each feature, extract specific criteria if present.
  Return ONLY a JSON object with the following structure, with null for any features not mentioned:
  
  {
    "homeValuation": null or {criteria},
    "propertySearch": null or {criteria like bedrooms, bathrooms, price, etc},
    "localAmenities": null or {types of amenities mentioned},
    "marketTrends": null or {trend types mentioned},
    "commute": null or {destinations, transport modes},
    "taxation": null or {tax types mentioned},
    "insurance": null or {insurance types},
    "mortgageCalculation": null or {mortgage details},
    "neighborhoodSafety": null or {safety concerns},
    "schoolQuality": null or {school types, levels}
  }
  
  Only include features explicitly or implicitly mentioned in the query. Do not add features that aren't relevant to the query.
  
  User query: "${query}"
  
  JSON output:
  `;

  try {
    // Call to your LLM endpoint - using fetch as an example
    const response = await fetch('/api/analyze-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`LLM analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const extractedFeatures = JSON.parse(data.result);
    
    // Transform into expected format
    const detectedFeatures: Partial<Record<keyof typeof apiMapping, string[]>> = {};
    const extractedCriteria: { [key: string]: any } = {};
    
    // Map of feature names to potential APIs
    const apiMapping = {
      homeValuation: ["Zillow API", "Redfin API", "County Tax Records API"],
      propertySearch: ["MLS API", "Zillow API", "Realtor.com API"],
      localAmenities: ["Google Places API", "Yelp API", "Foursquare API"],
      marketTrends: ["Case-Shiller Index API", "Federal Housing Finance Agency API"],
      commute: ["Google Maps API", "Transit API", "Waze API"],
      taxation: ["County Tax Assessor API", "Property Tax Calculator API"],
      insurance: ["Insurance Quote API", "FEMA Flood Maps API"],
      mortgageCalculation: ["Mortgage Calculator API", "Bank Rate API"],
      neighborhoodSafety: ["Crime Data API", "Neighborhood Scout API"],
      schoolQuality: ["GreatSchools API", "School District API"]
    };
    
    // Build the features and criteria objects
    Object.entries(extractedFeatures).forEach(([feature, criteria]) => {
      if (criteria !== null) {
        detectedFeatures[feature as keyof typeof apiMapping] = apiMapping[feature as keyof typeof apiMapping] || ["Generic API"];
        
        // Merge any extracted criteria
        if (typeof criteria === 'object') {
          Object.entries(criteria).forEach(([key, value]) => {
            extractedCriteria[key] = value;
          });
        }
      }
    });
    
    return {
      detectedFeatures,
      extractedCriteria,
      potentialApis: Object.values(detectedFeatures).flat()
    };
  } catch (error) {
    console.error('Error in LLM feature extraction:', error);
    throw error; // Rethrow to trigger fallback
  }
};


// Tool calling agent function to analyze user queries and identify potential API calls
const analyzeQueryForTools_by_PatternMatching = (query: string) => {
  // Features to detect
  const features = {
    homeValuation: {
      patterns: [
        /worth/i, /value/i, /price of/i, /estimate/i, /appraisal/i, 
        /how much (is|would|could)/i, /market value/i
      ],
      apiOptions: ["Zillow API", "Redfin API", "County Tax Records API"]
    },
    propertySearch: {
      patterns: [
        /find/i, /search/i, /looking for/i, /homes with/i, /properties with/i,
        /bedrooms/i, /bathrooms/i, /square feet/i, /sqft/i, /sq ft/i,
        /garage/i, /pool/i, /yard/i, /lot size/i, /price range/i,
        /under \$([\d,]+)/i, /above \$([\d,]+)/i, /between \$([\d,]+) and \$([\d,]+)/i
      ],
      apiOptions: ["MLS API", "Zillow API", "Realtor.com API"]
    },
    localAmenities: {
      patterns: [
        /school/i, /restaurant/i, /park/i, /shopping/i, /grocery/i,
        /nearby/i, /close to/i, /walking distance/i, /entertainment/i,
        /theater/i, /hospital/i, /medical/i, /daycare/i, /childcare/i
      ],
      apiOptions: ["Google Places API", "Yelp API", "Foursquare API", "GreatSchools API"]
    },
    marketTrends: {
      patterns: [
        /trend/i, /appreciation/i, /depreciation/i, /investment/i,
        /growth/i, /future value/i, /market forecast/i, /price history/i,
        /increasing/i, /decreasing/i, /development/i, /gentrification/i
      ],
      apiOptions: ["Case-Shiller Index API", "Federal Housing Finance Agency API", "Local MLS Market Reports"]
    },
    commute: {
      patterns: [
        /commute/i, /travel time/i, /drive/i, /traffic/i, /distance/i,
        /public transportation/i, /subway/i, /bus/i, /train/i,
        /how long to/i, /how far from/i, /work/i, /office/i, /school commute/i
      ],
      apiOptions: ["Google Maps API", "Transit API", "Waze API"]
    },
    taxation: {
      patterns: [
        /property tax/i, /tax rate/i, /assessment/i, /millage/i,
        /tax bill/i, /exemption/i, /tax break/i
      ],
      apiOptions: ["County Tax Assessor API", "Property Tax Calculator API"]
    },
    insurance: {
      patterns: [
        /insurance/i, /homeowner('s)? insurance/i, /coverage/i, /premium/i,
        /flood insurance/i, /hazard insurance/i
      ],
      apiOptions: ["Insurance Quote API", "FEMA Flood Maps API"]
    },
    mortgageCalculation: {
      patterns: [
        /mortgage/i, /loan/i, /interest rate/i, /down payment/i,
        /monthly payment/i, /amortization/i, /term/i, /closing cost/i,
        /pre(-)approval/i, /qualification/i, /affordability/i
      ],
      apiOptions: ["Mortgage Calculator API", "Bank Rate API", "Loan Comparison API"]
    },
    neighborhoodSafety: {
      patterns: [
        /safe/i, /safety/i, /crime/i, /security/i, /police/i,
        /neighborhood safety/i, /crime rate/i
      ],
      apiOptions: ["Crime Data API", "Neighborhood Scout API", "Local Police Department Data"]
    },
    schoolQuality: {
      patterns: [
        /school(s)?/i, /education/i, /district/i, /rating/i,
        /elementary/i, /middle/i, /high school/i, /public school/i, /private school/i
      ],
      apiOptions: ["GreatSchools API", "School District API", "Department of Education Data"]
    }
  };

  // Detect features in query
  const detectedFeatures = {};
  let extractedCriteria = {};
/*
  // Check for each feature
  Object.entries(features).forEach(([feature, { patterns, apiOptions }]) => {
    if (patterns.some(pattern => pattern.test(query))) {
      //detectedFeatures[feature] = apiOptions;
      
      // Extract specific criteria based on feature
      switch (feature) {
        case 'propertySearch':
          // Extract price ranges
          const priceRangeMatch = query.match(/between \$([\d,]+) and \$([\d,]+)/i);
          if (priceRangeMatch) {
            extractedCriteria.minPrice = priceRangeMatch[1].replace(/,/g, '');
            extractedCriteria.maxPrice = priceRangeMatch[2].replace(/,/g, '');
          } else {
            const maxPriceMatch = query.match(/under \$([\d,]+)/i);
            if (maxPriceMatch) {
              extractedCriteria.maxPrice = maxPriceMatch[1].replace(/,/g, '');
            }
            
            const minPriceMatch = query.match(/above \$([\d,]+)/i);
            if (minPriceMatch) {
              extractedCriteria.minPrice = minPriceMatch[1].replace(/,/g, '');
            }
          }
          
          // Extract bedrooms
          const bedroomMatch = query.match(/(\d+)\s*bed/i);
          if (bedroomMatch) {
            extractedCriteria.bedrooms = bedroomMatch[1];
          }
          
          // Extract bathrooms
          const bathroomMatch = query.match(/(\d+)\s*bath/i);
          if (bathroomMatch) {
            extractedCriteria.bathrooms = bathroomMatch[1];
          }
          
          // Extract square footage
          const sqftMatch = query.match(/(\d+)\s*(sq\s*ft|square\s*feet|sqft)/i);
          if (sqftMatch) {
            extractedCriteria.minSqft = sqftMatch[1];
          }
          break;
          
        case 'commute':
          // Extract destination
          const destinationMatch = query.match(/to\s+([^?.,]+)/i);
          if (destinationMatch) {
            extractedCriteria.destination = destinationMatch[1].trim();
          }
          break;
          
        // Add more extraction logic for other features as needed
      
    }
  });

  // Look for specific addresses that might need geocoding
  const addressMatch = query.match(/(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl|Terrace|Ter))/i);
  if (addressMatch) {
    extractedCriteria.address = addressMatch[1];
    detectedFeatures['geocoding'] = ["Google Geocoding API", "MapBox API"];
  }
}*/
  console.log('Detected features:', detectedFeatures);
  console.log('Extracted criteria:', extractedCriteria);

  return {
    detectedFeatures,
    extractedCriteria,
    potentialApis: Object.values(detectedFeatures).flat()
  };
};

// Language selector with translation indicator
const LanguageSelectorWithIndicator = () => {
  return (
    <div className="p-3 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <label htmlFor="language-select" className="block text-sm font-medium text-slate-700">
          Chat Language:
        </label>
        {isTranslating && (
          <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Translating...
          </div>
        )}
      </div>
      <div className="relative mt-1">
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          disabled={isTranslating}
        >
          {languageOptions.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
};


// Add floating translation indicator (more visible)
const TranslationIndicator = () => {
  if (!isTranslating) return null;
  
  return (
    <div className="fixed bottom-6 right-6 bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex items-center space-x-2 border border-blue-200 z-50 animate-pulse">
      <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span className="text-blue-800 font-medium">Translating {selectedLanguage !== 'en' ? 'to ' + languageOptions.find(l => l.code === selectedLanguage)?.name : ''}...</span>
    </div>
  );
};

// Add this helper function for translating text
const translateText = async (text: string, sourceLanguage: string, targetLanguage: string) => {
  // Skip translation if source and target are the same
  if (sourceLanguage === targetLanguage) {
    return text;
  }

  setIsTranslating(true);
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage
      }),
    });

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  } finally {
    setIsTranslating(false);
  }
};


// Replace the current analyzeUserQuery function in app/chat/page.tsx
// In app/chat/page.tsx - replace the current analyzeUserQuery function

// Feature extractor for real estate queries
function extractRealEstateFeatures(query: string): FeatureExtraction {
  console.log("Extracting features from query:", query);
  
  // Initialize extraction object
  const extraction: FeatureExtraction = {
    queryType: 'general',
    extractedZipCode: undefined,
    propertyFeatures: {},
    locationFeatures: {},
    actionRequested: null,
    filters: {},
    sortBy: undefined
  };
  
  // Extract zip code
  const zipCodeMatch = query.match(/\b(\d{5})\b/);
  if (zipCodeMatch) {
    extraction.extractedZipCode = zipCodeMatch[1];
  }
  
  // Determine query type
  if (/(find|search|looking for|properties|homes|houses|apartments)/i.test(query)) {
    extraction.queryType = 'property_search';
  } else if (/(market|trends|prices|appreciation|value)/i.test(query)) {
    extraction.queryType = 'market_info';
  } else if (/(legal|laws|regulations|taxes|tax|zoning)/i.test(query)) {
    extraction.queryType = 'legal';
  } else if (/(details|more about|tell me about)/i.test(query)) {
    extraction.queryType = 'property_detail';
  }
  
  // Extract property features
  // Bedrooms
  const bedroomMatch = query.match(/(\d+)\s*(?:bed|bedroom|br)/i);
  if (bedroomMatch) {
    extraction.propertyFeatures.bedrooms = parseInt(bedroomMatch[1]);
  }
  
  // Bathrooms
  const bathroomMatch = query.match(/(\d+)\s*(?:bath|bathroom|ba)/i);
  if (bathroomMatch) {
    extraction.propertyFeatures.bathrooms = parseInt(bathroomMatch[1]);
  }
  
  // Property type
  ['house', 'apartment', 'condo', 'townhouse'].forEach(type => {
    if (query.toLowerCase().includes(type)) {
      extraction.propertyFeatures.propertyType = type;
    }
  });
  
  // Square footage
  const sqftMatch = query.match(/(\d+)\s*(?:sq\s*ft|square\s*feet|sqft)/i);
  if (sqftMatch) {
    extraction.propertyFeatures.squareFeet = parseInt(sqftMatch[1]);
  }
  
  // Location features
  // City detection
  const cityMatch = query.match(/\b(?:in|near)\s+([A-Za-z\s.]+?)(?:\s+\d{5}|\s*$|\s+and|\s+near)/i);
  if (cityMatch) {
    extraction.locationFeatures.city = cityMatch[1].trim();
  }
  
  // Proximity requirements
  const proximityTypes = ['school', 'transit', 'restaurant', 'downtown', 'park', 'grocery', 'hospital'];
  for (const type of proximityTypes) {
    if (query.toLowerCase().includes(`near ${type}`) || query.toLowerCase().includes(`close to ${type}`)) {
      extraction.locationFeatures.proximity = [{
        to: type,
        distance: 1, // Default distance
        unit: 'miles'
      }];
      
      // If it's transit, set action to show transit
      if (type === 'transit') {
        extraction.actionRequested = 'show_transit';
      } else if (type === 'restaurant') {
        extraction.actionRequested = 'show_restaurants';
      }
      break;
    }
  }
  
  // Action requested
  if (/show\s+(?:me\s+)?(?:the\s+)?properties/i.test(query) || 
      /find\s+(?:me\s+)?(?:a\s+)?home/i.test(query) ||
      /looking\s+for\s+(?:a\s+)?(?:house|property|apartment|condo)/i.test(query)) {
    extraction.actionRequested = 'show_listings';
  } else if (/market|trends|price|appreciation/i.test(query)) {
    extraction.actionRequested = 'analyze_market';
  }
  
  // Price filters
  const priceRangeMatch = query.match(/between\s+\$?(\d+[k|K]?)\s+and\s+\$?(\d+[k|K]?)/i);
  if (priceRangeMatch) {
    const min = priceRangeMatch[1].toLowerCase().endsWith('k') ? 
      parseInt(priceRangeMatch[1].slice(0, -1)) * 1000 : 
      parseInt(priceRangeMatch[1]);
    
    const max = priceRangeMatch[2].toLowerCase().endsWith('k') ? 
      parseInt(priceRangeMatch[2].slice(0, -1)) * 1000 : 
      parseInt(priceRangeMatch[2]);
    
    extraction.filters.priceRange = [min, max];
  } else {
    // Check for max price
    const maxPriceMatch = query.match(/(?:under|below|less than)\s+\$?(\d+[k|K]?)/i);
    if (maxPriceMatch) {
      const maxPrice = maxPriceMatch[1].toLowerCase().endsWith('k') ? 
        parseInt(maxPriceMatch[1].slice(0, -1)) * 1000 : 
        parseInt(maxPriceMatch[1]);
      
      extraction.filters.priceRange = [0, maxPrice];
    }
  }
  
  // Sort preference
  if (/cheapest|lowest price/i.test(query)) {
    extraction.sortBy = 'price_asc';
  } else if (/expensive|luxury|high end/i.test(query)) {
    extraction.sortBy = 'price_desc';
  } else if (/newest|recent|new listing/i.test(query)) {
    extraction.sortBy = 'newest';
  }
  
  console.log('Extracted features:', extraction);
  return extraction;
}


// In app/chat/page.tsx - Add this function at the top

// LLM-based feature extraction function with real API call
async function extractFeaturesWithLLM(query: string): Promise<FeatureExtraction> {
  console.log("Extracting features using LLM for query:", query);
  
  // Default extraction object
  const defaultExtraction: FeatureExtraction = {
    queryType: 'general',
    extractedZipCode: undefined,
    propertyFeatures: {},
    locationFeatures: {},
    actionRequested: null,
    filters: {},
    sortBy: undefined
  };
  
  // Basic zip code extraction with regex (immediate result)
  const zipCodeMatch = query.match(/\b(\d{5})\b/);
  if (zipCodeMatch) {
    defaultExtraction.extractedZipCode = zipCodeMatch[1];
  }
  
  try {
    // Create LLM feature extraction prompt
    const extractionPrompt = `
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
            "to": string (what the user wants to be near),
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
    
    // Real LLM API call
    console.log("Sending extraction prompt to LLM");
    
    const llmResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: extractionPrompt,
        is_system_query: true  // Flag to backend that this is a system query
      })
    });
    
    if (!llmResponse.ok) {
      throw new Error(`LLM API error: ${llmResponse.status}`);
    }
    
    const data = await llmResponse.json();
    console.log("Raw LLM response:", data.response);
    
    // Find and parse JSON in the response
    try {
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedFeatures = JSON.parse(jsonMatch[0]);
        console.log("Parsed LLM extraction:", extractedFeatures);
        
        // Merge with default extraction
        const mergedExtraction: FeatureExtraction = {
          ...defaultExtraction,
          ...extractedFeatures,
          extractedZipCode: extractedFeatures.zipCode || defaultExtraction.extractedZipCode
        };
        
        console.log("Final extraction result:", mergedExtraction);
        return mergedExtraction;
      } else {
        throw new Error("No JSON found in LLM response");
      }
    } catch (parseError) {
      console.error("Failed to parse LLM response:", parseError);
      throw parseError;
    }
  } catch (error) {
    console.error("LLM feature extraction failed:", error);
    
    // Fall back to regex-based extraction
    console.log("Falling back to regex extraction");
    return extractRealEstateFeatures(query);
  }
}

// Mock response generator (simulates LLM output)
function generateMockLLMResponse(query: string): FeatureExtraction {
  const lowerQuery = query.toLowerCase();
  const extraction: FeatureExtraction = {
    queryType: 'general',
    extractedZipCode: undefined,
    propertyFeatures: {},
    locationFeatures: {},
    actionRequested: null,
    filters: {},
    sortBy: undefined
  };
  
  // Detect query type
  if (lowerQuery.includes('properties') || lowerQuery.includes('home') || lowerQuery.includes('house')) {
    extraction.queryType = 'property_search';
  } else if (lowerQuery.includes('market') || lowerQuery.includes('trends')) {
    extraction.queryType = 'market_info';
  }
  
  // Detect bedrooms
  if (lowerQuery.includes('3 bed') || lowerQuery.includes('three bed')) {
    extraction.propertyFeatures.bedrooms = 3;
  } else if (lowerQuery.includes('2 bed') || lowerQuery.includes('two bed')) {
    extraction.propertyFeatures.bedrooms = 2;
  }
  
  // Detect property type
  if (lowerQuery.includes('apartment')) {
    extraction.propertyFeatures.propertyType = 'apartment';
  } else if (lowerQuery.includes('condo')) {
    extraction.propertyFeatures.propertyType = 'condo';
  } else if (lowerQuery.includes('house')) {
    extraction.propertyFeatures.propertyType = 'house';
  }
  
  // Detect location
  if (lowerQuery.includes('chicago')) {
    extraction.locationFeatures.city = 'Chicago';
  }
  
  // Detect proximity
  if (lowerQuery.includes('near school') || lowerQuery.includes('close to school')) {

  } else if (lowerQuery.includes('near transit')) {
    
    extraction.actionRequested = 'show_transit';
  }
  
  // Detect action
  if (lowerQuery.includes('see properties') || lowerQuery.includes('show') || lowerQuery.includes('find')) {
    extraction.actionRequested = 'show_listings';
  } else if (lowerQuery.includes('market') || lowerQuery.includes('trends')) {
    extraction.actionRequested = 'analyze_market';
  }
  
  // Detect tax preferences
  if (lowerQuery.includes('low tax') || lowerQuery.includes('moderate tax')) {
    extraction.filters.maxTaxes = 5000;
  }
  
  return extraction;
}


  // Fetch location data based on zip code
  const fetchLocationData = async (zip: string) => {
    if (!zip || zip.length < 5) return;

    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      // Fetch restaurants near the zip code
      const restaurantsResponse = await fetch('/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: zip,
          type: 'Restaurants'
        }),
      });

      // Fetch transit stops near the zip code
      const transitResponse = await fetch('/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: zip,
          type: 'Transit station'
        }),
      });

      // Check for errors but don't throw - we'll handle missing data gracefully
      if (!restaurantsResponse.ok) {
        console.warn(`Restaurant search failed: ${restaurantsResponse.status}`);
      }

      if (!transitResponse.ok) {
        console.warn(`Transit search failed: ${transitResponse.status}`);
      }

      // These are safe parsings that won't throw if the response returns a proper JSON error
      // These are safe parsings that won't throw if the response returns a proper JSON error
      let restaurantsData: LocationResponse = { results: [] };
      let transitData: LocationResponse = { results: [] };

      if (restaurantsResponse.ok) {
        restaurantsData = await restaurantsResponse.json();
      } else {
        // Still try to get error message
        try {
          const errorData = await restaurantsResponse.json();
          restaurantsData = { results: [], error: errorData.error || "Failed to fetch restaurants" };
        } catch (e) {
          restaurantsData = { results: [], error: "Failed to fetch restaurants" };
        }
      }

      // Same for transit data
      if (transitResponse.ok) {
        transitData = await transitResponse.json();
      } else {
        try {
          const errorData = await transitResponse.json();
          transitData = { results: [], error: errorData.error || "Failed to fetch transit stations" };
        } catch (e) {
          transitData = { results: [], error: "Failed to fetch transit stations" };
        }
      }

      // Handle case where we have valid responses but no data
      if (restaurantsData.results?.length === 0 && transitData.results?.length === 0) {

        setLocationError(
          "Unable to find location data for this zip code"
        );
        //setLocationError("No nearby restaurants or transit stations found for this zip code.");
      }

      // Update state with whatever data we have - even if partial
      setLocationData({
        restaurants: restaurantsData.results || [],
        transit: transitData.results || [],
        zipCode: zip
      });

      if (restaurantsData.error || transitData.error) {
        setLocationError(
          `${restaurantsData.error || ""} ${transitData.error || ""}`.trim() ||
          "Unable to find location data for this zip code"
        );
      } else {
        setLocationError(null);
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
      setLocationError("Failed to fetch location data. Please try again.");
    } finally {
      setIsLoadingLocation(false);
    }



    // Also fetch properties data
    try {
      setIsLoadingProperties(true);
      const propertiesResponse = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: zip
        }),
      });

      const propertiesData = await propertiesResponse.json();
      console.log("Properties data:", propertiesData);

      setProperties(propertiesData.results || []);


          // Fetch market trends
    await fetchMarketTrends(zip);

    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoadingProperties(false);
    }
  };



  

  // Update handleZipCodeChange to track zip codes
  const handleZipCodeChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add the zip code to the list if it's not already there
    if (!searchedZipCodes.includes(zipCode)) {
      setSearchedZipCodes(prev => [...prev, zipCode]);
    }

    fetchLocationData(zipCode);
  };




  // Update saveChatHistory function to accept messages as parameter
  const saveChatHistory = async (messagesToSave = messages) => {
    if (messagesToSave.length <= 1) return; // Don't save if only system message

    try {
      const response = await fetch('/api/save_chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          messages: messagesToSave,
          zipCodes: searchedZipCodes
        }),
      });

      const data = await response.json();
      console.log("Chat saved automatically:", data.file_key);
    } catch (error) {
      console.error('Error auto-saving chat:', error);
    }
  };

// Add these functions to app/chat/page.tsx

// In app/chat/page.tsx
const executeAction = async (extraction: FeatureExtraction) => {
  console.log(`Executing action: ${extraction.actionRequested}`);
  
  // Extract zip code (either from extraction or current state)
  const targetZipCode = extraction.extractedZipCode || zipCode;
  
  switch (extraction.actionRequested) {
    case 'show_listings':
      // Set active tab to properties
      setActiveTab('properties');
      
      // If we have a zip code, fetch properties
      if (targetZipCode) {
        console.log(`Fetching property listings for ${targetZipCode}`);
        await fetchPropertyListings(extraction);
      } else {
        console.log('No zip code available for property search');
      }
      break;
      
    case 'show_details':
      // If we have properties and can identify one by features
      const matchingProps = findMatchingProperties(extraction);
      
      if (matchingProps.length > 0) {
        console.log(`Found ${matchingProps.length} matching properties, showing details for first one`);
        setSelectedProperty(matchingProps[0]);
      } else if (targetZipCode) {
        // Fetch properties first, then show details
        console.log('No matching properties found, fetching new ones');
        await fetchPropertyListings(extraction);
        
        // After fetching, try to find matching properties again
        setTimeout(() => {
          const newMatches = findMatchingProperties(extraction);
          if (newMatches.length > 0) {
            setSelectedProperty(newMatches[0]);
          }
        }, 1000);
      } else {
        console.log('No zip code or matching properties available');
      }
      break;
      
    case 'show_restaurants':
      setActiveTab('restaurants');
      break;
      
    case 'show_transit':
      setActiveTab('transit');
      break;
      
    case 'analyze_market':
      setActiveTab('market');
      break;
      
    default:
      console.log('Unknown action requested:', extraction.actionRequested);
  }
};

// Helper function to find matching properties based on extracted features
const findMatchingProperties = (extraction: FeatureExtraction): Property[] => {
  if (properties.length === 0) {
    return [];
  }
  
  console.log('Finding matching properties with features:', extraction.propertyFeatures);
  
  // Start with all properties
  let matches = [...properties];
  
  // Filter by bedrooms if specified
  if (extraction.propertyFeatures.bedrooms) {
    matches = matches.filter(property => {
      if (Array.isArray(extraction.propertyFeatures.bedrooms)) {
        // Range of bedrooms
        const [min, max] = extraction.propertyFeatures.bedrooms;
        return property.beds >= min && property.beds <= max;
      } else {
        // Exact number of bedrooms
        return property.beds === extraction.propertyFeatures.bedrooms;
      }
    });
  }
  
  // Filter by bathrooms if specified
  if (extraction.propertyFeatures.bathrooms) {
    matches = matches.filter(property => {
      if (Array.isArray(extraction.propertyFeatures.bathrooms)) {
        // Range of bathrooms
        const [min, max] = extraction.propertyFeatures.bathrooms;
        return property.baths >= min && property.baths <= max;
      } else {
        // Exact number of bathrooms
        return property.baths === extraction.propertyFeatures.bathrooms;
      }
    });
  }
  
  // Filter by property type if specified
  if (extraction.propertyFeatures.propertyType) {
    // Case-insensitive partial match on property type
    const typePattern = new RegExp(extraction.propertyFeatures.propertyType, 'i');
    matches = matches.filter(property => typePattern.test(property.type));
  }
  
  // Filter by price range if specified
  if (extraction.filters.priceRange) {
    matches = matches.filter(property => {
      const priceRange = extraction.filters.priceRange;
      if (priceRange) {
        const [min, max] = priceRange;
      
      // Handle price as either number or string
      let price: number;
      if (typeof property.price === 'number') {
        price = property.price;
      } else {
        // Extract numeric value from price string (remove $, commas, etc.)
        price = parseFloat(property.price.replace(/[^0-9.]/g, ''));
      }
      
      return price >= min && price <= max;
    }});
  }
  console.log(`Found ${matches.length} matching properties`);
  return matches;
};

// Modified property search that incorporates filters
const fetchPropertyListings = async (extraction: FeatureExtraction) => {
  console.log('Fetching properties with extraction:', extraction);
  
  // Start loading state
  setIsLoadingProperties(true);
  
  try {
    // Use either extracted zip code or current zip code
    const targetZipCode = extraction.extractedZipCode || zipCode;
    
    if (!targetZipCode) {
      console.error('No zip code available for property search');
      return;
    }
    
    // Prepare query params based on extraction
    const queryParams: any = {
      zipCode: targetZipCode
    };
    
    // Add property features as filters
    if (extraction.propertyFeatures) {
      // Add bedrooms if specified
      if (extraction.propertyFeatures.bedrooms) {
        if (Array.isArray(extraction.propertyFeatures.bedrooms)) {
          queryParams.minBeds = extraction.propertyFeatures.bedrooms[0];
          queryParams.maxBeds = extraction.propertyFeatures.bedrooms[1];
        } else {
          queryParams.minBeds = extraction.propertyFeatures.bedrooms;
          queryParams.maxBeds = extraction.propertyFeatures.bedrooms;
        }
      }
      
      // Add bathrooms if specified
      if (extraction.propertyFeatures.bathrooms) {
        if (Array.isArray(extraction.propertyFeatures.bathrooms)) {
          queryParams.minBaths = extraction.propertyFeatures.bathrooms[0];
          queryParams.maxBaths = extraction.propertyFeatures.bathrooms[1];
        } else {
          queryParams.minBaths = extraction.propertyFeatures.bathrooms;
          queryParams.maxBaths = extraction.propertyFeatures.bathrooms;
        }
      }
      
      // Add property type if specified
      if (extraction.propertyFeatures.propertyType) {
        queryParams.propertyType = extraction.propertyFeatures.propertyType;
      }
    }
    
    // Add price filters
    if (extraction.filters.priceRange) {
      queryParams.minPrice = extraction.filters.priceRange[0];
      queryParams.maxPrice = extraction.filters.priceRange[1];
    }
    
    // Add sort parameter
    if (extraction.sortBy) {
      queryParams.sort = extraction.sortBy;
    }
    
    console.log('Property search query params:', queryParams);
    
    // Call the properties API
    const propertiesResponse = await fetch('/api/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryParams),
    });

    const propertiesData = await propertiesResponse.json();
    console.log("Properties data returned:", propertiesData);

    // Update the properties state
    setProperties(propertiesData.results || []);
    
    // If properties were found, switch to properties tab
    if (propertiesData.results && propertiesData.results.length > 0) {
      setActiveTab('properties');
    }
    
  } catch (error) {
    console.error('Error fetching properties:', error);
  } finally {
    setIsLoadingProperties(false);
  }
};

// Apply filters to current property listings
const applyFilters = (filters: any) => {
  console.log('Applying filters to current listings:', filters);
  
  // This would filter the current properties array
  // For now, it's just a mock function
  
  // Example: if we had client-side filtering
  if (properties.length > 0) {
    let filteredProperties = [...properties];
    
    // Apply price filter
    if (filters.priceRange) {
      const [minPrice, maxPrice] = filters.priceRange;
      filteredProperties = filteredProperties.filter(property => {
        // Convert price string to number if needed
        const price = typeof property.price === 'string' 
          ? parseInt(property.price.replace(/\D/g, '')) 
          : property.price;
          
        return price >= minPrice && price <= maxPrice;
      });
    }
    
    // Apply other filters as needed
    
    console.log(`Filtered from ${properties.length} to ${filteredProperties.length} properties`);
    // setProperties(filteredProperties); // Uncomment for client-side filtering
  }
};

// Update property search parameters based on extracted features
const updatePropertySearch = (propertyFeatures: any) => {
  console.log('Updating property search with features:', propertyFeatures);
  
  // This would update UI controls for property search
  // For now, just a mock function
  
  // Example: if we had property search form controls
  // setBedroomsFilter(propertyFeatures.bedrooms);
  // setBathroomsFilter(propertyFeatures.bathrooms);
  // etc.
};


// Modified handleSendMessage in app/chat/page.tsx
// Modified handleSendMessage in app/chat/page.tsx
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!inputMessage.trim()) return;

  // Create user message
  const userMessage: Message = {
    id: Date.now(),
    type: 'user',
    content: inputMessage
  };

  // Update UI immediately
  setMessages(prev => [...prev, userMessage]);
  setInputMessage('');
  setIsLoading(true);

  try {
    console.log('Processing user query:', inputMessage);

    // Extract features using both methods
    console.log("=== REGEX-BASED EXTRACTION ===");
    const regexExtraction = extractRealEstateFeatures(inputMessage);
    
    console.log("=== LLM-BASED EXTRACTION ===");
    const llmExtraction = await extractFeaturesWithLLM(inputMessage);
    
    // Use LLM extraction as primary, with regex extraction as fallback
    const extraction = llmExtraction || regexExtraction;
    console.log("=== FINAL EXTRACTION RESULT ===", extraction);

    // Handle zip code if extracted
    if (extraction.extractedZipCode && extraction.extractedZipCode !== zipCode) {
      console.log(`Setting zip code to ${extraction.extractedZipCode}`);
      setZipCode(extraction.extractedZipCode);
      fetchLocationData(extraction.extractedZipCode);
    }

    // Execute requested action (for debugging, not actual API calls)
    // Execute requested action (with actual API calls)
    if (extraction.actionRequested) {
      console.log(`ACTION REQUESTED: ${extraction.actionRequested}`);
      
      // Update UI tabs based on action
      if (extraction.actionRequested === 'show_listings') {
        setActiveTab('properties');
        
        // Actual API call for fetching properties
        if (extraction.extractedZipCode) {
          const zipCode = extraction.extractedZipCode;
          console.log(`Fetching properties for zip code: ${zipCode}`);
          
          // Keep the API call, but comment out filtering logic
          const propertiesResponse = await fetch('/api/properties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zipCode })
          });
          
          if (propertiesResponse.ok) {
            const propertiesData = await propertiesResponse.json();
            console.log(`Received ${propertiesData.results?.length || 0} properties`);
            
            setProperties(propertiesData.results || []);
            
            /* 
            // Commented out filtering logic
            if (extraction.propertyFeatures.bedrooms) {
              // Apply bedroom filters
            }
            
            if (extraction.propertyFeatures.propertyType) {
              // Apply property type filters
            }
            
            if (extraction.filters.priceRange) {
              // Apply price range filters
            }
            */
          }
        }
      } else if (extraction.actionRequested === 'analyze_market') {
        setActiveTab('market');
      } else if (extraction.actionRequested === 'show_restaurants') {
        setActiveTab('restaurants');
      } else if (extraction.actionRequested === 'show_transit') {
        setActiveTab('transit');
      }
    }

    // Step 1: Translate user message if needed
    let translatedUserMessage = inputMessage;
    if (selectedLanguage !== 'en') {
      setIsTranslating(true);
      try {
        const translationResponse = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: inputMessage,
            sourceLanguage: selectedLanguage,
            targetLanguage: 'en'
          }),
        });
        
        const translationData = await translationResponse.json();
        if (translationData.translatedText) {
          translatedUserMessage = translationData.translatedText;
        }
      } catch (error) {
        console.error('Translation error:', error);
      } finally {
        setIsTranslating(false);
      }
    }

    // Prepare context
    let locationContext = '';
    if (locationData) {
      locationContext = `User's location: Zip code ${locationData.zipCode}. `;
      if (locationData.restaurants.length > 0) {
        locationContext += `Nearby restaurants: ${locationData.restaurants.slice(0, 3).map(r => r.title).join(', ')}. `;
      }
      if (locationData.transit.length > 0) {
        locationContext += `Nearby transit: ${locationData.transit.slice(0, 3).map(t => t.title).join(', ')}. `;
      }
    }

    // Create feature context for LLM
    const featureContext = JSON.stringify({
      extractedFeatures: extraction,
      currentZipCode: zipCode,
      activeTab: activeTab,
      selectedProperty: selectedProperty ? selectedProperty.address : null
    });

    console.log("Sending to chat API with enhanced context");
    
    // Step 2: Send to LLM
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: translatedUserMessage,
        session_id: sessionId,
        location_context: locationContext,
        feature_context: featureContext,
        query_type: extraction.queryType
      }),
    });

    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }

    const data = await response.json();
    
    // Save session ID if needed
    if (!sessionId && data.session_id) {
      setSessionId(data.session_id);
    }

    // Step 3: Translate LLM response if needed
    let translatedResponse = data.response;
    if (selectedLanguage !== 'en') {
      setIsTranslating(true);
      try {
        const responseTranslation = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: data.response,
            sourceLanguage: 'en',
            targetLanguage: selectedLanguage
          }),
        });
        
        const responseTranslationData = await responseTranslation.json();
        if (responseTranslationData.translatedText) {
          translatedResponse = responseTranslationData.translatedText;
        }
      } catch (error) {
        console.error('Translation error:', error);
      } finally {
        setIsTranslating(false);
      }
    }

    // Step 4: Display response
    const botMessage: Message = {
      id: Date.now() + 1,
      type: 'bot',
      content: translatedResponse
    };

    setMessages(prev => {
      const updatedMessages = [...prev, botMessage];
      saveChatHistory(updatedMessages);
      return updatedMessages;
    });

  } catch (error) {
    console.error('Error in message flow:', error);
    
    const errorMessage: Message = {
      id: Date.now() + 2,
      type: 'bot',
      content: `Error: I couldn't process your request. ${error instanceof Error ? error.message : 'Please try again later.'}`
    };

    setMessages(prev => [...prev, errorMessage]);
    setBackendStatus('error');
  } finally {
    setIsLoading(false);
  }
};

  // Format message content with line breaks
  // Replace the formatMessageContent function with this:
  // Corrected formatMessageContent function

  // Fixed formatMessageContent function
  const formatMessageContent = (content: string) => {
    // Check if content likely contains markdown
    if (content.includes('#') || content.includes('**') || content.includes('*')) {
      return (
        <div className="markdown">
          <ReactMarkdown>
            {content}
          </ReactMarkdown>
        </div>
      );
    }

    // Fallback for non-markdown content
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 flex gap-6">
        {/* Left Panel: Chat UI */}
        <div className="w-2/5">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-200 flex flex-col h-[600px]">


            {/* Messages Container */}
<div id="chat-container" className="flex-1 overflow-y-auto p-6 space-y-4 chat-scroll">
  {messages.map((message) => (
    <div
      key={message.id}
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] p-4 rounded-2xl ${message.type === 'user'
          ? 'bg-slate-900 text-white rounded-tr-none'
          : 'bg-white/95 text-slate-800 border border-slate-200 rounded-tl-none'
          }`}
      >
        {formatMessageContent(message.content)}
      </div>
    </div>
  ))}
  {isLoading && (
    <div className="flex justify-start">
      <div className="bg-white/95 border border-slate-200 p-4 rounded-2xl rounded-tl-none">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>
    </div>
  )}
  {isTranslating && (
    <div className="text-center text-sm text-slate-500 mt-2">
      <div className="inline-flex items-center">
        <span>Translating</span>
        <span className="ml-1 flex space-x-1">
          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
        </span>
      </div>
    </div>
  )}
  <div ref={messagesEndRef} />
</div>

{/* Language Selector */}
<div className="p-3 border-t border-slate-200">
  <label htmlFor="language-select" className="block text-sm font-medium text-slate-700 mb-1">
    Chat Language:
  </label>
  <div className="relative">
    <select
      id="language-select"
      value={selectedLanguage}
      onChange={handleLanguageChange}
      className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
    >
      {languageOptions.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
</div>


            {/* Quick question buttons */}
            <div className="p-3 border-t border-slate-200 flex flex-wrap gap-2">
              <button
                onClick={() => setInputMessage("What's the market like in this area?")}
                className="px-4 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
              >
                Market trends?
              </button>
              <button
                onClick={() => setInputMessage("What are property taxes like here?")}
                className="px-4 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
              >
                Property taxes?
              </button>
              <button
                onClick={() => setInputMessage("Are home prices rising or falling here?")}
                className="px-4 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
              >
                Price trends?
              </button>
            </div>

            {/* Message Input with Zip Code */}
            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your question here..."
                    className="w-full p-4 pr-16 bg-white text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-xl"
                  />
                  <button
                    type="submit"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>

                <div className="w-32">
                  <div className="bg-teal-500 text-white rounded-xl overflow-hidden">
                    <input
                      id="zipCode"
                      type="text"
                      value={zipCode}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 5) {
                          setZipCode(value);
                          // Auto-fetch when 5 digits entered
                          if (value.length === 5) {
                            fetchLocationData(value);
                          }
                        }
                      }}
                      placeholder="Zip code..."
                      className="w-full p-3 bg-transparent placeholder-white/80 text-white border-none focus:ring-0 outline-none text-center"
                      maxLength={5}
                      inputMode="numeric"
                    />
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-3/5 space-y-4">
          {selectedProperty ? (
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200 animate-fadeIn relative">
              <button
                onClick={() => setSelectedProperty(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100"
              >
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">Property Listing</h2>

              {/* Full Property Details */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="h-64 overflow-hidden">
                  <img
                    src={selectedProperty.imgSrc || "https://via.placeholder.com/800x400?text=No+Image"}
                    alt={selectedProperty.address}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="font-bold text-2xl text-slate-800">
                    {typeof selectedProperty.price === 'number' ? `$${selectedProperty.price.toLocaleString()}` : selectedProperty.price}
                  </div>
                  <div className="text-slate-600 mb-3">{selectedProperty.address}</div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-slate-800">{selectedProperty.beds}</div>
                      <div className="text-slate-600 text-sm">Beds</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-slate-800">{selectedProperty.baths}</div>
                      <div className="text-slate-600 text-sm">Baths</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-slate-800">{typeof selectedProperty.sqft === 'number' ? selectedProperty.sqft.toLocaleString() : selectedProperty.sqft}</div>
                      <div className="text-slate-600 text-sm">Sq Ft</div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <div className="font-semibold text-slate-800 mb-2">Property Type</div>
                    <div className="text-slate-600">{selectedProperty.type}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : locationData ? (
            <>
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200 animate-fadeIn">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">
                  Area Information: {locationData.zipCode}
                </h2>

                {/* Thick tabs with counters */}
                <div className="flex border-b border-slate-200 mb-4">
                  <button
                    onClick={() => setActiveTab(activeTab === 'properties' ? null : 'properties')}
                    className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'properties'
                        ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    🏠 Properties
                    <span className="ml-2 bg-slate-200 px-2 py-1 rounded-full text-xs">
                      {properties.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab(activeTab === 'restaurants' ? null : 'restaurants')}
                    className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'restaurants'
                        ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    🍽️ Restaurants
                    <span className="ml-2 bg-slate-200 px-2 py-1 rounded-full text-xs">
                      {locationData.restaurants.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab(activeTab === 'transit' ? null : 'transit')}
                    className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'transit'
                        ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    🚇 Transit
                    <span className="ml-2 bg-slate-200 px-2 py-1 rounded-full text-xs">
                      {locationData.transit.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab(activeTab === 'market' ? null : 'market')}
                    className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'market'
                        ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    📊 Market
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab && (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-2 animate-fadeIn">
                    {/* Properties Tab */}
                    {activeTab === 'properties' && (
                      isLoadingProperties ? (
                        <div className="flex justify-center p-4">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                          </div>
                        </div>
                      ) : properties.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {properties.slice(0, 6).map((property, index) => (
                            <div
                              key={index}
                              onClick={() => setSelectedProperty(property)}
                              className="bg-white rounded-lg border border-slate-200 overflow-hidden h-64 flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"

                            >
                              {property.imgSrc ? (
                                <div className="h-32 overflow-hidden">
                                  <img
                                    src={property.imgSrc}
                                    alt={property.address}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://via.placeholder.com/300x200?text=No+Image";
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="h-32 bg-slate-100 flex items-center justify-center">
                                  <span className="text-slate-400">No image available</span>
                                </div>
                              )}
                              <div className="p-3 flex-1 flex flex-col">
                                <div className="font-medium text-slate-800 text-lg">
                                  {typeof property.price === 'number' ? `$${property.price.toLocaleString()}` : property.price}
                                </div>
                                <div className="text-xs text-slate-700 line-clamp-2 mb-1">{property.address}</div>
                                <div className="flex flex-wrap gap-2 mt-auto">
                                  <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">{property.beds} beds</span>
                                  <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">{property.baths} baths</span>
                                  <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">
                                    {typeof property.sqft === 'number' ? `${property.sqft.toLocaleString()} sqft` : `${property.sqft} sqft`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-700 text-sm p-2">No properties found in this area.</div>
                      )
                    )}

                    {/* Restaurants Tab */}
                    {activeTab === 'restaurants' && (
                      locationData.restaurants.length > 0 ? (
                        locationData.restaurants.slice(0, 5).map((restaurant, index) => (
                          <div key={index} className="p-3 bg-white rounded-lg border border-slate-200">
                            <div className="font-medium text-slate-800">{restaurant.title}</div>
                            <div className="text-sm text-slate-700">{restaurant.address}</div>
                            {restaurant.distance && (
                              <div className="text-sm text-slate-700 mt-1">
                                {restaurant.distance.toFixed(1)} miles away
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-700 text-sm p-2">No restaurants found nearby.</div>
                      )
                    )}

                    {/* Transit Tab */}
                    {activeTab === 'transit' && (
                      locationData.transit.length > 0 ? (
                        locationData.transit.slice(0, 5).map((station, index) => (
                          <div key={index} className="p-3 bg-white rounded-lg border border-slate-200">
                            <div className="font-medium text-slate-800">{station.title}</div>
                            <div className="text-sm text-slate-700">{station.address}</div>
                            {station.distance && (
                              <div className="text-sm text-slate-700 mt-1">
                                {station.distance.toFixed(1)} miles away
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-700 text-sm p-2">No transit stations found nearby.</div>
                      )
                    )}

{/* Market Tab */}
{activeTab === 'market' && (
  <div className="space-y-4">
    {isLoadingMarketTrends ? (
      <div className="flex justify-center p-4">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>
    ) : marketTrends ? (
      <div className="space-y-6">
        {/* Price Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Price Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-500">Median Price</div>
              <div className="text-xl font-bold text-slate-800">
                ${marketTrends.price_metrics.median_price?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-500">Price Range</div>
              <div className="text-sm font-medium text-slate-800">
                ${marketTrends.price_metrics.lowest_price?.toLocaleString() || 'N/A'} - 
                ${marketTrends.price_metrics.highest_price?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-500">Price/SqFt</div>
              <div className="text-sm font-medium text-slate-800">
                ${marketTrends.price_metrics.price_per_sqft_range?.min?.toFixed(0) || 'N/A'} - 
                ${marketTrends.price_metrics.price_per_sqft_range?.max?.toFixed(0) || 'N/A'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Market Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Market Activity</h3>
          <div className="flex items-center mb-3">
            <div className="w-2/5 pr-4">
              <div className="text-sm text-slate-500 mb-1">Annual Change</div>
              <div className="flex items-center">
                <span className={`text-lg font-semibold ${marketTrends.yearly_trends?.year_over_year_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {marketTrends.yearly_trends?.year_over_year_change >= 0 ? '+' : ''}
                  {marketTrends.yearly_trends?.year_over_year_change?.toFixed(1) || 0}%
                </span>
                <svg className={`w-4 h-4 ml-1 ${marketTrends.yearly_trends?.year_over_year_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={marketTrends.yearly_trends?.year_over_year_change >= 0 ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </div>
            </div>
            <div className="w-3/5 bg-slate-100 h-10 rounded-lg relative overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full ${marketTrends.yearly_trends?.year_over_year_change >= 0 ? 'bg-gradient-to-r from-blue-500 to-emerald-400' : 'bg-gradient-to-r from-rose-400 to-red-500'}`} 
                style={{ width: `${Math.min(100, Math.abs((marketTrends.yearly_trends?.year_over_year_change || 0) * 10))}%` }}>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-700">
                Year-over-Year Price Change
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-500">Days on Market</div>
              <div className="text-xl font-bold text-slate-800">
                {marketTrends.market_activity?.avg_days_on_market?.toFixed(0) || 'N/A'}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-500">Price Reductions</div>
              <div className="text-xl font-bold text-slate-800">
                {marketTrends.price_reductions?.num_price_reductions || 'N/A'}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-500">Avg Reduction</div>
              <div className="text-xl font-bold text-slate-800">
                ${marketTrends.price_reductions?.avg_price_reduction?.toLocaleString() || 'N/A'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Property Types */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Property Types</h3>
          <div className="space-y-2">
            {Object.entries(marketTrends.property_type_distribution || {}).map(([type, count]) => {
              count = count as number;
              const total: number = Object.values(marketTrends.property_type_distribution || {}).reduce((sum: number, val) => sum + Number(val), 0);
              const percentage = (count as number / total) * 100;
              return (
                <div key={type} className="flex items-center">
                  <div className="w-1/3 text-sm text-slate-700">
                    {type.replace(/_/g, ' ')}
                  </div>
                  <div className="w-2/3">
                    <div className="flex items-center">
                      <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs font-medium text-slate-600 min-w-[40px]">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Property Specifications */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Property Specifications</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-500">Avg Bedrooms</div>
              <div className="text-xl font-bold text-slate-800">
                {marketTrends.size_and_specifications?.avg_bedrooms?.toFixed(1) || 'N/A'}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-500">Avg Bathrooms</div>
              <div className="text-xl font-bold text-slate-800">
                {marketTrends.size_and_specifications?.avg_bathrooms?.toFixed(1) || 'N/A'}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-500">Avg Condo Size</div>
              <div className="text-xl font-bold text-slate-800">
                {marketTrends.size_and_specifications?.avg_condo_size?.toLocaleString() || 'N/A'} sqft
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="mt-2 text-slate-600">No market data available. Enter a zip code to see market trends.</p>
      </div>
    )}
  </div>
)}
                  </div>
                )}
              </div>

              {/* Links/Actions Panel */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Explore More</h2>
                <div className="flex flex-wrap gap-2">
                  <Link href="/find_homes" className="px-3 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer text-sm">
                    🔥 Hottest Listings
                  </Link>
                  <Link href="/preferences" className="px-3 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer text-sm">
                    💎 Set Preferences
                  </Link>
                  <Link href="/market-trends" className="px-3 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer text-sm">
                    📊 Market Trends
                  </Link>
                  <Link href="/legal" className="px-3 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer text-sm">
                    ⚖️ Legal Info
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-slate-200 text-center">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">Welcome to RealEstateAI</h2>
              <p className="text-slate-600 mb-6">
                Ask our assistant about properties, market trends, or neighborhoods by chatting on the left.
                Enter a zip code to see local information.
              </p>
              <div className="flex justify-center">
                <div className="animate-bounce text-5xl">👈</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <TranslationIndicator />

      <style jsx global>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-in-out;
            }
            
            .line-clamp-2 {
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
          `}</style>
    </div>
  );
}
export default Chat;