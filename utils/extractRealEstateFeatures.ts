// utils/extractRealEstateFeatures.ts
import { FeatureExtraction } from 'types/chat';

export function extractRealEstateFeatures(query: string): FeatureExtraction {
    const extraction: FeatureExtraction = {
        queryType: 'general',
        extractedZipCode: undefined,
        propertyFeatures: {},
        locationFeatures: {},
        actionRequested: null,
        filters: {},
        sortBy: undefined
    };

    const zipCodeMatch = query.match(/\b(\d{5})\b/);
    if (zipCodeMatch) extraction.extractedZipCode = zipCodeMatch[1];

    if (/(find|search|looking for|properties|homes|houses|apartments)/i.test(query)) {
        extraction.queryType = 'property_search';
    } else if (/(market|trends|prices|appreciation|value)/i.test(query)) {
        extraction.queryType = 'market_info';
    } else if (/(legal|laws|regulations|taxes|tax|zoning)/i.test(query)) {
        extraction.queryType = 'legal';
    } else if (/(details|more about|tell me about)/i.test(query)) {
        extraction.queryType = 'property_detail';
    }

    const bedroomMatch = query.match(/(\d+)\s*(?:bed|bedroom|br)/i);
    if (bedroomMatch) extraction.propertyFeatures.bedrooms = parseInt(bedroomMatch[1]);

    const bathroomMatch = query.match(/(\d+)\s*(?:bath|bathroom|ba)/i);
    if (bathroomMatch) extraction.propertyFeatures.bathrooms = parseInt(bathroomMatch[1]);

    ['house', 'apartment', 'condo', 'townhouse'].forEach(type => {
        if (query.toLowerCase().includes(type)) extraction.propertyFeatures.propertyType = type;
    });

    const sqftMatch = query.match(/(\d+)\s*(?:sq\s*ft|square\s*feet|sqft)/i);
    if (sqftMatch) extraction.propertyFeatures.squareFeet = parseInt(sqftMatch[1]);

    const cityMatch = query.match(/\b(?:in|near)\s+([A-Za-z\s.]+?)(?:\s+\d{5}|\s*$|\s+and|\s+near)/i);
    if (cityMatch) extraction.locationFeatures.city = cityMatch[1].trim();

    const proximityTypes = ['school', 'transit', 'restaurant', 'downtown', 'park', 'grocery', 'hospital'];
    for (const type of proximityTypes) {
        if (query.toLowerCase().includes(`near ${type}`) || query.toLowerCase().includes(`close to ${type}`)) {
            extraction.locationFeatures.proximity = [{
                to: type,
                distance: 1,
                unit: 'miles'
            }];
            if (type === 'transit') extraction.actionRequested = 'show_transit';
            else if (type === 'restaurant') extraction.actionRequested = 'show_restaurants';
            break;
        }
    }

    if (/show\s+(?:me\s+)?(?:the\s+)?properties/i.test(query) ||
        /find\s+(?:me\s+)?(?:a\s+)?home/i.test(query) ||
        /looking\s+for\s+(?:a\s+)?(?:house|property|apartment|condo)/i.test(query)) {
        extraction.actionRequested = 'show_listings';
    } else if (/market|trends|price|appreciation/i.test(query)) {
        extraction.actionRequested = 'analyze_market';
    }

    const priceRangeMatch = query.match(/between\s+\$?(\d+[k|K]?)\s+and\s+\$?(\d+[k|K]?)/i);
    if (priceRangeMatch) {
        const min = priceRangeMatch[1].toLowerCase().endsWith('k') ? parseInt(priceRangeMatch[1]) * 1000 : parseInt(priceRangeMatch[1]);
        const max = priceRangeMatch[2].toLowerCase().endsWith('k') ? parseInt(priceRangeMatch[2]) * 1000 : parseInt(priceRangeMatch[2]);
        extraction.filters.priceRange = [min, max];
    } else {
        const maxPriceMatch = query.match(/(?:under|below|less than)\s+\$?(\d+[k|K]?)/i);
        if (maxPriceMatch) {
            const maxPrice = maxPriceMatch[1].toLowerCase().endsWith('k') ? parseInt(maxPriceMatch[1]) * 1000 : parseInt(maxPriceMatch[1]);
            extraction.filters.priceRange = [0, maxPrice];
        }
    }

    if (/cheapest|lowest price/i.test(query)) {
        extraction.sortBy = 'price_asc';
    } else if (/expensive|luxury|high end/i.test(query)) {
        extraction.sortBy = 'price_desc';
    } else if (/newest|recent|new listing/i.test(query)) {
        extraction.sortBy = 'newest';
    }

    return extraction;
}
