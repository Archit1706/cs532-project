// components/Tabs/AIWorkflow/MarketAnalysis.tsx
import React, { useState, useEffect } from 'react';
import { Property, FeatureExtraction } from 'types/chat';
import ReactMarkdown from 'react-markdown';
import { 
  FaThermometerFull, 
  FaThermometerHalf, 
  FaThermometerEmpty, 
  FaFilePdf, 
  FaFileDownload, 
  FaSearch, 
  FaExclamationTriangle,
  FaInfoCircle,
  FaChartLine,
  FaHome,
  FaHistory,
  FaChartBar,
  FaBuilding
} from 'react-icons/fa';
import { BiTrendingUp, BiTrendingDown } from 'react-icons/bi';
import {
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine, 
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
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

const MarketAnalysis: React.FC<MarketAnalysisProps> = ({
  marketTrends,
  taxHistory,
  offMarketData,
  zipCode,
  features,
  selectedProperty,
  query,
  onExport
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tax-history' | 'off-market'>('overview');
  const [marketAnalysis, setMarketAnalysis] = useState<string | null>(null);
  const [analysisQuery, setAnalysisQuery] = useState<string>(query);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);

  // Get market analysis from LLM
// Improved getMarketAnalysisFromLLM function with better error handling
const getMarketAnalysisFromLLM = async (
    zipCode: string,
    cityName: string,
    marketData: any,
    userQuery: string
  ) => {
    console.log("Starting market analysis for query:", userQuery);
    setIsLoadingAnalysis(true);
    
    try {
      // Prepare context for the LLM
      const contextData = {
        zipCode,
        cityName,
        marketTemperature: marketData?.trends?.market_status?.temperature || 'N/A',
        medianPrice: marketData?.trends?.price_distribution?.median_price || 'N/A',
        yearlyChange: marketData?.trends?.summary_metrics?.yearly_change_percent || 'N/A',
        nearbyAreas: marketData?.trends?.nearby_areas?.map((area: any) => 
          `${area.name}: $${(area.median_rent || 0).toLocaleString()} (${(area.difference_percent || 0).toFixed(1)}%)`
        ).join(', ') || 'N/A',
        quarterlyTrends: marketData?.trends?.historical_trends?.quarterly_averages || []
      };
      
      // Create prompt for the LLM
      const prompt = `
        Analyze this market data and answer the following query about real estate in this area:
        "${userQuery}"
        
        Market data context:
        - ZIP code: ${contextData.zipCode}
        - City: ${cityName}
        - Market temperature: ${contextData.marketTemperature}
        - Median price: $${typeof contextData.medianPrice === 'number' ? contextData.medianPrice.toLocaleString() : contextData.medianPrice}
        - Year-over-year change: ${contextData.yearlyChange}%
        - Nearby areas comparison: ${contextData.nearbyAreas}
        
        IMPORTANT INSTRUCTIONS:
        1. Provide a concise analysis addressing the query directly.
        2. Use markdown formatting for better readability.
        3. DO NOT use literal HTML tags.
        4. When mentioning UI elements, use these exact link formats:
           - For properties section: [[properties]]
           - For market trends section: [[market trends]]
           - For local amenities section: [[restaurants]] or [[local amenities]]
           - For transit options section: [[transit]]
           - For property details: [[property details]]
           - For price history tab: [[price history]]
           - For schools tab: [[schools]]
           - For property market analysis: [[property market analysis]]
      `;
      
      console.log("Sending prompt to LLM:", prompt);
      
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
      console.log("Raw LLM response:", data.response);
      
      if (!data.response) {
        return "No response received from the analysis service.";
      }
      
      // Process the response for UI links
      const processedResponse = processUILinks(data.response);
      console.log("Processed response with links:", processedResponse);
      
      return processedResponse;
    } catch (error) {
      console.error('Error getting market analysis:', error);
      return `<p>Error generating market analysis: ${error instanceof Error ? error.message : 'Unknown error'}</p>`;
    } finally {
      setIsLoadingAnalysis(false);
    }
  };
const PROPERTY_TAB_IDS = {
    "DETAILS": "property-details-tab",
    "PRICE_HISTORY": "property-price-history-tab",
    "SCHOOLS": "property-schools-tab",
    "MARKET_ANALYSIS": "property-market-analysis-tab"
}

  // Process UI section links in LLM responses
// Replace the processUILinks function with this improved version
// Improved processUILinks function with debugging
// Enhanced processUILinks function that properly handles the markdown
// Enhanced processUILinks function with better HTML tag handling and debugging
const processUILinks = (text: string) => {
    console.log("Processing UI links in text:", text.substring(0, 100) + "...");
    
    if (!text) {
      console.warn("Empty text passed to processUILinks");
      return "";
    }
    
    // First pass: Convert markdown to HTML
    let processedText = text
      // Process headers
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      // Process bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Process lists
      .replace(/^\- (.*?)$/gm, '<li>$1</li>')
      .replace(/<li>(.*?)<\/li>(?:\r?\n<li>.*?<\/li>)+/g, '<ul>$&</ul>')
      // Process paragraphs
      .replace(/^([^<\s][^<]*?)$/gm, '<p>$1</p>')
      // Fix double paragraphs
      .replace(/<\/p>\s*<p>/g, '</p><p>');
    
    console.log("After markdown conversion:", processedText.substring(0, 100) + "...");
    
    // Define patterns to detect UI link mentions
    const linkPatterns = [
      {
        regex: /\[\[market(?:\s+trends)?\]\]/gi,
        id: SECTION_IDS.MARKET,
        label: 'market trends',
        linkType: 'market'
      },
      {
        regex: /\[\[properties\]\]/gi,
        id: SECTION_IDS.PROPERTIES,
        label: 'properties',
        linkType: 'property'
      },
      {
        regex: /\[\[restaurants\]\]|\[\[local\s+amenities\]\]/gi,
        id: SECTION_IDS.AMENITIES,
        label: 'local amenities',
        linkType: 'restaurants'
      },
      {
        regex: /\[\[transit\]\]/gi,
        id: SECTION_IDS.TRANSIT,
        label: 'transit options',
        linkType: 'transit'
      },
      {
        regex: /\[\[property\s+market\]\]/gi,
        replacement: '<a href="#" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="propertyMarket">property market analysis</a>'
      },
      {
        regex: /\[\[property\s+details\]\]/gi,
        id: PROPERTY_TAB_IDS.DETAILS,
        label: 'property details',
        linkType: 'propertyDetails'
      },
      {
        regex: /\[\[price\s+history\]\]/gi,
        id: PROPERTY_TAB_IDS.PRICE_HISTORY,
        label: 'price history',
        linkType: 'propertyPriceHistory'
      },
      {
        regex: /\[\[property\s+schools\]\]|\[\[schools\]\]/gi,
        id: PROPERTY_TAB_IDS.SCHOOLS,
        label: 'schools',
        linkType: 'propertySchools'
      },
      {
        regex: /\[\[property\s+market(?:\s+analysis)?\]\]|\[\[market\s+analysis\]\]/gi,
        id: PROPERTY_TAB_IDS.MARKET_ANALYSIS,
        label: 'market analysis',
        linkType: 'propertyMarketAnalysis'
      }
    ];
    
    // Process each pattern
    linkPatterns.forEach(pattern => {
      const matches = processedText.match(pattern.regex);
      if (matches) {
        console.log(`Found ${matches.length} instances of pattern:`, pattern.regex);
      }
      
      processedText = processedText.replace(pattern.regex, (match) => {
        // Handle property tab links differently than section links
        if (pattern.linkType && pattern.id) {
          return `<a href="#${pattern.id}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="${pattern.linkType}">${pattern.label}</a>`;
        } else if (pattern.id) {
          return `<a href="#${pattern.id}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="${pattern.linkType}">${pattern.label}</a>`;
        } else {
          // For patterns with direct replacement
          return pattern.replacement || match;
        }
      });
    });
    
    // Log remnant unprocessed links
    const remainingLinks = processedText.match(/\[\[.*?\]\]/g);
    if (remainingLinks && remainingLinks.length > 0) {
      console.warn("Unprocessed links remaining:", remainingLinks);
    }
    
    console.log("Final processed text:", processedText.substring(0, 100) + "...");
    
    return processedText;
  };

  // Generate market analysis when component mounts
  useEffect(() => {
    if (marketTrends?.trends) {
      const cityName = marketTrends.location?.split(',')[0] || 'this area';
      getMarketAnalysisFromLLM(zipCode, cityName, marketTrends, query)
        .then(analysis => setMarketAnalysis(analysis));
    }
  }, [marketTrends, zipCode, query]);

  // Format dollar amounts
  const formatDollar = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'N/A';
    return `$${amount.toLocaleString()}`;
  };

  // Format percentage
  const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Get color based on value (green for positive, red for negative)
  const getChangeColor = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '#6B7280'; // Gray
    return value >= 0 ? '#10B981' : '#EF4444'; // Green : Red
  };

  // Get temperature color for market status
  const getTemperatureColor = (temperature: string) => {
    if (!temperature) return '#6B7280'; // Default gray
    if (temperature.toLowerCase().includes('hot')) return '#EF4444'; // Red
    if (temperature.toLowerCase().includes('warm')) return '#F97316'; // Orange
    if (temperature.toLowerCase().includes('neutral')) return '#A855F7'; // Purple
    if (temperature.toLowerCase().includes('cool')) return '#3B82F6'; // Blue
    if (temperature.toLowerCase().includes('cold')) return '#06B6D4'; // Cyan
    return '#6B7280'; // Default gray
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

  // Render market analysis section with markdown
// Render market analysis section with markdown
// Fixed renderMarketAnalysisSection function for MarketAnalysis.tsx
const renderMarketAnalysisSection = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Market Analysis</h3>
      
      <div className="mb-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          {isLoadingAnalysis ? (
            <div className="flex items-center justify-center py-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          ) : marketAnalysis ? (
            // Important: Use dangerouslySetInnerHTML to render the processed content
            <div 
              className="prose prose-sm max-w-none text-slate-800"
              dangerouslySetInnerHTML={{ __html: marketAnalysis }}
            />
          ) : (
            <p>Loading analysis...</p>
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
              const cityName = marketTrends.location?.split(',')[0] || 'this area';
              getMarketAnalysisFromLLM(zipCode, cityName, marketTrends, analysisQuery)
                .then(analysis => setMarketAnalysis(analysis));
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={isLoadingAnalysis}
          >
            Analyze
          </button>
        </div>
      </div>
    </div>
  );

  // Render loading state if data is not available
  if (!marketTrends) {
    return (
      <div className="flex justify-center p-8">
        <div className="flex flex-col items-center space-y-3">
          <FaExclamationTriangle className="text-amber-500 text-4xl mb-2" />
          <div className="text-slate-700 font-medium">Market data not available</div>
          <p className="text-slate-600 text-center max-w-md">
            We couldn't find market data for this area. Please try a different ZIP code or ask another question.
          </p>
        </div>
      </div>
    );
  }

  // Get various data for charts
  const priceMetrics = marketTrends?.trends?.price_distribution;
  const summary = marketTrends?.trends?.summary_metrics;
  const national = marketTrends?.trends?.national_comparison;
  const marketStatus = marketTrends?.trends?.market_status;
  const nearbyAreas = marketTrends?.trends?.nearby_areas || [];
  const historical = marketTrends?.trends?.historical_trends;

  // Historical trends chart data
  const combinedHistoricalData = (() => {
    if (!historical?.previous_year && !historical?.current_year) return [];

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const previous = (historical.previous_year || []).reduce((acc: any, item: any) => {
      acc[item.month] = { month: item.month, "Previous Year": item.price };
      return acc;
    }, {});

    const current = (historical.current_year || []).reduce((acc: any, item: any) => {
      if (!acc[item.month]) acc[item.month] = { month: item.month };
      acc[item.month]["Current Year"] = item.price;
      return acc;
    }, previous);

    return months.map(month => current[month] || { month });
  })();

  // Price distribution data for pie chart
  const getPriceDistributionData = () => {
    if (!priceMetrics || !priceMetrics.histogram) return [];
    
    const { histogram } = priceMetrics;
    
    if (!histogram || !histogram.priceAndCount) return [];
    
    // Group prices into reasonable buckets
    const buckets: { [key: string]: number } = {};
    
    histogram.priceAndCount.forEach((item: any) => {
      const price = item.price;
      const count = item.count;
      
      // Create price range buckets
      let bucket = '';
      if (price < 1000) bucket = 'Under $1k';
      else if (price < 2000) bucket = '$1k-$2k';
      else if (price < 3000) bucket = '$2k-$3k';
      else if (price < 4000) bucket = '$3k-$4k';
      else if (price < 5000) bucket = '$4k-$5k';
      else bucket = 'Over $5k';
      
      buckets[bucket] = (buckets[bucket] || 0) + count;
    });
    
    // Convert to chart data format
    return Object.entries(buckets).map(([range, count]) => ({
      range,
      count
    }));
  };

  // Get chart data
  const priceDistributionData = getPriceDistributionData();
  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'];

  return (
    <div className="p-6 bg-gradient-to-b from-emerald-50 to-white rounded-xl shadow-sm animate-fadeIn">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <FaChartLine className="text-emerald-600 mr-3 text-xl" />
            <h2 className="text-xl font-semibold text-slate-800">Market Analysis</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onExport('json')}
              title="Export as JSON"
              className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors"
            >
              <FaFileDownload />
            </button>
            <button
              onClick={() => onExport('pdf')}
              title="Export as PDF"
              className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              <FaFilePdf />
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
          <p className="text-slate-800 mb-1">
            <span className="font-semibold">Query:</span> "{query}"
          </p>
          <p className="text-slate-800 mb-1 flex items-center">
            <FaSearch className="mr-1 text-emerald-600" />
            <span className="font-semibold">Location:</span> {marketTrends.location || zipCode}
          </p>
          {selectedProperty && (
            <p className="text-slate-800 flex items-center">
              <FaHome className="mr-1 text-emerald-600" />
              <span className="font-semibold">Selected Property:</span> {selectedProperty.address}
            </p>
          )}
        </div>
      </div>

      {/* Render Market Analysis LLM Section */}
      {renderMarketAnalysisSection()}

      {/* Tab navigation */}
      <div className="mb-6">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium text-slate-800 ${
              activeTab === 'overview' 
                ? 'text-emerald-600 border-b-2 border-emerald-600' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FaChartBar className="inline-block mr-1" /> Market Overview
          </button>
          {taxHistory && (
            <button
              onClick={() => setActiveTab('tax-history')}
              className={`px-4 py-2 font-medium text-slate-800 ${
                activeTab === 'tax-history' 
                  ? 'text-emerald-600 border-b-2 border-emerald-600' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <FaHistory className="inline-block mr-1" /> Tax History
            </button>
          )}
          {offMarketData && (
            <button
              onClick={() => setActiveTab('off-market')}
              className={`px-4 py-2 font-medium text-slate-800 ${
                activeTab === 'off-market' 
                  ? 'text-emerald-600 border-b-2 border-emerald-600' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <FaBuilding className="inline-block mr-1" /> Off-Market Data
            </button>
          )}
        </div>
      </div>
      
      {/* Tab content */}
      <div>
        {/* Market Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Market summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-slate-800 font-medium mb-2">Median Price</h3>
                <div className="text-2xl font-bold text-slate-800">
                  {formatDollar(priceMetrics?.median_price)}
                </div>
                <div className="flex items-center text-sm mt-1">
                  <span 
                    style={{ 
                      color: getChangeColor(summary?.yearly_change_percent) 
                    }}
                    className="font-medium flex items-center"
                  >
                    {formatPercent(summary?.yearly_change_percent)} year over year
                  </span>
                </div>
              </div>
              
              <div 
                className="bg-white p-4 rounded-lg border shadow-sm"
                style={{ 
                  borderColor: getTemperatureColor(marketStatus?.temperature),
                }}
              >
                <h3 className="text-slate-800 font-medium mb-2">Market Temperature</h3>
                <div 
                  className="text-2xl font-bold" 
                  style={{ color: getTemperatureColor(marketStatus?.temperature) }}
                >
                  {marketStatus?.temperature || 'N/A'}
                </div>
                <div className="text-sm text-slate-800 mt-1">
                  {marketStatus?.interpretation || 'Market temperature indicates the balance between buyers and sellers.'}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-slate-800 font-medium mb-2">Compared to National</h3>
                <div className="text-2xl font-bold text-slate-800">
                  {national?.is_above_national ? 'Above Average' : 'Below Average'}
                </div>
                <div className="flex items-center text-sm mt-1">
                  <span 
                    style={{ 
                      color: getChangeColor(national?.difference_percent) 
                    }}
                    className="font-medium"
                  >
                    {formatPercent(national?.difference_percent)} difference from national median
                  </span>
                </div>
              </div>
            </div>
            
            {/* Historical Trends Chart */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-slate-800 font-medium mb-4">Historical Rental Trends</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedHistoricalData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="Previous Year"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ stroke: '#3B82F6', strokeWidth: 2, r: 4, fill: 'white' }}
                      activeDot={{ stroke: '#3B82F6', strokeWidth: 2, r: 6, fill: '#3B82F6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Current Year"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ stroke: '#10B981', strokeWidth: 2, r: 4, fill: 'white' }}
                      activeDot={{ stroke: '#10B981', strokeWidth: 2, r: 6, fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Price Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-slate-800 font-medium mb-4">Price Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priceDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="range"
                      >
                        {priceDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} listings`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Nearby Areas Comparison */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-slate-800 font-medium mb-4">Nearby Areas</h3>
                <div className="h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-medium text-slate-800">Area</th>
                        <th className="px-3 py-2 text-right text-sm font-medium text-slate-800">Median Price</th>
                        <th className="px-3 py-2 text-right text-sm font-medium text-slate-800">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {nearbyAreas.map((area: any, index: number) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-sm text-slate-800">{area.name}</td>
                          <td className="px-3 py-2 text-sm text-slate-800 text-right">{formatDollar(area.median_rent)}</td>
                          <td className="px-3 py-2 text-sm text-right">
                            <span style={{ color: getChangeColor(area.difference_percent) }}>
                              {formatPercent(area.difference_percent)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Tax History */}
        {activeTab === 'tax-history' && (
          <div className="space-y-6">
            {selectedProperty ? (
              <>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-slate-800 font-medium mb-4">Property Tax History</h3>
                  {taxHistory && taxHistory.priceHistory && taxHistory.priceHistory.length > 0 ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={
                            taxHistory.priceHistory
                              .filter((item: any) => item.event === 'Tax assessment')
                              .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime())
                              .map((item: any) => ({
                                date: new Date(item.time).getFullYear(),
                                value: item.price
                              }))
                          }
                          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                          />
                          <YAxis
                            domain={['auto', 'auto']}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `${(value/1000)}k`}
                            label={{ value: 'Assessment Value', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" fill="#10B981" name="Assessment Value" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <FaInfoCircle className="text-blue-500 text-2xl mb-2 mx-auto" />
                      <p className="text-slate-800">
                        No tax history data available for this property
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-slate-800 font-medium mb-4">Tax History Details</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-slate-800">Date</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-slate-800">Tax Amount</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-slate-800">Assessed Value</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-slate-800">Tax Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {taxHistory?.priceHistory
                          ?.filter((item: any) => item.event === 'Tax assessment')
                          .map((item: any, index: number) => {
                            const date = new Date(item.time).toLocaleDateString();
                            const taxAmount = item.taxPaid || 'N/A';
                            const assessedValue = item.price || 'N/A';
                            const taxRate = taxAmount && assessedValue ? 
                              ((taxAmount / assessedValue) * 100).toFixed(2) + '%' : 'N/A';
                            
                            return (
                              <tr key={index} className="hover:bg-slate-50">
                                <td className="px-4 py-2 text-sm text-slate-800">{date}</td>
                                <td className="px-4 py-2 text-sm text-slate-800 text-right">{formatDollar(taxAmount)}</td>
                                <td className="px-4 py-2 text-sm text-slate-800 text-right">{formatDollar(assessedValue)}</td>
                                <td className="px-4 py-2 text-sm text-slate-800 text-right">{taxRate}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm text-center">
                <FaInfoCircle className="text-blue-500 text-4xl mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Select a property first</h3>
                <p className="text-slate-800 mb-4">
                  Please select a property to view its tax history information.
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Off-Market Data */}
        {activeTab === 'off-market' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-slate-800 font-medium mb-4">Off-Market Properties in {zipCode}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-800">Address</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-slate-800">Price</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-slate-800">Beds/Baths</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-slate-800">Sq Ft</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-slate-800">Type</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-slate-800">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {offMarketData && offMarketData.data && offMarketData.data.length > 0 ? (
                      offMarketData.data.slice(0, 10).map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-4 py-2 text-sm text-slate-800">{item.streetAddress}{item.unit ? ` ${item.unit}` : ''}</td>
                          <td className="px-4 py-2 text-sm text-slate-800 text-right">{formatDollar(item.price)}</td>
                          <td className="px-4 py-2 text-sm text-slate-800 text-center">{item.bedrooms}/{item.bathrooms}</td>
                          <td className="px-4 py-2 text-sm text-slate-800 text-right">
                            {item.livingArea ? item.livingArea.toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-800 text-center">{item.homeType}</td>
                          <td className="px-4 py-2 text-sm text-slate-800 text-center">
                            {new Date(item.timeOnZillow).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-slate-800">
                          <FaInfoCircle className="inline-block mr-2 text-blue-500" />
                          No off-market data available for this area
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketAnalysis;