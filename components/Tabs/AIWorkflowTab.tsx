// Updated components/Tabs/AIWorkflowTab.tsx with enhanced property workflow and new transit-amenities workflow

import React, { useState, useEffect, useRef } from 'react';
import { useChatContext } from 'context/ChatContext';
import { MdAutoAwesome, MdSearch, MdFilterAlt, MdAnalytics, MdDownload, MdHistory, MdDirections } from 'react-icons/md';
import { FaChartLine, FaFileDownload, FaFilter, FaPrint, FaRegLightbulb, FaSearch, FaHistory, FaArrowLeft, FaMapMarkerAlt } from 'react-icons/fa';
import { BiAnalyse } from 'react-icons/bi';
import PropertySearchResults from './AIWorkflow/PropertySearchResults';
import MarketAnalysis from './AIWorkflow/MarketAnalysis';
import TransitAmenitiesResults from './AIWorkflow/TransitAmenitiesResults';
import { Property, FeatureExtraction } from 'types/chat';

// Define the workflow states - added the new transit_amenities type
type WorkflowState = 'idle' | 'property-search' | 'market-analysis' | 'transit-amenities';

// PropertyFilter type
interface PropertyFilter {
  bedrooms?: number | [number, number];
  bathrooms?: number | [number, number];
  priceRange?: [number, number];
  propertyType?: string;
  amenities?: string[];
}

// Previous workflows for history
interface WorkflowHistory {
  query: string;
  zipCode: string;
  timestamp: number;
  type: WorkflowState;
  features?: FeatureExtraction | null;
}

