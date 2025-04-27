// components/Tabs/AIWorkflow/MarketAnalysis.tsx
"use client";

import React, { useState } from 'react';
import { Property, FeatureExtraction } from 'types/chat';
import { 
  FaFileDownload, 
  FaFilePdf, 
  FaChartLine, 
  FaChartBar, 
  FaChartPie, 
  FaMoneyBillWave, 
  FaHome, 
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
  FaHistory,
  FaBuilding,
  FaBook,
  FaCalendarAlt
} from 'react-icons/fa';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

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

  // Generate chart data for tax history
  const generateTaxHistoryChartData = () => {
    if (!taxHistory || !taxHistory.priceHistory) return [];

    return taxHistory.priceHistory
      .filter((item: any) => item.event === 'Tax assessment')
      .map((item: any) => ({
        date: new Date(item.time).getFullYear(),
        value: item.price,
      }))
      .sort((a: any, b: any) => a.date - b.date);
  };

  // Extract chart data from market trends
  const getHistoricalTrendsData = () => {
    if (!marketTrends || !marketTrends.trends || !marketTrends.trends.historical_trends) return [];
    
    const { current_year, previous_year } = marketTrends.trends.historical_trends;
    
    if (!current_year || !previous_year) return [];
    
    // Combine current and previous year data
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    const combinedData = monthNames.map(month => {
      const currentYearData = current_year.find((item: any) => item.month === month);
      const previousYearData = previous_year.find((item: any) => item.month === month);
      
      return {
        month,
        "Current Year": currentYearData ? currentYearData.price : null,
        "Previous Year": previousYearData ? previousYearData.price : null
      };
    });
    
    return combinedData;
  };

  // Get distribution data for pie chart
  const getPriceDistributionData = () => {
    if (!marketTrends || !marketTrends.trends || !marketTrends.trends.price_distribution) return [];
    
    const { histogram } = marketTrends.trends.price_distribution;
    
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

  // Format off-market data
  const formatOffMarketData = () => {
    if (!offMarketData || !offMarketData.data) return [];
    
    // Take just the first 10 items for display
    return offMarketData.data.slice(0, 10).map((item: any) => ({
      address: item.streetAddress + (item.unit ? ` ${item.unit}` : ''),
      price: item.price,
      beds: item.bedrooms,
      baths: item.bathrooms,
      sqft: item.livingArea,
      type: item.homeType,
      lastSold: new Date(item.timeOnZillow).toLocaleDateString(),
      zipcode: item.zipcode
    }));
  };

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

  const taxHistoryData = generateTaxHistoryChartData();
  const historicalTrendsData = getHistoricalTrendsData();
  const priceDistributionData = getPriceDistributionData();
  const offMarketItems = formatOffMarketData();
  
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
          <p className="text-slate-700 mb-1">
            <span className="font-semibold">Query:</span> "{query}"
          </p>
          <p className="text-slate-700 mb-1 flex items-center">
            <FaMapMarkerAlt className="mr-1 text-emerald-600" />
            <span className="font-semibold">Location:</span> {marketTrends.location || zipCode}
          </p>
          {selectedProperty && (
            <p className="text-slate-700 flex items-center">
              <FaHome className="mr-1 text-emerald-600" />
              <span className="font-semibold">Selected Property:</span> {selectedProperty.address}
            </p>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="mb-6">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium ${
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
              className={`px-4 py-2 font-medium ${
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
              className={`px-4 py-2 font-medium ${
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
                <h3 className="text-slate-700 font-medium mb-2">Median Price</h3>
                <div className="text-2xl font-bold text-slate-800">
                  {formatDollar(marketTrends.trends?.price_distribution?.median_price)}
                </div>
                <div className="flex items-center text-sm mt-1">
                  <span 
                    style={{ 
                      color: getChangeColor(marketTrends.trends?.summary_metrics?.yearly_change_percent) 
                    }}
                    className="font-medium flex items-center"
                  >
                    {formatPercent(marketTrends.trends?.summary_metrics?.yearly_change_percent)} year over year
                  </span>
                </div>
              </div>
              
              <div 
                className="bg-white p-4 rounded-lg border shadow-sm"
                style={{ 
                  borderColor: getTemperatureColor(marketTrends.trends?.market_status?.temperature),
                }}
              >
                <h3 className="text-slate-700 font-medium mb-2">Market Temperature</h3>
                <div 
                  className="text-2xl font-bold" 
                  style={{ color: getTemperatureColor(marketTrends.trends?.market_status?.temperature) }}
                >
                  {marketTrends.trends?.market_status?.temperature || 'N/A'}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  {marketTrends.trends?.market_status?.interpretation || 'Market temperature indicates the balance between buyers and sellers.'}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-slate-700 font-medium mb-2">Compared to National</h3>
                <div className="text-2xl font-bold text-slate-800">
                  {marketTrends.trends?.national_comparison?.is_above_national ? 'Above Average' : 'Below Average'}
                </div>
                <div className="flex items-center text-sm mt-1">
                  <span 
                    style={{ 
                      color: getChangeColor(marketTrends.trends?.national_comparison?.difference_percent) 
                    }}
                    className="font-medium"
                  >
                    {formatPercent(marketTrends.trends?.national_comparison?.difference_percent)} difference from national median
                  </span>
                </div>
              </div>
            </div>
            
            {/* Historical Trends Chart */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-slate-700 font-medium mb-4">Historical Rental Trends</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalTrendsData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
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
                <h3 className="text-slate-700 font-medium mb-4">Price Distribution</h3>
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
                <h3 className="text-slate-700 font-medium mb-4">Nearby Areas</h3>
                <div className="h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-medium text-slate-600">Area</th>
                        <th className="px-3 py-2 text-right text-sm font-medium text-slate-600">Median Price</th>
                        <th className="px-3 py-2 text-right text-sm font-medium text-slate-600">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {marketTrends.trends?.nearby_areas?.map((area: any, index: number) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-sm text-slate-700">{area.name}</td>
                          <td className="px-3 py-2 text-sm text-slate-700 text-right">{formatDollar(area.median_rent)}</td>
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
                  <h3 className="text-slate-700 font-medium mb-4">Property Tax History</h3>
                  {taxHistoryData.length > 0 ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={taxHistoryData}
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
                            tickFormatter={(value) => `$${(value/1000)}k`}
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
                      <p className="text-slate-600">
                        No tax history data available for this property
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-slate-700 font-medium mb-4">Tax History Details</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">Date</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-slate-600">Tax Amount</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-slate-600">Assessed Value</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-slate-600">Tax Rate</th>
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
                                <td className="px-4 py-2 text-sm text-slate-700">{date}</td>
                                <td className="px-4 py-2 text-sm text-slate-700 text-right">{formatDollar(taxAmount)}</td>
                                <td className="px-4 py-2 text-sm text-slate-700 text-right">{formatDollar(assessedValue)}</td>
                                <td className="px-4 py-2 text-sm text-slate-700 text-right">{taxRate}</td>
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
                <p className="text-slate-600 mb-4">
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
              <h3 className="text-slate-700 font-medium mb-4">Off-Market Properties in {zipCode}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">Address</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-slate-600">Price</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-slate-600">Beds/Baths</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-slate-600">Sq Ft</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-slate-600">Type</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-slate-600">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {offMarketItems.length > 0 ? (
                      offMarketItems.map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-4 py-2 text-sm text-slate-700">{item.address}</td>
                          <td className="px-4 py-2 text-sm text-slate-700 text-right">{formatDollar(item.price)}</td>
                          <td className="px-4 py-2 text-sm text-slate-700 text-center">{item.beds}/{item.baths}</td>
                          <td className="px-4 py-2 text-sm text-slate-700 text-right">{item.sqft ? item.sqft.toLocaleString() : 'N/A'}</td>
                          <td className="px-4 py-2 text-sm text-slate-700 text-center">{item.type}</td>
                          <td className="px-4 py-2 text-sm text-slate-700 text-center">{item.lastSold}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-slate-600">
                          <FaInfoCircle className="inline-block mr-2 text-blue-500" />
                          No off-market data available for this area
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-slate-700 font-medium mb-4">Off-Market Property Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-slate-600 text-sm mb-1">Average Price</h4>
                  <div className="text-xl font-bold text-slate-800">
                    {formatDollar(
                      offMarketItems.length > 0
                        ? offMarketItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0) / 
                          offMarketItems.length
                        : 0
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-slate-600 text-sm mb-1">Average Square Footage</h4>
                  <div className="text-xl font-bold text-slate-800">
                    {offMarketItems.length > 0
                      ? Math.round(
                          offMarketItems.reduce(
                            (sum: number, item: any) => sum + (item.sqft || 0), 
                            0
                          ) / offMarketItems.filter((item: any) => item.sqft).length
                        ).toLocaleString()
                      : 'N/A'} sq ft
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-slate-600 text-sm mb-1">Property Count</h4>
                  <div className="text-xl font-bold text-slate-800">
                    {offMarketItems.length} properties
                  </div>
                </div>
              </div>
              
              {offMarketItems.length > 0 && (
                <div className="mt-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        offMarketItems.reduce((acc: any[], item: any) => {
                          const type = item.type || 'Unknown';
                          const existing = acc.find(x => x.type === type);
                          if (existing) {
                            existing.count += 1;
                          } else {
                            acc.push({ type, count: 1 });
                          }
                          return acc;
                        }, [])
                      }
                      margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
                      <XAxis 
                        dataKey="type" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end" 
                        interval={0}
                        height={50}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Number of Properties', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip />
                      <Bar dataKey="count" name="Number of Properties" fill="#8884d8">
                        {offMarketItems.reduce((acc: any[], item: any) => {
                            const type = item.type || 'Unknown';
                            const existing = acc.find(x => x.type === type);
                            if (existing) {
                              existing.count += 1;
                            } else {
                              acc.push({ type, count: 1 });
                            }
                            return acc;
                          }, []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketAnalysis;