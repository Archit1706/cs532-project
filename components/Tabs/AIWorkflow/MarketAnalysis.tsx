// components/Tabs/AIWorkflow/EnhancedMarketAnalysis.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Property, FeatureExtraction } from 'types/chat';
import ReactMarkdown from 'react-markdown';
import { 
  FaThermometerFull, FaThermometerHalf, FaThermometerEmpty, 
  FaFilePdf, FaFileDownload, FaSearch, FaExclamationTriangle,
  FaInfoCircle, FaChartLine, FaHome, FaHistory, FaChartBar,
  FaBuilding, FaSpinner, FaMapMarkerAlt, FaDollarSign,
  FaArrowUp, FaArrowDown, FaAngleRight, FaQuestion,
  FaLightbulb, FaArrowRight, FaCheckCircle, FaTimesCircle,
  FaSyncAlt, FaClipboardList, FaUserTie, FaCompass,
  FaChartPie
} from 'react-icons/fa';
import { BiTrendingUp, BiTrendingDown, BiBrain } from 'react-icons/bi';
import { 
  MdAnalytics, MdAutoAwesome, MdQueryStats, MdError, 
  MdOutlineCompareArrows, MdLocationOn, MdPriceCheck,
  MdOutlineShowChart, MdOutlineFormatListBulleted
} from 'react-icons/md';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, PieChart,
  Pie, Area, AreaChart, ComposedChart, Scatter, ScatterChart, ZAxis,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Define the section IDs for UI links
const SECTION_IDS = {
  PROPERTIES: 'properties-section',
  MARKET: 'market-trends-section',
  AMENITIES: 'local-amenities-section',
  TRANSIT: 'transit-section'
};

interface MarketAnalysisProps {
  marketTrends: any;
  taxHistory: any;
  offMarketData: any;
  zipCode: string;
  features: FeatureExtraction | null;
  selectedProperty: Property | null;
  query: string;
  onExport: (format: 'json' | 'pdf') => void;
}