const AIWorkflowTab = () => {
  const {
    messages,
    zipCode,
    properties,
    marketTrends,
    debugFeatureExtraction,
    selectedProperty,
    activeTab,
    locationData,
    fetchLocationData
  } = useChatContext();
  
  const [workflowState, setWorkflowState] = useState<WorkflowState>('idle');
  const [lastQuery, setLastQuery] = useState<string>('');
  const [extractedFeatures, setExtractedFeatures] = useState<FeatureExtraction | null>(null);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilter>({});
  const [isLoading, setIsLoading] = useState(false);
  const [additionalMarketData, setAdditionalMarketData] = useState<any>(null);
  const [taxHistoryData, setTaxHistoryData] = useState<any>(null);
  const [offMarketData, setOffMarketData] = useState<any>(null);
  
  // Workflow history state
  const [previousWorkflows, setPreviousWorkflows] = useState<WorkflowHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Maintain a reference to the current state for comparison
  const prevQueryRef = useRef<string>('');
  const prevZipCodeRef = useRef<string>('');
  const workflowMounted = useRef<boolean>(false);

  // Extract the last user message when messages change
// In AIWorkflowTab.tsx
useEffect(() => {
  if (!workflowMounted.current) {
    workflowMounted.current = true;
    return;
  }
  
  // Filter out automated/system messages
  const userMessages = messages.filter((msg: { type: string; isAutomatic?: boolean }) => 
    msg.type === 'user' && !msg.isAutomatic);
    
  if (userMessages.length > 0) {
    const lastMsg = userMessages[userMessages.length - 1].content;
    if (lastMsg !== lastQuery) {
      setLastQuery(lastMsg);
      analyzeQuery(lastMsg);
    }
  }
}, [messages]);

  // Initialize workflow state if idle
  useEffect(() => {
    if (workflowState === 'idle' && lastQuery) {
      analyzeQuery(lastQuery);
    }
  }, []);

  // Store previous workflow when zipCode changes
  useEffect(() => {
    if (prevZipCodeRef.current && zipCode && prevZipCodeRef.current !== zipCode) {
      if (prevQueryRef.current) {
        const newHist: WorkflowHistory = {
          query: prevQueryRef.current,
          zipCode: prevZipCodeRef.current,
          timestamp: Date.now(),
          type: workflowState,
          features: extractedFeatures
        };
        setPreviousWorkflows(prev => {
          if (prev[0]?.query === newHist.query && prev[0]?.zipCode === newHist.zipCode) return prev;
          return [newHist, ...prev.slice(0,4)];
        });
      }
    }
    prevQueryRef.current = lastQuery;
    prevZipCodeRef.current = zipCode;
  }, [lastQuery, zipCode, workflowState]);

  // Restore a previous workflow
  const restorePreviousWorkflow = (index: number) => {
    const hist = previousWorkflows[index];
    if (!hist) return;
    setLastQuery(hist.query);
    setWorkflowState(hist.type);
    if (hist.features) {
      setExtractedFeatures(hist.features);
      // reconstruct filters
      const f: PropertyFilter = {};
      if (hist.features.propertyFeatures.bedrooms) f.bedrooms = hist.features.propertyFeatures.bedrooms;
      if (hist.features.propertyFeatures.bathrooms) f.bathrooms = hist.features.propertyFeatures.bathrooms;
      if (hist.features.filters.priceRange) f.priceRange = hist.features.filters.priceRange;
      if (hist.features.propertyFeatures.propertyType) f.propertyType = hist.features.propertyFeatures.propertyType as string;
      setPropertyFilters(f);
      // re-run workflow logic
      if (hist.type === 'property-search') filterProperties(hist.features);
      else if (hist.type === 'market-analysis') fetchAdditionalMarketData(hist.features);
    } else {
      analyzeQuery(hist.query);
    }
  };

  // Analyze the query and determine the workflow
  const analyzeQuery = async (query: string) => {
    setIsLoading(true);
    try {
      // Use the debug feature extractor to get the features
      const features = await debugFeatureExtraction(query);
      setExtractedFeatures(features);
      
      console.log("Analyzing query:", query);
      console.log("Extracted features:", features);
      
      // Determine the workflow based on the query type and action requested
      const isPropertyQuery = features.queryType === 'property_search' || 
                             features.actionRequested === 'show_listings';
                             
      const isMarketQuery = features.queryType === 'market_info' || 
                           features.actionRequested === 'analyze_market' ||
                           query.toLowerCase().includes('market') ||
                           query.toLowerCase().includes('trend') ||
                           query.toLowerCase().includes('off-market') ||
                           query.toLowerCase().includes('tax history');
      
      // Check for Transit-Amenities workflow - NEW
      const isTransitAmenitiesQuery = features.queryType === 'transit_amenities' ||
                                      features.actionRequested === 'show_amenities' ||
                                      features.actionRequested === 'show_route' ||
                                      features.locationFeatures.proximity ||
                                      query.toLowerCase().includes('nearby') ||
                                      query.toLowerCase().includes('close to') ||
                                      query.toLowerCase().includes('walking distance') ||
                                      query.toLowerCase().includes('route to');
      
      // Ensure transit/amenity data is loaded if needed - NEW
      if (isTransitAmenitiesQuery && zipCode) {
        if (!locationData) {
          fetchLocationData(zipCode);
        }
        setWorkflowState('transit-amenities');
        console.log("Setting workflow to transit-amenities");
      }
      // More specific pattern matching for market-related queries
      else if (isMarketQuery || 
          query.toLowerCase().includes('off-market') || 
          query.toLowerCase().includes('tax') || 
          query.toLowerCase().includes('trend')) {
        console.log("Setting workflow to market-analysis");
        setWorkflowState('market-analysis');
        // Fetch additional market data
        fetchAdditionalMarketData(features);
      } else if (isPropertyQuery) {
        console.log("Setting workflow to property-search");
        setWorkflowState('property-search');
        
        // Create property filters
        let filters: PropertyFilter = {};
    
        // Extract bedroom filters - ENHANCED to handle ranges
        if (features.propertyFeatures.bedrooms) {
          filters.bedrooms = features.propertyFeatures.bedrooms;
        }
        
        // Extract bathroom filters - ENHANCED to handle ranges
        if (features.propertyFeatures.bathrooms) {
          filters.bathrooms = features.propertyFeatures.bathrooms;
        }
        
        // Extract price range filters
        if (features.filters.priceRange) {
          filters.priceRange = features.filters.priceRange;
        } else if (features.filters.maxPrice) {
          filters.priceRange = [0, features.filters.maxPrice];
        } else if (features.filters.minPrice) {
          filters.priceRange = [features.filters.minPrice, Number.MAX_SAFE_INTEGER];
        }
        
        // Extract property type filters
        if (features.propertyFeatures.propertyType) {
          filters.propertyType = features.propertyFeatures.propertyType;
        }
        
        // Extract amenity filters
        if (features.filters.amenities && features.filters.amenities.length > 0) {
          filters.amenities = features.filters.amenities;
        }
        
        setPropertyFilters(filters);
        
        // Apply filters to properties
        filterProperties(features);
      } else {
        // Default to property search if we can't determine
        console.log("Defaulting to property-search");
        setWorkflowState('property-search');
        filterProperties(features);
      }
    } catch (error) {
      console.error('Error analyzing query:', error);
      setWorkflowState('idle');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter properties based on extracted features
  const filterProperties = (features: FeatureExtraction) => {
    if (!properties || properties.length === 0) return;

    let filters: PropertyFilter = {};
    
    // Extract bedroom filters - ENHANCED for ranges
    if (features.propertyFeatures.bedrooms) {
      filters.bedrooms = features.propertyFeatures.bedrooms;
    }
    
    // Extract bathroom filters - ENHANCED for ranges
    if (features.propertyFeatures.bathrooms) {
      filters.bathrooms = features.propertyFeatures.bathrooms;
    }
    
    // Extract price range filters
    if (features.filters.priceRange) {
      filters.priceRange = features.filters.priceRange;
    } else if (features.filters.maxPrice) {
      filters.priceRange = [0, features.filters.maxPrice];
    } else if (features.filters.minPrice) {
      filters.priceRange = [features.filters.minPrice, Number.MAX_SAFE_INTEGER];
    }
    
    // Extract property type filters
    if (features.propertyFeatures.propertyType) {
      filters.propertyType = features.propertyFeatures.propertyType;
    }
    
    // Extract amenity filters
    if (features.filters.amenities && features.filters.amenities.length > 0) {
      filters.amenities = features.filters.amenities;
    }
    
    setPropertyFilters(filters);
    
    // Apply filters to properties - UPDATED to handle all types of filters
    // This preserves all properties, but marks their eligibility
    let allProperties = [...properties];
    
    // Track which properties pass the filters
    const eligiblePropertyIndices = new Set<number>();
    
    // Apply filters to each property
    allProperties.forEach((property, index) => {
      let isEligible = true;
      
      // Apply bedroom filter
      if (filters.bedrooms !== undefined) {
        if (Array.isArray(filters.bedrooms)) {
          // Handle range: [min, max]
          const [min, max] = filters.bedrooms;
          isEligible = isEligible && property.beds >= min && (max === null || property.beds <= max);
        } else {
          // Handle exact number (or minimum)
          isEligible = isEligible && property.beds >= filters.bedrooms;
        }
      }
      
      // Apply bathroom filter
      if (filters.bathrooms !== undefined) {
        if (Array.isArray(filters.bathrooms)) {
          // Handle range: [min, max]
          const [min, max] = filters.bathrooms;
          isEligible = isEligible && property.baths >= min && (max === null || property.baths <= max);
        } else {
          // Handle exact number (or minimum)
          isEligible = isEligible && property.baths >= filters.bathrooms;
        }
      }
      
      // Apply price range filter
      if (filters.priceRange !== undefined) {
        const propertyPrice = typeof property.price === 'string' 
          ? parseInt(property.price.replace(/[^0-9]/g, ''))
          : property.price;
          
        isEligible = isEligible && 
                    propertyPrice >= filters.priceRange[0] && 
                    (filters.priceRange[1] === null || propertyPrice <= filters.priceRange[1]);
      }
      
      // Apply property type filter
      if (filters.propertyType !== undefined) {
        isEligible = isEligible && 
                    property.type.toLowerCase().includes(filters.propertyType.toLowerCase());
      }
      
      // Mark eligible properties
      if (isEligible) {
        eligiblePropertyIndices.add(index);
      }
    });
    
    // Update filtered properties - we maintain all properties, but know which are eligible
    setFilteredProperties(allProperties);
    
    // Add isEligible flag to properties
    allProperties = allProperties.map((property, index) => ({
      ...property,
      isEligible: eligiblePropertyIndices.has(index)
    }));
    
    // Sort based on the extracted sort preference
    if (features.sortBy) {
      if (features.sortBy === 'price_asc') {
        allProperties.sort((a, b) => {
          const priceA = typeof a.price === 'string' ? parseInt(a.price.replace(/[^0-9]/g, '')) : a.price;
          const priceB = typeof b.price === 'string' ? parseInt(b.price.replace(/[^0-9]/g, '')) : b.price;
          return priceA - priceB;
        });
      } else if (features.sortBy === 'price_desc') {
        allProperties.sort((a, b) => {
          const priceA = typeof a.price === 'string' ? parseInt(a.price.replace(/[^0-9]/g, '')) : a.price;
          const priceB = typeof b.price === 'string' ? parseInt(b.price.replace(/[^0-9]/g, '')) : b.price;
          return priceB - priceA;
        });
      }
      // Can add more sorting options here
    }
    
    setFilteredProperties(allProperties);
  };

  // Fetch additional market data
  const fetchAdditionalMarketData = async (features: FeatureExtraction) => {
    if (!zipCode) return;
    
    setIsLoading(true);
    
    try {
      // Fetch off-market data
      const offMarketResponse = await fetch('/api/off_market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode })
      });
      
      if (offMarketResponse.ok) {
        const offMarketData = await offMarketResponse.json();
        setOffMarketData(offMarketData);
      }
      
      // Fetch tax history data if we have a selected property
      if (selectedProperty?.zpid) {
        const taxHistoryResponse = await fetch('/api/tax_history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zpid: selectedProperty.zpid })
        });
        
        if (taxHistoryResponse.ok) {
          const taxHistoryData = await taxHistoryResponse.json();
          setTaxHistoryData(taxHistoryData);
        }
      }
    } catch (error) {
      console.error('Error fetching additional market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle exporting chat as JSON or PDF
  const handleExportChat = (format: 'json' | 'pdf') => {
    // Implementation remains the same
  };

  // Add to your JSX to show workflow history
  const renderWorkflowHistory = () => (
    <div className="mb-4">
      {previousWorkflows.length > 0 && (
        <div className="bg-white rounded-lg border border-violet-200 shadow-sm p-3">
          <h3 className="text-sm font-medium text-violet-800 mb-2 flex items-center">
            <FaHistory className="mr-2" /> Previous Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {previousWorkflows.map((workflow, index) => (
              <button
                key={index}
                onClick={() => restorePreviousWorkflow(Number(index))}
                className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs hover:bg-violet-100 flex items-center"
              >
                <span className="truncate max-w-[150px]">{workflow.query}</span>
                <span className="ml-1 text-violet-400 text-xs">{workflow.zipCode}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render
  if (isLoading) return (
    <div className="flex justify-center p-8">Processing...</div>
  );

  return (
    <div className="p-6 bg-gradient-to-b from-violet-50 to-white rounded-xl shadow-sm">
      {/* History Toggle */}
      <button
        className="mb-4 flex items-center text-sm text-violet-700"
        onClick={() => setShowHistory(s => !s)}
      >
        {showHistory ? <FaArrowLeft className="mr-2"/> : <FaHistory className="mr-2"/>}
        {showHistory ? 'Back' : 'Previous Searches'}
      </button>
      
      {showHistory && (
        <div className="bg-white rounded-lg border p-3 shadow-sm mb-6">
          {previousWorkflows.map((h, i) => (
            <button
              key={i}
              onClick={() => restorePreviousWorkflow(i)}
              className="block w-full text-left px-3 py-2 hover:bg-violet-50"
            >
              <span className="font-medium">{h.query}</span> — {h.zipCode}
            </button>
          ))}
        </div>
      )}

      {/* Idle State */}
      {workflowState === 'idle' && (
        <div>Ask a question to begin AI Workflow.</div>
      )}

      {/* Property Search */}
      {workflowState === 'property-search' && (
        <PropertySearchResults
          properties={filteredProperties}
          filters={propertyFilters}
          features={extractedFeatures}
          zipCode={zipCode}
          query={lastQuery}
          onExport={() => {}}
        />
      )}

      {/* Market Analysis */}
      {workflowState === 'market-analysis' && (
        <MarketAnalysis
          marketTrends={marketTrends}
          taxHistory={taxHistoryData}
          offMarketData={offMarketData}
          zipCode={zipCode}
          features={extractedFeatures}
          selectedProperty={selectedProperty}
          query={lastQuery}
          onExport={() => {}}
        />
      )}

      {/* Transit-Amenities Workflow - NEW */}
      {workflowState === 'transit-amenities' && (
        <TransitAmenitiesResults
          zipCode={zipCode}
          features={extractedFeatures}
          query={lastQuery}
          onExport={() => {}}
        />
      )}
    </div>
  );
};

export default AIWorkflowTab;