// components/Tabs/AIWorkflowTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useChatContext } from 'context/ChatContext';
import { MdAutoAwesome, MdSearch, MdFilterAlt, MdAnalytics, MdDownload } from 'react-icons/md';
import { FaChartLine, FaFileDownload, FaFilter, FaPrint, FaRegLightbulb, FaSearch } from 'react-icons/fa';
import { BiAnalyse } from 'react-icons/bi';
import PropertySearchResults from './AIWorkflow/PropertySearchResults';
import MarketAnalysis from './AIWorkflow/MarketAnalysis';
import { Property, FeatureExtraction } from 'types/chat';

// Define the workflow states
type WorkflowState = 'idle' | 'property-search' | 'market-analysis';

// PropertyFilter type
interface PropertyFilter {
  bedrooms?: number | [number, number];
  bathrooms?: number | [number, number];
  priceRange?: [number, number];
  propertyType?: string;
  amenities?: string[];
}

const AIWorkflowTab = () => {
  const {
    messages,
    zipCode,
    properties,
    marketTrends,
    debugFeatureExtraction,
    selectedProperty,
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

  // Extract the last user message when messages change
  useEffect(() => {
    const userMessages = messages.filter((msg: { type: string; }) => msg.type === 'user');
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1].content;
      if (lastUserMessage !== lastQuery) {
        setLastQuery(lastUserMessage);
        analyzeQuery(lastUserMessage);
      }
    }
  }, [messages]);

// Extract the last user message when messages change
useEffect(() => {
    const userMessages = messages.filter((msg: { type: string; }) => msg.type === 'user');
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1].content;
      if (lastUserMessage !== lastQuery) {
        setLastQuery(lastUserMessage);
        analyzeQuery(lastUserMessage);
      }
    }
  }, [messages]);

  // Initialize workflow state if not already done
  useEffect(() => {
    if (workflowState === 'idle' && lastQuery) {
      analyzeQuery(lastQuery);
    }
  }, []);


  // Analyze the query and determine the workflow
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
      
      // More specific pattern matching for market-related queries
      if (isMarketQuery || 
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
    
        // Extract bedroom filters
        if (features.propertyFeatures.bedrooms) {
          filters.bedrooms = features.propertyFeatures.bedrooms;
        }
        
        // Extract bathroom filters
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
        if (features.filters.mustHave && features.filters.mustHave.length > 0) {
          filters.amenities = features.filters.mustHave;
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
    
    // Extract bedroom filters
    if (features.propertyFeatures.bedrooms) {
      filters.bedrooms = features.propertyFeatures.bedrooms;
    }
    
    // Extract bathroom filters
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
    if (features.filters.mustHave && features.filters.mustHave.length > 0) {
      filters.amenities = features.filters.mustHave;
    }
    
    setPropertyFilters(filters);
    
    // Apply filters to properties
    let filtered = [...properties];
    
    // Apply bedroom filter
    if (filters.bedrooms) {
      filtered = filtered.filter(property => {
        if (Array.isArray(filters.bedrooms)) {
          const [min, max] = filters.bedrooms;
          return property.beds >= min && property.beds <= max;
        } else {
          return filters.bedrooms !== undefined && property.beds >= filters.bedrooms;
        }
      });
    }
    
    // Apply bathroom filter
    if (filters.bathrooms) {
      filtered = filtered.filter(property => {
        if (Array.isArray(filters.bathrooms)) {
          const [min, max] = filters.bathrooms;
          return property.baths >= min && property.baths <= max;
        } else {
          return property.baths >= (filters.bathrooms ?? 0);
        }
      });
    }
    
    // Apply price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(property => {
        const propertyPrice = typeof property.price === 'string' 
          ? parseInt(property.price.replace(/[^0-9]/g, ''))
          : property.price;
        return propertyPrice >= filters.priceRange![0] && propertyPrice <= filters.priceRange![1];
      });
    }
    
    // Apply property type filter
    if (filters.propertyType) {
      filtered = filtered.filter(property => 
        property.type.toLowerCase().includes(filters.propertyType!.toLowerCase())
      );
    }
    
    // Sort based on the extracted sort preference
    if (features.sortBy) {
      if (features.sortBy === 'price_asc') {
        filtered.sort((a, b) => {
          const priceA = typeof a.price === 'string' ? parseInt(a.price.replace(/[^0-9]/g, '')) : a.price;
          const priceB = typeof b.price === 'string' ? parseInt(b.price.replace(/[^0-9]/g, '')) : b.price;
          return priceA - priceB;
        });
      } else if (features.sortBy === 'price_desc') {
        filtered.sort((a, b) => {
          const priceA = typeof a.price === 'string' ? parseInt(a.price.replace(/[^0-9]/g, '')) : a.price;
          const priceB = typeof b.price === 'string' ? parseInt(b.price.replace(/[^0-9]/g, '')) : b.price;
          return priceB - priceA;
        });
      }
      // Can add more sorting options here
    }
    
    setFilteredProperties(filtered);
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
    // Create a JSON representation of the chat
    const chatData = {
      timestamp: new Date().toISOString(),
      messages: messages.map((msg: { type: any; content: any; }) => ({
        type: msg.type,
        content: msg.content,
        timestamp: new Date().toISOString()
      }))
    };
    
    if (format === 'json') {
      // Create and download JSON file
      const dataStr = JSON.stringify(chatData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportName = `chat-export-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportName);
      linkElement.click();
    } else if (format === 'pdf') {
      // For PDF, we'd typically use a library like jsPDF
      // This is a placeholder for that functionality
      alert('PDF export functionality coming soon!');
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-3 h-3 bg-teal-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
          <div className="text-teal-600 font-medium">Processing your request...</div>
        </div>
      </div>
    );
  }

  // Render idle state (before any query is analyzed)
  if (workflowState === 'idle') {
    return (
      <div className="p-6 bg-gradient-to-b from-violet-50 to-white rounded-xl shadow-sm">
        <div className="mb-8 text-center">
          <MdAutoAwesome className="mx-auto text-5xl text-violet-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">AI Workflow Assistant</h2>
          <p className="text-slate-600 max-w-lg mx-auto">
            Ask questions in the chat to automatically filter properties or analyze market trends.
            The AI will understand your needs and provide customized results here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <FaSearch className="text-blue-500 mr-3 text-xl" />
              <h3 className="text-lg font-semibold text-slate-800">Property Search</h3>
            </div>
            <p className="text-slate-600 text-sm mb-3">
              Try asking: "Find me a 3-bedroom house in {zipCode || 'this area'} under $500,000"
            </p>
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <FaFilter className="inline-block mr-2" />
              Filter by bedrooms, bathrooms, price range, and more
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <FaChartLine className="text-emerald-500 mr-3 text-xl" />
              <h3 className="text-lg font-semibold text-slate-800">Market Analysis</h3>
            </div>
            <p className="text-slate-600 text-sm mb-3">
              Try asking: "What's the market trend in {zipCode || 'this area'}?" or "Show tax history for this property"
            </p>
            <div className="bg-emerald-50 p-3 rounded-lg text-sm text-emerald-800">
              <BiAnalyse className="inline-block mr-2" />
              Get trends, tax history, and off-market data analysis
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaFileDownload className="text-purple-500 mr-3 text-xl" />
              <h3 className="text-lg font-semibold text-slate-800">Export Conversation</h3>
            </div>
            <div className="space-x-2">
              <button 
                onClick={() => handleExportChat('json')}
                className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
              >
                JSON
              </button>
              <button 
                onClick={() => handleExportChat('pdf')}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render property search workflow
  if (workflowState === 'property-search') {
    return (
      <PropertySearchResults 
        properties={filteredProperties} 
        filters={propertyFilters}
        features={extractedFeatures}
        zipCode={zipCode}
        query={lastQuery}
        onExport={handleExportChat}
      />
    );
  }

  // Render market analysis workflow
  if (workflowState === 'market-analysis') {
    return (
      <MarketAnalysis
        marketTrends={marketTrends}
        taxHistory={taxHistoryData}
        offMarketData={offMarketData}
        zipCode={zipCode}
        features={extractedFeatures}
        selectedProperty={selectedProperty}
        query={lastQuery}
        onExport={handleExportChat}
      />
    );
  }

  // Fallback
  return (
    <div className="p-6 text-slate-600">
      Something went wrong. Please try asking a different question.
    </div>
  );
};

export default AIWorkflowTab;