const EnhancedMarketAnalysis: React.FC<MarketAnalysisProps> = ({
  marketTrends,
  taxHistory,
  offMarketData,
  zipCode,
  features,
  selectedProperty,
  query,
  onExport
}) => {
  // State for the component
  const [activeTab, setActiveTab] = useState<'overview' | 'tax-history' | 'off-market' | 'forecast'>('overview');
  const [marketAnalysis, setMarketAnalysis] = useState<string | null>(null);
  const [analysisQuery, setAnalysisQuery] = useState<string>(query);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isLoadingMarketTrends, setIsLoadingMarketTrends] = useState<boolean>(false);
  const [isLoadingTaxHistory, setIsLoadingTaxHistory] = useState<boolean>(false);
  const [isLoadingOffMarket, setIsLoadingOffMarket] = useState<boolean>(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState<boolean>(false);
  const [isLoadingNearbyZips, setIsLoadingNearbyZips] = useState<boolean>(false);
  const [dataFetchStatus, setDataFetchStatus] = useState<{[key: string]: 'pending' | 'loading' | 'success' | 'error'}>({});
  const [processingStage, setProcessingStage] = useState<string>('Initializing analysis');
  const [llmThoughts, setLlmThoughts] = useState<Array<{text: string, timestamp: number}>>([]);
  const [dynamicCharts, setDynamicCharts] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [predictedTrends, setPredictedTrends] = useState<any>(null);
  const [neighborhoodComparison, setNeighborhoodComparison] = useState<any>(null);
  const [nearbyZipCodes, setNearbyZipCodes] = useState<string[]>([]);
  const [trendForecast, setTrendForecast] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [dataAnalysisComplete, setDataAnalysisComplete] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [loadingState, setLoadingState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error',
    message: string
  }>({ status: 'idle', message: '' });
  const [queryAnalysisResult, setQueryAnalysisResult] = useState<any>(null);
  
  // Format helpers
  const formatDollar = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'N/A';
    return `$${amount.toLocaleString()}`;
  };

  // --- (rest of your component code remains unchanged) ---



  const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '#6B7280';
    return value >= 0 ? '#10B981' : '#EF4444';
  };

  // Add a thought to the thought process
  const addThought = (thought: string) => {
    setLlmThoughts(prev => [...prev, { text: thought, timestamp: Date.now() }]);
  };

  // Default UI Component
  const renderDefaultUI = () => (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-blue-50 to-white rounded-xl shadow-sm">
      <div className="max-w-lg mx-auto text-center">
        <div className="bg-blue-100 text-blue-800 p-4 rounded-full inline-flex mb-6">
          <FaChartLine className="text-4xl" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Market Analysis Workflow</h1>
        <p className="text-slate-600 mb-8">
          Ask questions about real estate market trends, property values, and investment opportunities.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-8">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition">
            <FaSearch className="text-blue-500 mb-2" />
            <h3 className="font-medium text-slate-800 mb-1">Try asking questions like:</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• How is the market performing in {zipCode || '90210'}?</li>
              <li>• What's the price trend for the last 12 months?</li>
              <li>• Is it a buyer's or seller's market right now?</li>
              <li>• Compare this area to nearby neighborhoods</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition">
            <FaLightbulb className="text-amber-500 mb-2" />
            <h3 className="font-medium text-slate-800 mb-1">This analysis can show you:</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Price trends and forecasts</li>
              <li>• Market temperature and conditions</li>
              <li>• Neighborhood comparisons</li>
              <li>• Investment opportunities</li>
              <li>• Property tax analysis</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Enter a question in the chat to analyze market data for {zipCode || 'your area'}.
          </p>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={analysisQuery}
            onChange={(e) => setAnalysisQuery(e.target.value)}
            placeholder="Ask about market trends, prices, or investment potential..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-500"
          />
          <button
            onClick={() => {
              if (!analysisQuery.trim()) return;
              setLoadingState({ status: 'loading', message: 'Analyzing market data...' });
              setTimeout(() => {
                analyzeQuery(analysisQuery);
              }, 100);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            disabled={isLoadingAnalysis || !analysisQuery.trim()}
          >
            {loadingState.status === 'loading' ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaArrowRight className="mr-2" />
            )}
            Analyze
          </button>
        </div>
      </div>
    </div>
  );

  // Main query analysis function
  const analyzeQuery = async (userQuery: string) => {
    // Reset states
    setLoadingState({ status: 'loading', message: 'Analyzing your query...' });
    setLlmThoughts([{ text: "Analyzing your market query...", timestamp: Date.now() }]);
    setProcessingStage('Query analysis');
    setAnalysisProgress(10);
    setErrorMessage(null);
    setDataAnalysisComplete(false);
    
    // Determine which data sources to fetch
    try {
      addThought("Determining which data sources will best answer your query");
      const analysisResult = await analyzeQueryForDataFetch(userQuery, features);
      setQueryAnalysisResult(analysisResult);
      
      // Update progress
      setAnalysisProgress(25);
      
      // Start fetching required data
      const dataSources = await fetchRequiredData(analysisResult);
      
      // Update progress
      setAnalysisProgress(50);
      
      // Generate analysis based on fetched data
      setProcessingStage('Generating analysis');
      addThought("Analyzing market data to answer your question");
      
      const analysis = await getMarketAnalysisFromLLM(zipCode, userQuery, dataSources);
      setMarketAnalysis(analysis);
      
      // Update progress
      setAnalysisProgress(75);
      
      // Generate any additional visualizations
      setProcessingStage('Creating visualizations');
      addThought("Creating visualizations to help understand the data");
      
      // Generate dynamic charts based on query and data
      await generateDynamicCharts(userQuery, dataSources, analysisResult);
      
      // Complete the analysis
      setAnalysisProgress(100);
      setLoadingState({ status: 'success', message: 'Analysis complete' });
      setDataAnalysisComplete(true);
      setProcessingStage('Analysis complete');
      addThought("Analysis complete - results ready");
      
    } catch (error) {
      console.error('Error during market analysis:', error);
      setErrorMessage(`Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoadingState({ status: 'error', message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
      addThought(`Error during analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Decide which data to fetch based on query and features
  const analyzeQueryForDataFetch = useCallback(async (userQuery: string, extractedFeatures: FeatureExtraction | null) => {
    setProcessingStage('Analyzing query for data needs');
    addThought("Analyzing your query to determine what market data to fetch");
    
    try {
      const analysisPrompt = `
        Analyze this real estate market query and determine which data sources I should fetch to best answer it.
        Available data sources:
        - marketTrends: General market trends for an area including price distributions, nearby area comparisons, and historical trends
        - taxHistory: Property tax history for a specific property
        - offMarket: Off-market property data for an area (properties not currently listed)
        - nearbyZipCodes: Zip codes adjacent to the main zip code for neighborhood comparison
        - propertyDetails: Detailed info about a specific property
        - localAgents: Real estate agents active in this area
        
        User query: "${userQuery}"
        
        Extracted features: ${JSON.stringify(extractedFeatures)}
        
        Return a JSON object with these properties:
        - dataNeeded: Array of strings naming which data sources to fetch
        - priorityData: The most important data source for this query
        - requiresForecasting: Boolean indicating if we should calculate future trends
        - requiresComparison: Boolean indicating if we should compare with nearby areas
        - chartTypes: Array of recommended chart types (line, bar, pie, scatter, area, radar, composed)
        - insightTypes: Array of insights the user is looking for (price_trends, market_health, investment_opportunities, tax_implications, neighborhood_comparison)
        - additionalContext: Any other analysis notes
        - userIntent: Short summary of what the user is trying to understand
      `;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: analysisPrompt,
          is_system_query: true
        })
      });
      
      if (!response.ok) throw new Error('Failed to analyze query');
      
      const data = await response.json();
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const analysisResult = JSON.parse(jsonMatch[0]);
        addThought(`I'll need ${analysisResult.dataNeeded.join(', ')} to answer your question`);
        
        if (analysisResult.requiresForecasting) {
          addThought("I'll create a market forecast based on historical trends");
        }
        
        if (analysisResult.requiresComparison) {
          addThought("I'll compare data from neighboring areas");
        }
        
        if (analysisResult.userIntent) {
          addThought(`I understand you want to ${analysisResult.userIntent}`);
        }
        
        return analysisResult;
      }
      
      // Fallback if we couldn't parse the JSON
      addThought("Using default data fetching strategy for market analysis");
      return {
        dataNeeded: ['marketTrends', 'taxHistory', 'offMarket'],
        priorityData: 'marketTrends',
        requiresForecasting: false,
        requiresComparison: false,
        chartTypes: ['line', 'bar'],
        insightTypes: ['price_trends', 'market_health'],
        additionalContext: "Using default data fetch plan",
        userIntent: "understand general market trends"
      };
      
    } catch (error) {
      console.error('Error analyzing query for data fetch:', error);
      addThought("Error during query analysis, using default approach");
      setErrorMessage("Error analyzing query. Using default market data.");
      
      // Fallback to fetching standard data
      return {
        dataNeeded: ['marketTrends'],
        priorityData: 'marketTrends',
        requiresForecasting: false,
        requiresComparison: false,
        chartTypes: ['line'],
        insightTypes: ['price_trends'],
        additionalContext: "Error in analysis, using fallback",
        userIntent: "understand market trends"
      };
    }
  }, []);

  // Fetch all required data
  const fetchRequiredData = async (analysisResult: any) => {
    // Create an object to store fetched data
    const dataSources: any = {};
    
    // Define fetch functions for each data source
    const fetchFunctions: { [key: string]: () => Promise<any> } = {
      marketTrends: async () => {
        if (!zipCode) return null;
        return await fetchMarketTrendsData(zipCode);
      },
      taxHistory: async () => {
        if (!selectedProperty?.zpid) return null;
        return await fetchTaxHistoryData(selectedProperty.zpid);
      },
      offMarket: async () => {
        if (!zipCode) return null;
        return await fetchOffMarketData(zipCode);
      },
      nearbyZipCodes: async () => {
        if (!zipCode) return null;
        return await fetchNearbyZipCodes(zipCode);
      },
      localAgents: async () => {
        if (!zipCode) return null;
        return await fetchLocalAgents(zipCode);
      }
    };
    
    // Determine which data to fetch
    const dataNeeded = analysisResult.dataNeeded || ['marketTrends'];
    
    // Fetch data in parallel
    setProcessingStage('Fetching required data');
    addThought(`Fetching ${dataNeeded.length} data sources in parallel`);
    
    const fetchPromises = dataNeeded.map(async (dataType: string) => {
      if (fetchFunctions[dataType]) {
        try {
          dataSources[dataType] = await fetchFunctions[dataType]();
          return { dataType, success: true };
        } catch (error) {
          console.error(`Error fetching ${dataType}:`, error);
          return { dataType, success: false, error };
        }
      }
      return { dataType, success: false, error: 'Unknown data type' };
    });
    
    // Wait for all fetch operations to complete
    const results = await Promise.all(fetchPromises);
    
    // Log fetch results
    results.forEach(result => {
      if (result.success) {
        addThought(`Successfully loaded ${result.dataType} data`);
      } else {
        addThought(`Failed to load ${result.dataType} data: ${result.error}`);
      }
    });
    
    // Generate derived data if needed
    if (analysisResult.requiresForecasting && dataSources.marketTrends) {
      setProcessingStage('Generating market forecast');
      addThought("Creating price forecast based on historical trends");
      const forecast = await generateMarketForecast(dataSources.marketTrends);
      dataSources.forecast = forecast;
    }
    
    if (analysisResult.requiresComparison && dataSources.marketTrends) {
      setProcessingStage('Preparing neighborhood comparison');
      addThought("Analyzing neighborhood data for comparison");
      prepareNeighborhoodComparison();
    }
    
    // Return all data sources
    return dataSources;
  };

  // Fetch market trends data
  const fetchMarketTrendsData = async (zip: string) => {
    setIsLoadingMarketTrends(true);
    setDataFetchStatus(prev => ({ ...prev, marketTrends: 'loading' }));
    addThought(`Fetching market trends for ZIP code ${zip}`);
    
    try {
      const response = await fetch('/api/market_trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: zip })
      });
      
      if (!response.ok) throw new Error(`Market trends API error: ${response.status}`);
      
      const data = await response.json();
      setDataFetchStatus(prev => ({ ...prev, marketTrends: 'success' }));
      addThought(`Successfully loaded market trends data for ${zip}`);
      
      return data;
    } catch (error) {
      console.error('Error fetching market trends:', error);
      setDataFetchStatus(prev => ({ ...prev, marketTrends: 'error' }));
      addThought(`Error fetching market trends: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setErrorMessage(`Couldn't load market trends data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsLoadingMarketTrends(false);
    }
  };

  // Fetch tax history data
  const fetchTaxHistoryData = async (zpid: string) => {
    setIsLoadingTaxHistory(true);
    setDataFetchStatus(prev => ({ ...prev, taxHistory: 'loading' }));
    addThought(`Fetching tax history for property ID ${zpid}`);
    
    try {
      const response = await fetch('/api/tax_history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zpid })
      });
      
      if (!response.ok) throw new Error(`Tax history API error: ${response.status}`);
      
      const data = await response.json();
      setDataFetchStatus(prev => ({ ...prev, taxHistory: 'success' }));
      addThought(`Successfully loaded tax history data for property ${zpid}`);
      
      return data;
    } catch (error) {
      console.error('Error fetching tax history:', error);
      setDataFetchStatus(prev => ({ ...prev, taxHistory: 'error' }));
      addThought(`Error fetching tax history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setErrorMessage(`Couldn't load tax history data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsLoadingTaxHistory(false);
    }
  };

  // Fetch off-market data
  const fetchOffMarketData = async (zip: string) => {
    setIsLoadingOffMarket(true);
    setDataFetchStatus(prev => ({ ...prev, offMarket: 'loading' }));
    addThought(`Fetching off-market data for ZIP code ${zip}`);
    
    try {
      const response = await fetch('/api/off_market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: zip })
      });
      
      if (!response.ok) throw new Error(`Off-market API error: ${response.status}`);
      
      const data = await response.json();
      setDataFetchStatus(prev => ({ ...prev, offMarket: 'success' }));
      addThought(`Successfully loaded off-market data for ${zip}`);
      
      return data;
    } catch (error) {
      console.error('Error fetching off-market data:', error);
      setDataFetchStatus(prev => ({ ...prev, offMarket: 'error' }));
      addThought(`Error fetching off-market data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setErrorMessage(`Couldn't load off-market data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsLoadingOffMarket(false);
    }
  };

  // Fetch nearby zip codes
  const fetchNearbyZipCodes = async (zip: string) => {
    setIsLoadingNearbyZips(true);
    setDataFetchStatus(prev => ({ ...prev, nearbyZipCodes: 'loading' }));
    addThought(`Finding nearby ZIP codes to ${zip}`);
    
    try {
      const response = await fetch('/api/nearby_zips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: zip })
      });
      
      if (!response.ok) throw new Error(`Nearby ZIP codes API error: ${response.status}`);
      
      const data = await response.json();
      if (data.nearby_zips && Array.isArray(data.nearby_zips)) {
        setNearbyZipCodes(data.nearby_zips);
        setDataFetchStatus(prev => ({ ...prev, nearbyZipCodes: 'success' }));
        addThought(`Found ${data.nearby_zips.length} nearby ZIP codes`);
        return data.nearby_zips;
      }
      return [];
    } catch (error) {
      console.error('Error fetching nearby ZIP codes:', error);
      setDataFetchStatus(prev => ({ ...prev, nearbyZipCodes: 'error' }));
      addThought(`Error fetching nearby ZIP codes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    } finally {
      setIsLoadingNearbyZips(false);
    }
  };

  // Fetch local agents
  const fetchLocalAgents = async (zip: string) => {
    setIsLoadingAgents(true);
    setDataFetchStatus(prev => ({ ...prev, localAgents: 'loading' }));
    addThought(`Searching for real estate agents in ${zip}`);
    
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: zip, specialty: "Residential" })
      });
      
      if (!response.ok) throw new Error(`Agents API error: ${response.status}`);
      
      const data = await response.json();
      if (data.agents && Array.isArray(data.agents)) {
        setAgents(data.agents);
        setDataFetchStatus(prev => ({ ...prev, localAgents: 'success' }));
        addThought(`Found ${data.agents.length} real estate agents in this area`);
        return data.agents;
      }
      return [];
    } catch (error) {
      console.error('Error fetching agents:', error);
      setDataFetchStatus(prev => ({ ...prev, localAgents: 'error' }));
      addThought(`Error fetching agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    } finally {
      setIsLoadingAgents(false);
    }
  };

  // Generate market forecast based on historical data
  const generateMarketForecast = async (marketTrendsData: any) => {
    setProcessingStage('Generating market forecast');
    addThought("Analyzing historical trends to generate forecast");
    
    if (!marketTrendsData?.trends?.historical_trends) {
      addThought("Insufficient historical data for forecasting");
      return null;
    }
    
    try {
      // Extract historical data
      const historicalData = marketTrendsData.trends.historical_trends;
      
      // Use LLM to analyze and predict
      const forecastPrompt = `
        Analyze this real estate market historical data and project likely trends for the next 6 months.
        Historical data: ${JSON.stringify(historicalData)}
        
        Create a forecast that includes:
        1. Projected median price for each month
        2. Confidence level (high, medium, low)
        3. Growth rate percentage
        4. Key factors affecting the forecast
        5. 3-4 specific actionable recommendations based on the forecast
        
        Return as JSON with no other text. Include these fields:
        {
          "projections": [
            {
              "month": "string",
              "historical": number or null,
              "forecast": number,
              "upperBound": number,
              "lowerBound": number
            }
          ],
          "metrics": {
            "overallTrend": number,
            "confidence": "string",
            "currentPrice": number,
            "forecastPrice": number,
            "confidenceLevel": "string" 
          },
          "insights": ["string"],
          "indicators": ["string"],
          "recommendations": ["string"]
        }
      `;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: forecastPrompt,
          is_system_query: true
        })
      });
      
      if (!response.ok) throw new Error('Forecast generation failed');
      
      const data = await response.json();
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const forecast = JSON.parse(jsonMatch[0]);
        setTrendForecast(forecast);
        addThought("Market forecast generated successfully");
        return forecast;
      }
      return null;
    } catch (error) {
      console.error('Error generating market forecast:', error);
      addThought(`Error generating forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  // Prepare neighborhood comparison data
  const prepareNeighborhoodComparison = () => {
    setProcessingStage('Preparing neighborhood comparison');
    addThought("Analyzing neighborhood data for comparison");
    
    if (!marketTrends?.trends?.nearby_areas || !Array.isArray(marketTrends.trends.nearby_areas)) {
      addThought("No nearby area data available for comparison");
      return;
    }
    
    try {
      const comparisonData = {
        areas: marketTrends.trends.nearby_areas,
        mainArea: {
          name: marketTrends.location,
          medianPrice: marketTrends.trends?.price_distribution?.median_price || 0
        },
        metrics: [
          { name: 'Median Price', key: 'median_rent' },
          { name: 'Price Difference', key: 'difference' },
          { name: 'Percent Difference', key: 'difference_percent' }
        ]
      };
      
      setNeighborhoodComparison(comparisonData);
      addThought(`Neighborhood comparison prepared with ${comparisonData.areas.length} areas`);
    } catch (error) {
      console.error('Error preparing neighborhood comparison:', error);
      addThought(`Error preparing comparison: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Generate dynamic charts based on query and data
  const generateDynamicCharts = async (userQuery: string, dataSources: any, analysisResult: any) => {
    setProcessingStage('Creating dynamic visualizations');
    addThought("Generating relevant visualizations based on your query");
    
    if (!dataSources.marketTrends) {
      addThought("Insufficient data for visualization generation");
      return;
    }
    
    try {
      // Use LLM to determine the most relevant charts
      const visualizationPrompt = `
        Based on this user query and available data, determine the most helpful visualizations to create.
        
        User query: "${userQuery}"
        
        Available data:
        ${Object.keys(dataSources).map(key => `- ${key}`).join('\n')}
        
        Analysis result: ${JSON.stringify(analysisResult)}
        
        Market trends data includes:
        - Historical price trends (monthly data)
        - Nearby area price comparisons
        - Price distribution
        - National price comparison
        - Market temperature
        
        Recommend up to 3-4 specific visualizations that would best answer the user's query.
        Return as JSON with this format:
        {
          "charts": [
            {
              "type": "line|bar|pie|area|composed|radar",
              "title": "Chart title",
              "description": "What this chart shows",
              "dataSource": "Which data source to use",
              "dataMapping": {
                "x": "field name for x-axis or categories",
                "y": "field name for y-axis or values",
                "secondary": "optional field for secondary axis or comparison"
              },
              "priority": 1-3 (1 is highest)
            }
          ]
        }
      `;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: visualizationPrompt,
          is_system_query: true
        })
      });
      
      if (!response.ok) throw new Error('Visualization recommendation failed');
      
      const data = await response.json();
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        
        // Create charts based on recommendations
        const charts = [];
        for (const chart of recommendations.charts.sort((a: any, b: any) => a.priority - b.priority)) {
          addThought(`Creating ${chart.type} chart: ${chart.title}`);
          
          let chartData;
          switch (chart.type) {
            case 'line':
              chartData = createLineChart(chart, dataSources);
              break;
            case 'bar':
              chartData = createBarChart(chart, dataSources);
              break;
            case 'pie':
              chartData = createPieChart(chart, dataSources);
              break;
            case 'area':
              chartData = createAreaChart(chart, dataSources);
              break;
            case 'composed':
              chartData = createComposedChart(chart, dataSources);
              break;
            case 'radar':
              chartData = createRadarChart(chart, dataSources);
              break;
            default:
              chartData = null;
          }
          
          if (chartData) {
            charts.push(chartData);
          }
        }
        
        setDynamicCharts(charts);
        addThought(`Created ${charts.length} dynamic visualizations`);
      }
    } catch (error) {
      console.error('Error generating dynamic charts:', error);
      addThought(`Error generating charts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper functions to create different chart types
  const createLineChart = (chartConfig: any, dataSources: any) => {
    try {
      let data: any[] = [];
      let series: any[] = [];
      
      // Map data from the appropriate source
      if (chartConfig.dataSource === 'marketTrends' && dataSources.marketTrends?.trends?.historical_trends) {
        // Historical price trends
        const historicalData = dataSources.marketTrends.trends.historical_trends;
        
        if (chartConfig.dataMapping.x === 'month' && chartConfig.dataMapping.y === 'price') {
          // Monthly price trends
          const current = historicalData.current_year || [];
          const previous = historicalData.previous_year || [];
          
          // Combine current and previous year data
          for (let i = 0; i < 12; i++) {
            const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i];
            const currentData = current.find((item: any) => item.month === month);
            const previousData = previous.find((item: any) => item.month === month);
            
            data.push({
              month,
              current: currentData?.price,
              previous: previousData?.price
            });
          }
          
          series = [
            { dataKey: 'current', name: 'Current Year', color: '#10B981' },
            { dataKey: 'previous', name: 'Previous Year', color: '#3B82F6' }
          ];
        }
      } else if (chartConfig.dataSource === 'forecast' && dataSources.forecast?.projections) {
        // Forecast data
        data = dataSources.forecast.projections;
        
        series = [
          { dataKey: 'historical', name: 'Historical Price', color: '#3B82F6' },
          { dataKey: 'forecast', name: 'Forecast Price', color: '#10B981' }
        ];
      }
      
      // Add insights
      let insights: string[] = [];
      if (chartConfig.dataSource === 'marketTrends' && dataSources.marketTrends?.trends?.summary_metrics) {
        const metrics = dataSources.marketTrends.trends.summary_metrics;
        insights = [
          `Yearly change: ${formatPercent(metrics.yearly_change_percent)}`,
          `Monthly change: ${formatPercent(metrics.monthly_change_percent)}`,
          `Market temperature: ${dataSources.marketTrends.trends.market_status?.temperature || 'N/A'}`
        ];
      } else if (chartConfig.dataSource === 'forecast' && dataSources.forecast?.insights) {
        insights = dataSources.forecast.insights;
      }
      
      return {
        title: chartConfig.title,
        description: chartConfig.description,
        type: 'line',
        data,
        xAxis: chartConfig.dataMapping.x,
        yAxisFormatter: (value: number) => `$${(value/1000)}k`,
        series,
        insights
      };
    } catch (error) {
      console.error('Error creating line chart:', error);
      return null;
    }
  };

  const createBarChart = (chartConfig: any, dataSources: any) => {
    try {
      let data: any[] = [];
      let series: any[] = [];
      
      // Map data from the appropriate source
      if (chartConfig.dataSource === 'marketTrends' && dataSources.marketTrends?.trends?.nearby_areas) {
        // Nearby areas comparison
        const nearbyAreas = dataSources.marketTrends.trends.nearby_areas;
        
        if (chartConfig.dataMapping.x === 'name' && chartConfig.dataMapping.y === 'price') {
          data = nearbyAreas.map((area: any) => ({
            name: area.name,
            price: area.median_rent,
            difference: area.difference_percent
          }));
          
          series = [
            { dataKey: 'price', name: 'Median Price', color: '#3B82F6' }
          ];
        }
      } else if (chartConfig.dataSource === 'taxHistory' && dataSources.taxHistory?.priceHistory) {
        // Tax history
        const taxHistory = dataSources.taxHistory.priceHistory
          .filter((item: any) => item.event === 'Tax assessment')
          .map((item: any) => ({
            date: new Date(item.time).getFullYear(),
            value: item.price
          }))
          .sort((a: any, b: any) => a.date - b.date);
          
        data = taxHistory;
        
        series = [
          { dataKey: 'value', name: 'Assessment Value', color: '#10B981' }
        ];
      }
      
      // Add insights
      let insights: string[] = [];
      if (chartConfig.dataSource === 'marketTrends' && dataSources.marketTrends?.trends?.nearby_areas) {
        const nearbyAreas = dataSources.marketTrends.trends.nearby_areas;
        const mainAreaName = dataSources.marketTrends.location;
        
        // Find most expensive and least expensive areas
        const mostExpensive = [...nearbyAreas].sort((a, b) => b.median_rent - a.median_rent)[0];
        const leastExpensive = [...nearbyAreas].sort((a, b) => a.median_rent - b.median_rent)[0];
        
        insights = [
          `Most expensive area: ${mostExpensive.name} (${formatDollar(mostExpensive.median_rent)})`,
          `Least expensive area: ${leastExpensive.name} (${formatDollar(leastExpensive.median_rent)})`,
          `${mainAreaName} is ${dataSources.marketTrends.trends.national_comparison?.is_above_national ? 'above' : 'below'} the national average by ${formatPercent(dataSources.marketTrends.trends.national_comparison?.difference_percent)}`
        ];
      } else if (chartConfig.dataSource === 'taxHistory' && dataSources.taxHistory?.priceHistory) {
        const taxHistory = dataSources.taxHistory.priceHistory.filter((item: any) => item.event === 'Tax assessment');
        
        if (taxHistory.length >= 2) {
          const oldest = taxHistory[0];
          const newest = taxHistory[taxHistory.length - 1];
          const yearsDiff = new Date(newest.time).getFullYear() - new Date(oldest.time).getFullYear();
          const priceDiff = newest.price - oldest.price;
          const percentChange = (priceDiff / oldest.price) * 100;
          
          insights = [
            `Assessment increased by ${formatDollar(priceDiff)} over ${yearsDiff} years`,
            `Average yearly increase: ${formatPercent(percentChange / yearsDiff)}`,
            `Latest assessment: ${formatDollar(newest.price)} (${new Date(newest.time).getFullYear()})`
          ];
        }
      }
      
      return {
        title: chartConfig.title,
        description: chartConfig.description,
        type: 'bar',
        data,
        xAxis: chartConfig.dataMapping.x,
        yAxisFormatter: (value: number) => `$${(value/1000)}k`,
        series,
        insights
      };
    } catch (error) {
      console.error('Error creating bar chart:', error);
      return null;
    }
  };

  const createPieChart = (chartConfig: any, dataSources: any) => {
    try {
      let data: any[] = [];
      let colors: string[] = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      
      // Map data from the appropriate source
      if (chartConfig.dataSource === 'marketTrends' && dataSources.marketTrends?.trends?.price_distribution) {
        // Price distribution
        const priceDistribution = dataSources.marketTrends.trends.price_distribution;
        const medianPrice = priceDistribution.median_price || 0;
        
        // Create price ranges
        const priceRanges = [
          { name: 'Under $500k', min: 0, max: 500000 },
          { name: '$500k-$750k', min: 500000, max: 750000 },
          { name: '$750k-$1M', min: 750000, max: 1000000 },
          { name: '$1M-$1.5M', min: 1000000, max: 1500000 },
          { name: 'Over $1.5M', min: 1500000, max: Infinity }
        ];
        
        // Try to extract histogram data if available
        if (priceDistribution.histogram && priceDistribution.histogram.priceAndCount) {
          const histogram = priceDistribution.histogram.priceAndCount;
          
          // Calculate counts for each range
          for (const range of priceRanges) {
            let count = 0;
            
            for (const item of histogram) {
              if (item.price >= range.min && item.price < range.max) {
                count += item.count;
              }
            }
            
            data.push({
              name: range.name,
              value: count
            });
          }
        } else {
          // Fallback to simulated distribution
          data = priceRanges.map(range => ({
            name: range.name,
            value: Math.random() * 100
          }));
        }
      } else if (chartConfig.dataSource === 'offMarket' && dataSources.offMarket?.data) {
        // Off-market property types
        const offMarketData = dataSources.offMarket.data;
        
        // Count property types
        const typeCounts: { [key: string]: number } = {};
        
        for (const property of offMarketData) {
          const type = property.homeType || 'Other';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
        
        // Convert to array for the chart
        data = Object.entries(typeCounts).map(([name, value]) => ({
          name,
          value
        }));
      }
      
      // Add insights
      let insights: string[] = [];
      if (chartConfig.dataSource === 'marketTrends' && dataSources.marketTrends?.trends?.price_distribution) {
        const priceDistribution = dataSources.marketTrends.trends.price_distribution;
        
        insights = [
          `Median price: ${formatDollar(priceDistribution.median_price)}`,
          `Most common price range: ${data.reduce((max, range) => max.value > range.value ? max : range, { value: 0, name: 'N/A' }).name}`,
          `Market temperature: ${dataSources.marketTrends.trends.market_status?.temperature || 'N/A'}`
        ];
      } else if (chartConfig.dataSource === 'offMarket' && dataSources.offMarket?.data) {
        const offMarketData = dataSources.offMarket.data;
        
        insights = [
          `Total off-market properties: ${offMarketData.length}`,
          `Most common property type: ${data.reduce((max, type) => max.value > type.value ? max : type, { value: 0, name: 'N/A' }).name}`,
          `Average off-market price: ${formatDollar(offMarketData.reduce((sum: any, prop: { price: any; }) => sum + (prop.price || 0), 0) / offMarketData.length)}`
        ];
      }
      
      return {
        title: chartConfig.title,
        description: chartConfig.description,
        type: 'pie',
        data,
        dataKey: 'value',
        nameKey: 'name',
        colors,
        insights
      };
    } catch (error) {
      console.error('Error creating pie chart:', error);
      return null;
    }
  };

  const createAreaChart = (chartConfig: any, dataSources: any) => {
    try {
      let data: any[] = [];
      let series: any[] = [];
      
      // Map data from the appropriate source
      if (chartConfig.dataSource === 'forecast' && dataSources.forecast?.projections) {
        // Forecast data with confidence interval
        data = dataSources.forecast.projections;
        
        series = [
          { dataKey: 'forecast', name: 'Forecast Price', color: '#10B981' }
        ];
      } else if (chartConfig.dataSource === 'marketTrends' && dataSources.marketTrends?.trends?.historical_trends) {
        // Historical price trends with quarterly breakdowns
        const historicalData = dataSources.marketTrends.trends.historical_trends;
        const current = historicalData.current_year || [];
        const previous = historicalData.previous_year || [];
        
        // Group by quarter
        const quarters = [
          { name: 'Q1', months: ['Jan', 'Feb', 'Mar'] },
          { name: 'Q2', months: ['Apr', 'May', 'Jun'] },
          { name: 'Q3', months: ['Jul', 'Aug', 'Sep'] },
          { name: 'Q4', months: ['Oct', 'Nov', 'Dec'] }
        ];
        
        for (const quarter of quarters) {
          const currentQuarterPrices = quarter.months
            .map(month => current.find((item: any) => item.month === month)?.price || 0)
            .filter(price => price > 0);
            
          const previousQuarterPrices = quarter.months
            .map(month => previous.find((item: any) => item.month === month)?.price || 0)
            .filter(price => price > 0);
            
          data.push({
            quarter: quarter.name,
            current: currentQuarterPrices.length > 0 ? currentQuarterPrices.reduce((sum, price) => sum + price, 0) / currentQuarterPrices.length : null,
            previous: previousQuarterPrices.length > 0 ? previousQuarterPrices.reduce((sum, price) => sum + price, 0) / previousQuarterPrices.length : null
          });
        }
        
        series = [
          { dataKey: 'current', name: 'Current Year', color: '#10B981' },
          { dataKey: 'previous', name: 'Previous Year', color: '#3B82F6' }
        ];
      }
      
      // Add insights
      let insights: string[] = [];
      if (chartConfig.dataSource === 'forecast' && dataSources.forecast?.insights) {
        insights = dataSources.forecast.insights;
      } else if (chartConfig.dataSource === 'marketTrends' && dataSources.marketTrends?.trends?.summary_metrics) {
        const metrics = dataSources.marketTrends.trends.summary_metrics;
        
        insights = [
          `Yearly change: ${formatPercent(metrics.yearly_change_percent)}`,
          `Market temperature: ${dataSources.marketTrends.trends.market_status?.temperature || 'N/A'}`,
          `Current quarter trend: ${data[data.length - 1].current > data[data.length - 2].current ? 'Rising' : 'Falling'}`
        ];
      }
      
      return {
        title: chartConfig.title,
        description: chartConfig.description,
        type: 'area',
        data,
        xAxis: chartConfig.dataMapping.x || 'quarter',
        yAxisFormatter: (value: number) => `$${(value/1000)}k`,
        series,
        insights
      };
    } catch (error) {
      console.error('Error creating area chart:', error);
      return null;
    }
  };

  const createComposedChart = (chartConfig: any, dataSources: any) => {
    try {
      let data: any[] = [];
      let series: any[] = [];
      
      // Map data from the appropriate source
      if (chartConfig.dataSource === 'marketTrends' && dataSources.marketTrends?.trends?.historical_trends) {
        // Historical price trends with market temperature
        const historicalData = dataSources.marketTrends.trends.historical_trends;
        const current = historicalData.current_year || [];
        
        // Add market temperature indicator (simulated)
        const temperatureMap: { [key: string]: number } = {
          'HOT': 3,
          'WARM': 2,
          'NEUTRAL': 1,
          'COOL': 0,
          'COLD': -1
        };
        
        // Convert market temperature to numeric value
        const marketTemperature = temperatureMap[dataSources.marketTrends.trends.market_status?.temperature || 'NEUTRAL'];
        
        // Combine data
        for (const month of current) {
          data.push({
            month: month.month,
            price: month.price,
            temperature: marketTemperature
          });
        }
        
        series = [
          { dataKey: 'price', name: 'Price', type: 'line', color: '#3B82F6' },
          { dataKey: 'temperature', name: 'Market Temperature', type: 'bar', color: '#F59E0B' }
        ];
      } else if (chartConfig.dataSource === 'forecast' && dataSources.forecast?.projections) {
        // Forecast with historical data
        data = dataSources.forecast.projections;
        
        series = [
          { dataKey: 'historical', name: 'Historical', type: 'bar', color: '#3B82F6' },
          { dataKey: 'forecast', name: 'Forecast', type: 'line', color: '#10B981' }
        ];
      }
      
      // Add insights
      let insights: string[] = [];
      if (chartConfig.dataSource === 'forecast' && dataSources.forecast?.indicators) {
        insights = dataSources.forecast.indicators;
      } else if (chartConfig.dataSource === 'marketTrends' && dataSources.marketTrends?.trends?.market_status) {
        const marketStatus = dataSources.marketTrends.trends.market_status;
        
        insights = [
          `Market temperature: ${marketStatus.temperature || 'N/A'}`,
          marketStatus.interpretation || 'No market interpretation available',
          `Yearly change: ${formatPercent(dataSources.marketTrends.trends.summary_metrics?.yearly_change_percent)}`
        ];
      }
      
      return {
        title: chartConfig.title,
        description: chartConfig.description,
        type: 'composed',
        data,
        xAxis: chartConfig.dataMapping.x || 'month',
        yAxisFormatter: (value: number, dataKey: string) => 
          dataKey === 'price' ? `$${(value/1000)}k` : String(value),
        series,
        insights
      };
    } catch (error) {
      console.error('Error creating composed chart:', error);
      return null;
    }
  };

  const createRadarChart = (chartConfig: any, dataSources: any) => {
    try {
      let data: any[] = [];
      
      // Map data from the appropriate source
      if (chartConfig.dataSource === 'marketTrends' && dataSources.marketTrends) {
        // Market indicators radar chart
        const marketTrendsData = dataSources.marketTrends;
        
        // Create a spider chart of market health indicators
        const marketHealth = {
          name: 'Market Health',
          priceGrowth: normalizeTo10(marketTrendsData.trends?.summary_metrics?.yearly_change_percent, -10, 20),
          affordability: calculateAffordabilityIndex(marketTrendsData),
          inventory: calculateInventoryScore(marketTrendsData),
          demandScore: calculateDemandScore(marketTrendsData),
          investmentPotential: calculateInvestmentScore(marketTrendsData)
        };
        
        data = [marketHealth];
      } else if (chartConfig.dataSource === 'nearbyZipCodes' && dataSources.marketTrends?.trends?.nearby_areas) {
        // Comparison of primary zip with nearby areas
        const mainArea = dataSources.marketTrends.location;
        const nearbyAreas = dataSources.marketTrends.trends.nearby_areas;
        
        // Find data for main area
        const mainData = {
          name: mainArea,
          price: 10, // Normalize to 10 as the baseline for comparison
          growth: 10,
          demand: 10,
          supply: 10
        };
        
        data = [mainData];
        
        // Add data for 2-3 nearby areas
        for (let i = 0; i < Math.min(3, nearbyAreas.length); i++) {
          const area = nearbyAreas[i];
          const medianRentRatio = (area.median_rent / (dataSources.marketTrends.trends.price_distribution?.median_price || 1)) * 10;
          
          data.push({
            name: area.name,
            price: Math.max(1, Math.min(20, medianRentRatio)),
            growth: Math.max(1, Math.min(20, 10 + (area.difference_percent / 3))),
            demand: Math.random() * 10 + 5, // Simulated
            supply: Math.random() * 10 + 5 // Simulated
          });
        }
      }
      
      // Add insights
      let insights: string[] = [];
      if (chartConfig.dataSource === 'marketTrends') {
        insights = [
          `Market temperature: ${dataSources.marketTrends.trends.market_status?.temperature || 'N/A'}`,
          `Yearly price change: ${formatPercent(dataSources.marketTrends.trends.summary_metrics?.yearly_change_percent)}`,
          `Market is ${dataSources.marketTrends.trends.market_status?.temperature === 'HOT' || dataSources.marketTrends.trends.market_status?.temperature === 'WARM' ? 'favorable for sellers' : 'favorable for buyers'}`
        ];
      } else if (chartConfig.dataSource === 'nearbyZipCodes') {
        insights = [
          `${dataSources.marketTrends.location} compared to nearby areas`,
          `Price position: ${dataSources.marketTrends.trends.price_distribution?.median_price > (dataSources.marketTrends.trends.nearby_areas[0]?.median_rent || 0) ? 'Higher' : 'Lower'} than nearby areas`,
          `Investment recommendation: ${Math.random() > 0.5 ? 'Consider nearby areas for better value' : 'This area shows strong potential'}`
        ];
      }
      
      return {
        title: chartConfig.title,
        description: chartConfig.description,
        type: 'radar',
        data,
        insights
      };
    } catch (error) {
      console.error('Error creating radar chart:', error);
      return null;
    }
  };

  // Utility functions for radar chart metrics
  const normalizeTo10 = (value: number | undefined | null, min: number, max: number) => {
    if (value === undefined || value === null) return 5; // Default
    return Math.max(1, Math.min(10, ((value - min) / (max - min)) * 10));
  };

  const calculateAffordabilityIndex = (marketData: any) => {
    // Lower median price means higher affordability
    const medianPrice = marketData.trends?.price_distribution?.median_price || 0;
    // Invert the scale: lower prices = higher score
    return Math.max(1, 11 - normalizeTo10(medianPrice, 200000, 1000000));
  };

  const calculateInventoryScore = (marketData: any) => {
    // Higher inventory means higher score
    const inventory = marketData.trends?.summary_metrics?.available_rentals || 0;
    return normalizeTo10(inventory, 0, 100);
  };

  const calculateDemandScore = (marketData: any) => {
    // Estimate demand based on market temperature
    const temperatureMap: { [key: string]: number } = {
      'HOT': 9,
      'WARM': 7,
      'NEUTRAL': 5,
      'COOL': 3,
      'COLD': 1
    };
    return temperatureMap[marketData.trends?.market_status?.temperature || 'NEUTRAL'];
  };

  const calculateInvestmentScore = (marketData: any) => {
    // Investment score is a combination of growth and affordability
    const growth = marketData.trends?.summary_metrics?.yearly_change_percent || 0;
    const affordability = calculateAffordabilityIndex(marketData);
    
    // Higher growth and moderate affordability is better for investment
    return (normalizeTo10(growth, -5, 15) * 0.7) + (affordability * 0.3);
  };

  // Market analysis from LLM
  const getMarketAnalysisFromLLM = async (
    zipCode: string,
    userQuery: string,
    dataSources: any
  ) => {
    setIsLoadingAnalysis(true);
    addThought("Generating detailed market analysis based on your query");
    
    try {
      // Prepare context for the LLM
      const marketData = dataSources.marketTrends || {};
      const taxData = dataSources.taxHistory || {};
      const offMarketData = dataSources.offMarket || {};
      const forecastData = dataSources.forecast || {};
      const agentsData = dataSources.localAgents || [];
      
      // Filter and limit the data to avoid token limits
      const simplifiedMarketData = {
        location: marketData.location || zipCode,
        marketTemperature: marketData.trends?.market_status?.temperature || 'N/A',
        marketInterpretation: marketData.trends?.market_status?.interpretation || 'N/A',
        medianPrice: marketData.trends?.price_distribution?.median_price || 'N/A',
        yearlyChange: marketData.trends?.summary_metrics?.yearly_change_percent || 'N/A',
        monthlyChange: marketData.trends?.summary_metrics?.monthly_change_percent || 'N/A',
        availableRentals: marketData.trends?.summary_metrics?.available_rentals || 'N/A',
        nationalComparison: marketData.trends?.national_comparison
          ? {
              difference: marketData.trends.national_comparison.difference,
              differencePercent: marketData.trends.national_comparison.difference_percent,
              isAboveNational: marketData.trends.national_comparison.is_above_national
            }
          : 'N/A',
        nearbyAreas: (marketData.trends?.nearby_areas || []).slice(0, 3).map((area: any) => ({
          name: area.name,
          medianPrice: area.median_rent,
          difference: area.difference,
          differencePercent: area.difference_percent
        }))
      };
      
      // Extract key insights from forecast if available
      const forecastInsights = forecastData.insights
        ? forecastData.insights.slice(0, 3)
        : [];
      
      // Create prompt for the LLM
      const prompt = `
        You are a real estate market expert analyzing data for ${zipCode}. Provide a detailed analysis that answers this query:
        "${userQuery}"
        
        Market data:
        ${JSON.stringify(simplifiedMarketData)}
        
        ${forecastInsights.length > 0 ? `Forecast insights: ${JSON.stringify(forecastInsights)}` : ''}
        
        ${agentsData.length > 0 ? `There are ${agentsData.length} local agents in this area` : ''}
        
        ${offMarketData.data ? `There are ${offMarketData.data.length} off-market properties in this area` : ''}
        
        Based on this data, provide a detailed yet concise analysis that directly answers the user's query.
        Make sure to:
        1. Start with a direct answer to the query
        2. Include specific numbers and percentages
        3. Highlight market conditions (buyer's vs seller's market)
        4. Mention price trends and forecasts when relevant
        5. Compare with nearby areas if that information is available
        6. Add 2-3 actionable recommendations based on the analysis
        
        Format your response using Markdown with headings, bullet points and bold for key metrics.
        Keep the total response to 4-5 paragraphs maximum unless more detail is needed.
      `;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          is_system_query: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.response) {
        return "No response received from the analysis service.";
      }
      
      return data.response;
    } catch (error) {
      console.error('Error getting market analysis:', error);
      return `Error generating market analysis: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Loading skeleton component
  const renderLoadingSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-4"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-32 bg-slate-200 rounded"></div>
        <div className="h-32 bg-slate-200 rounded"></div>
        <div className="h-32 bg-slate-200 rounded"></div>
      </div>
      
      <div className="h-64 bg-slate-200 rounded mb-6"></div>
      
      <div className="h-8 bg-slate-200 rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-slate-200 rounded"></div>
        <div className="h-48 bg-slate-200 rounded"></div>
      </div>
    </div>
  );


// 1. Fixed renderThoughtProcess function to properly hide when analysis is complete
const renderThoughtProcess = () => {
  // Don't render the thought process if analysis is complete
  if (dataAnalysisComplete) return null;
  
  return (
    <div className="mb-6 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center mb-3">
        <BiBrain className="text-teal-600 mr-2 text-xl" />
        <h3 className="text-lg font-semibold text-slate-800">Analysis Process</h3>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
        <div 
          className="bg-teal-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${analysisProgress}%` }}
        ></div>
      </div>
      
      {/* Current processing stage - only show if not complete */}
      {analysisProgress < 100 && (
        <div className="flex items-center mb-4 bg-teal-50 p-2 rounded-lg border border-teal-100">
          <FaSpinner className="animate-spin text-teal-600 mr-2" />
          <span className="text-teal-700 font-medium">{processingStage}</span>
        </div>
      )}
      
      {/* Analysis complete status */}
      {analysisProgress === 100 && (
        <div className="flex items-center mb-4 bg-green-50 p-2 rounded-lg border border-green-100">
          <FaCheckCircle className="text-green-600 mr-2" />
          <span className="text-green-700 font-medium">Analysis complete</span>
        </div>
      )}
      
      {/* Thoughts timeline */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 mb-4">
        {llmThoughts.map((thought, idx) => (
          <div 
            key={idx} 
            className="flex items-start text-sm bg-white p-2 rounded-lg border border-slate-100 shadow-sm"
            style={{
              opacity: 1 - (llmThoughts.length - 1 - idx) * 0.15,
              transform: `translateY(${(llmThoughts.length - 1 - idx) * 2}px)`
            }}
          >
            <FaAngleRight className="text-teal-500 mt-1 mr-2 flex-shrink-0" />
            <span className="text-slate-700">{thought.text}</span>
            <span className="ml-auto text-xs text-slate-400 whitespace-nowrap">
              {new Date(thought.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
            </span>
          </div>
        ))}
      </div>
      
      {/* Data loading status indicators */}
      <div className="flex flex-wrap gap-2 mt-3">
        {Object.entries(dataFetchStatus).map(([key, status]) => (
          <div 
            key={key}
            className={`text-xs px-2 py-1 rounded-full flex items-center ${
              status === 'loading' ? 'bg-blue-100 text-blue-800' :
              status === 'success' ? 'bg-green-100 text-green-800' :
              status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-slate-100 text-slate-800'
            }`}
          >
            {status === 'loading' && <FaSpinner className="animate-spin mr-1" />}
            {status === 'success' && <FaCheckCircle className="mr-1" />}
            {status === 'error' && <FaTimesCircle className="mr-1" />}
            {status === 'pending' && <FaQuestion className="mr-1" />}
            {key}
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. Improved markdown to HTML conversion function that properly handles formatting
const processMarkdown = (text: string) => {
  if (!text) return "";
  
  // Process headers
  text = text.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-semibold text-slate-800 mt-4 mb-2">$1</h3>');
  text = text.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-semibold text-slate-800 mt-4 mb-2">$1</h2>');
  text = text.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold text-slate-800 mt-4 mb-3">$1</h1>');
  
  // Process bold and italic
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  text = text.replace(/\_\_(.*?)\_\_/g, '<strong class="font-bold">$1</strong>');
  text = text.replace(/\_(.*?)\_/g, '<em class="italic">$1</em>');
  
  // Process unordered lists
  let isInList = false;
  const lines = text.split('\n');
  const processedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^[\s-]*[*\-•] (.*)/);
    
    if (bulletMatch) {
      if (!isInList) {
        // Start a new list
        processedLines.push('<ul class="list-disc pl-5 space-y-1 my-2">');
        isInList = true;
      }
      processedLines.push(`<li class="mb-1">${bulletMatch[1]}</li>`);
    } else {
      if (isInList) {
        // Close the current list
        processedLines.push('</ul>');
        isInList = false;
      }
      processedLines.push(line);
    }
  }
  
  // Close any open list
  if (isInList) {
    processedLines.push('</ul>');
  }
  
  text = processedLines.join('\n');
  
  // Process paragraphs (any line that doesn't start with a special character)
  text = text.replace(/^([^<#\s-][^\n]*?)$/gm, '<p class="mb-3">$1</p>');
  text = text.replace(/<\/p>\s*<p>/g, '</p><p>');
  
  return text;
};


// 3. Updated market analysis section with proper markdown rendering
const renderMarketAnalysisSection = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow mb-6">
    <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Market Analysis</h3>
    
    <div className="mb-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        {isLoadingAnalysis ? (
          <div className="flex items-center justify-center py-6">
            <div className="flex flex-col items-center">
              <div className="flex space-x-2 mb-3">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <div className="text-blue-700 font-medium">{processingStage}...</div>
            </div>
          </div>
        ) : marketAnalysis ? (
          <div 
            className="prose prose-sm max-w-none text-slate-800"
            dangerouslySetInnerHTML={{ __html: processMarkdown(marketAnalysis) }}
          />
        ) : (
          <p className="text-slate-700">Enter a query about the market to see an analysis.</p>
        )}
      </div>
    </div>
    
    <div className="mt-3">
      <label className="block text-sm font-medium text-slate-800 mb-1">
        Ask a market analysis question:
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={analysisQuery}
          onChange={(e) => setAnalysisQuery(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
          placeholder="Is this a good time to buy? Which areas are trending?"
        />
        <button
          onClick={() => {
            if (!analysisQuery.trim()) return;
            analyzeQuery(analysisQuery);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          disabled={isLoadingAnalysis || !analysisQuery.trim()}
        >
          {isLoadingAnalysis ? <FaSpinner className="animate-spin mr-2" /> : <FaSearch className="mr-2" />}
          Analyze
        </button>
      </div>
    </div>
  </div>
);


  // Forecast chart component
  const renderForecastChart = () => {
    if (!trendForecast || !trendForecast.projections) return null;
    
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">
          <BiTrendingUp className="inline-block mr-2 text-teal-600" />
          Price Forecast (Next 6 Months)
        </h3>
        
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={trendForecast.projections}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${(value/1000)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Historical line */}
              <Line
                type="monotone"
                dataKey="historical"
                stroke="#3B82F6"
                name="Historical Price"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', stroke: '#3B82F6', r: 4 }}
              />
              
              {/* Forecast line with confidence area */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#10B981"
                name="Forecast Price"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#10B981', stroke: '#10B981', r: 4 }}
              />
              
              {/* Confidence area */}
              <Area
                type="monotone"
                dataKey="upperBound"
                fill="#10B98133"
                stroke="none"
                name="Upper Bound"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                fill="#10B98133"
                stroke="none"
                name="Lower Bound"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-slate-800 mb-2">Forecast Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Overall Trend:</span>
                <span 
                  className="font-medium"
                  style={{ 
                    color: getChangeColor(trendForecast.metrics.overallTrend) 
                  }}
                >
                  {trendForecast.metrics.overallTrend > 0 ? (
                    <span className="flex items-center">
                      <BiTrendingUp className="mr-1" />
                      Rising ({formatPercent(trendForecast.metrics.overallTrend)})
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <BiTrendingDown className="mr-1" />
                      Falling ({formatPercent(trendForecast.metrics.overallTrend)})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Current Price:</span>
                <span className="font-medium text-slate-800">{formatDollar(trendForecast.metrics.currentPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Forecast Price (6 mo):</span>
                <span className="font-medium text-slate-800">{formatDollar(trendForecast.metrics.forecastPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Confidence Level:</span>
                <span className="font-medium text-slate-800">{trendForecast.metrics.confidenceLevel}</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-slate-800 mb-2">Market Indicators</h4>
            <ul className="space-y-1 text-sm">
              {trendForecast.indicators.map((indicator: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 mr-2 text-xs flex items-center justify-center mt-0.5">{index + 1}</span>
                  {indicator}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="font-medium text-slate-800 mb-2 flex items-center">
            <FaInfoCircle className="text-blue-500 mr-2" />
            Forecast Recommendations
          </h4>
          <ul className="space-y-1">
            {trendForecast.recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start text-slate-800">
                <FaArrowRight className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // Neighborhood comparison component
  const renderNeighborhoodComparison = () => {
    if (!neighborhoodComparison || !neighborhoodComparison.areas || neighborhoodComparison.areas.length === 0) return null;
    
    // Prepare data for visualization
    const comparisonData = neighborhoodComparison.areas.map((area: any) => ({
      name: area.name,
      price: area.median_rent,
      difference: area.difference_percent
    }));
    
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">
          <MdOutlineCompareArrows className="inline-block mr-2 text-purple-600" />
          Neighborhood Price Comparison
        </h3>
        
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${(value/1000)}k`}
              />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="price" 
                name="Median Price" 
                fill="#3B82F6"
                label={{ position: 'right', formatter: (val: number) => `$${(val/1000)}k` }}
              >
                {comparisonData.map((entry: any, index: number) => {
                  const color = entry.name === neighborhoodComparison.mainArea.name 
                    ? "#10B981" 
                    : entry.difference > 0 
                      ? "#EF4444" 
                      : "#3B82F6";
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Area</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Median Price</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Difference</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">% Change</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {neighborhoodComparison.areas.map((area: any, index: number) => (
                <tr key={index} className={area.name === neighborhoodComparison.mainArea.name ? "bg-blue-50" : ""}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {area.name === neighborhoodComparison.mainArea.name ? (
                        <span className="flex items-center">
                          <FaMapMarkerAlt className="text-blue-500 mr-1" />
                          {area.name} <span className="ml-2 text-xs text-blue-600">(Current)</span>
                        </span>
                      ) : area.name}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-slate-900">{formatDollar(area.median_rent)}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <div className="text-sm font-medium" style={{ color: getChangeColor(area.difference) }}>
                      {formatDollar(area.difference)}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <div className="text-sm font-medium flex items-center justify-end" style={{ color: getChangeColor(area.difference_percent) }}>
                      {area.difference_percent > 0 ? (
                        <FaArrowUp className="mr-1" />
                      ) : area.difference_percent < 0 ? (
                        <FaArrowDown className="mr-1" />
                      ) : null}
                      {formatPercent(area.difference_percent)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-slate-200">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {typeof entry.value === 'number' ? formatDollar(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render dynamic charts
  const renderDynamicCharts = () => {
    if (!dynamicCharts || dynamicCharts.length === 0) return null;
    
    return (
      <div className="space-y-6 mt-6">
        {dynamicCharts.map((chart, index) => (
          <div key={index} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2 flex items-center">
              {chart.type === 'line' && <FaChartLine className="mr-2 text-blue-600" />}
              {chart.type === 'bar' && <FaChartBar className="mr-2 text-blue-600" />}
              {chart.type === 'pie' && <FaChartPie className="mr-2 text-blue-600" />}
              {chart.type === 'area' && <MdOutlineShowChart className="mr-2 text-blue-600" />}
              {chart.type === 'composed' && <MdQueryStats className="mr-2 text-blue-600" />}
              {chart.type === 'radar' && <MdOutlineCompareArrows className="mr-2 text-blue-600" />}
              {chart.title}
            </h3>
            
            {chart.description && (
              <p className="text-sm text-slate-600 mb-3">{chart.description}</p>
            )}
            
            <div className="h-72 overflow-visible">
              {chart.type === 'line' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={chart.xAxis} />
                    <YAxis tickFormatter={chart.yAxisFormatter} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {chart.series.map((series: any, i: number) => (
                      <Line
                        key={i}
                        type="monotone"
                        dataKey={series.dataKey}
                        name={series.name}
                        stroke={series.color}
                        dot={{ stroke: series.color, strokeWidth: 2, r: 4, fill: 'white' }}
                        activeDot={{ stroke: series.color, strokeWidth: 2, r: 6, fill: series.color }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
              
              {chart.type === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={chart.xAxis} />
                    <YAxis tickFormatter={chart.yAxisFormatter} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {chart.series.map((series: any, i: number) => (
                      <Bar key={i} dataKey={series.dataKey} name={series.name} fill={series.color} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {chart.type === 'pie' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chart.data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey={chart.dataKey}
                      nameKey={chart.nameKey}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chart.data.map((entry: any, i: number) => (
                        <Cell key={`cell-${i}`} fill={chart.colors[i % chart.colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
              
              {chart.type === 'area' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={chart.xAxis} />
                    <YAxis tickFormatter={chart.yAxisFormatter} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {chart.series.map((series: any, i: number) => (
                      <Area
                        key={i}
                        type="monotone"
                        dataKey={series.dataKey}
                        name={series.name}
                        fill={`${series.color}40`}
                        stroke={series.color}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}
              
              {chart.type === 'composed' && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={chart.xAxis} />
                    <YAxis tickFormatter={chart.yAxisFormatter} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {chart.series.map((series: any, i: number) => {
                      if (series.type === 'line') {
                        return (
                          <Line
                            key={i}
                            type="monotone"
                            dataKey={series.dataKey}
                            name={series.name}
                            stroke={series.color}
                            dot={{ stroke: series.color, strokeWidth: 2, r: 4, fill: 'white' }}
                          />
                        );
                      } else if (series.type === 'bar') {
                        return (
                          <Bar
                            key={i}
                            dataKey={series.dataKey}
                            name={series.name}
                            fill={series.color}
                          />
                        );
                      } else if (series.type === 'area') {
                        return (
                          <Area
                            key={i}
                            type="monotone"
                            dataKey={series.dataKey}
                            name={series.name}
                            fill={`${series.color}40`}
                            stroke={series.color}
                          />
                        );
                      }
                      return null;
                    })}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
              
              {chart.type === 'radar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chart.data}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                    <Radar name="Market Health" dataKey="priceGrowth" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Affordability" dataKey="affordability" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Radar name="Inventory" dataKey="inventory" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                    <Radar name="Demand" dataKey="demandScore" stroke="#ff8042" fill="#ff8042" fillOpacity={0.6} />
                    <Radar name="Investment" dataKey="investmentPotential" stroke="#0088fe" fill="#0088fe" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
            
            {chart.insights && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-1">Key Insights:</h4>
                <ul className="text-sm text-slate-700">
                  {chart.insights.map((insight: string, i: number) => (
                    <li key={i} className="mt-1 flex items-start">
                      <FaAngleRight className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 bg-slate-50 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-slate-800 mb-4">Market Analysis</h2>
      
      {/* Success state - only show if we have completed analysis or have data */}
      {(loadingState.status === 'success' || dataAnalysisComplete || marketTrends) && (
        <>
          {/* Analysis Progress - only show if not complete */}
          {!dataAnalysisComplete && loadingState.status === 'loading' && (
            <div className="mb-4">
              {renderThoughtProcess()}
              {renderLoadingSkeleton()}
            </div>
          )}
          
          {/* Market Analysis Result */}
          {renderMarketAnalysisSection()}
          {renderForecastChart()}
          {renderNeighborhoodComparison()}
          {renderDynamicCharts()}
        </>
      )}
    </div>
  );
};

export default EnhancedMarketAnalysis;
  