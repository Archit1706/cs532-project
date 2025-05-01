
interface Message {
    id: number;
    type: 'user' | 'bot';
    content: string;
    rawContent?: string; // Add this optional property
}

// Feature extraction interface
interface FeatureExtraction {
    queryType: 'general' | 'property_search' | 'property_detail' | 'market_info' | 'legal' | 'preferences' | "transit_amenities";
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
    actionRequested?: 'show_listings' | 'show_details' | 'show_restaurants' | 'show_transit' | 'analyze_market' | 'show_amenities' | 'show_route' | null;
    filters: {
        amenities: string[];
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
    agents: Agent[];
}

interface Property {
    imgSrc?: string;
    address: string;
    price: number | string;
    beds: number;
    baths: number;
    sqft: number | string;
    type: string;
    zpid: string;
    id?: string;
    latitude?: number;
    longitude?: number;
}
interface AgentsResponse {
    agents: Agent[];
}

interface Agent {
    businessName: string;
    encodedZuid: string;
    fullName: string;
    isTeamLead: boolean;
    isTopAgent: boolean;
    location: string;
    numTotalReviews: number;
    phoneNumber: string;
    profileLink: string;
    profilePhotoSrc: string;
    reviewExcerpt: string;
    reviewExcerptDate: string; // Consider using `Date` if parsing into JS Date objects
    reviewLink: string;
    reviewStarsRating: number;
    reviews: string;
    saleCountAllTime: number;
    saleCountLastYear: number;
    salePriceRangeThreeYearMax: number;
    salePriceRangeThreeYearMin: number;
    username: string;
}

export type { Message, FeatureExtraction, LocationResponse, LocationData, Property, Agent, AgentsResponse, LocationResult };