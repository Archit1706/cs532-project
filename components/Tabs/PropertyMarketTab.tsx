// components/Tabs/PropertyMarketTab.tsx with improved table styling and chart labels
"use client";

import React, { useState, useEffect } from 'react';
import { useChatContext } from 'context/ChatContext';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, ReferenceLine, BarChart, Bar
} from 'recharts';
import { BiTrendingUp, BiTrendingDown } from 'react-icons/bi';
import { FaThermometerFull, FaThermometerHalf, FaThermometerEmpty } from 'react-icons/fa';
import { MdCompareArrows } from 'react-icons/md';

const PropertyMarketTab = () => {
    const { 
        selectedProperty, 
        propertyDetails, 
        zipCode, 
        marketTrends, 
        isLoadingMarketTrends 
    } = useChatContext();
    
    const [propertyMarketData, setPropertyMarketData] = useState<any>(null);
    const [comparisonData, setComparisonData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Get relevant data from market trends
    useEffect(() => {
        if (selectedProperty && marketTrends) {
            setIsLoading(true);
            
            // Extract relevant data for this property
            const relevantData = {
                propertyInfo: {
                    address: selectedProperty.address,
                    price: selectedProperty.price,
                    beds: selectedProperty.beds,
                    baths: selectedProperty.baths,
                    sqft: selectedProperty.sqft,
                    type: selectedProperty.type,
                    yearBuilt: propertyDetails?.basic_info?.yearBuilt,
                    zpid: selectedProperty.zpid
                },
                marketAnalysis: {
                    medianPrice: marketTrends.trends?.price_distribution?.median_price || 0,
                    pricePerSqFt: selectedProperty.price / selectedProperty.sqft,
                    averagePricePerSqFt: (marketTrends.trends?.price_distribution?.median_price || 0) / 
                                         (marketTrends.trends?.summary_metrics?.averageSqFt || 1000),
                    daysOnMarket: propertyDetails?.basic_info?.daysOnZillow || 0,
                    averageDaysOnMarket: marketTrends.trends?.summary_metrics?.averageDaysOnMarket || 30,
                    marketTemperature: marketTrends.trends?.market_status?.temperature || "NEUTRAL",
                    marketTrend: marketTrends.trends?.summary_metrics?.yearly_change_percent || 0,
                    nearbyComparisons: marketTrends.trends?.nearby_areas || []
                },
                historicalTrends: marketTrends.trends?.historical_trends
            };
            
            // Calculate comparison metrics
            const comparisons = {
                priceComparison: {
                    value: selectedProperty.price,
                    benchmark: marketTrends.trends?.price_distribution?.median_price || 0,
                    difference: selectedProperty.price - (marketTrends.trends?.price_distribution?.median_price || 0),
                    percentDifference: ((selectedProperty.price / (marketTrends.trends?.price_distribution?.median_price || 1)) - 1) * 100
                },
                pricePerSqFtComparison: {
                    value: selectedProperty.price / selectedProperty.sqft,
                    benchmark: (marketTrends.trends?.price_distribution?.median_price || 0) / 
                              (marketTrends.trends?.summary_metrics?.averageSqFt || 1000),
                    difference: (selectedProperty.price / selectedProperty.sqft) - 
                               ((marketTrends.trends?.price_distribution?.median_price || 0) / 
                               (marketTrends.trends?.summary_metrics?.averageSqFt || 1000)),
                    percentDifference: (((selectedProperty.price / selectedProperty.sqft) / 
                                       ((marketTrends.trends?.price_distribution?.median_price || 0) / 
                                       (marketTrends.trends?.summary_metrics?.averageSqFt || 1000))) - 1) * 100
                }
            };
            
            // Similar properties data with improved formatting
            const similarProperties = propertyDetails?.nearbyHomes?.map((home: { address: { streetAddress: any; }; price: number; bedrooms: any; bathrooms: any; livingArea: number; yearBuilt: any; distance: any; hoaFee?: number; }) => {
                // Calculate price per square foot
                const pricePerSqFt = home.livingArea > 0 ? home.price / home.livingArea : 0;
                
                return {
                    address: home.address?.streetAddress || 'N/A',
                    price: home.price || 0,
                    beds: home.bedrooms || 0,
                    baths: home.bathrooms || 0,
                    sqft: home.livingArea || 0,
                    pricePerSqFt: pricePerSqFt,
                    yearBuilt: home.yearBuilt || 'N/A',
                    distance: home.distance || 0,
                    hoaFee: home.hoaFee || 0
                };
            }) || [];
            
            // Price history data for the property
            const priceHistory = propertyDetails?.priceHistory?.map((item: { date: any; price: any; event: any; }) => ({
                date: item.date,
                price: item.price,
                event: item.event
            })) || [];
            
            // Set the complete property market data
            setPropertyMarketData({
                ...relevantData,
                similarProperties,
                priceHistory
            });
            
            setComparisonData(comparisons);
            setIsLoading(false);
        }
    }, [selectedProperty, marketTrends, propertyDetails, zipCode]);

    // Helper function for temperature color gradient 
    const getTemperatureColor = (temperature: string) => {
        if (!temperature) return "#6B7280"; // Default gray

        if (temperature.toLowerCase().includes('hot')) return "#EF4444"; // Red
        if (temperature.toLowerCase().includes('warm')) return "#F97316"; // Orange
        if (temperature.toLowerCase().includes('neutral')) return "#A855F7"; // Purple
        if (temperature.toLowerCase().includes('cool')) return "#3B82F6"; // Blue
        if (temperature.toLowerCase().includes('cold')) return "#06B6D4"; // Cyan

        return "#6B7280"; // Default gray
    };

    // Helper for value change color
    const getChangeColor = (changeValue: number) => {
        if (isNaN(changeValue)) return "#6B7280"; // Default gray
        return changeValue >= 0 ? "#10B981" : "#EF4444";
    };

    // Format dollar amounts
    const formatDollar = (amount: number) => {
        if (!amount && amount !== 0) return 'N/A';
        return '$' + amount.toLocaleString();
    };

    // Custom Tooltip for charts - improved contrast and readability
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 shadow-lg rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-800">{label}</p>
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

    if (isLoading || isLoadingMarketTrends) {
        return (
            <div className="flex justify-center p-8">
                <div className="flex flex-col items-center space-y-3">
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-3 h-3 bg-teal-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <div className="text-teal-600 font-medium">Loading property market data...</div>
                </div>
            </div>
        );
    }

    if (!propertyMarketData || !marketTrends) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-4 text-slate-600 font-medium">Property market data not available</p>
                <p className="text-slate-500">Select a property to see market analysis</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 overflow-y-auto max-h-[85vh] p-4 animate-fadeIn bg-gradient-to-b from-blue-50 to-white">
            <div className="bg-blue-700 text-white p-4 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-1">Property Market Analysis</h2>
                <p className="text-blue-100 text-sm">
                    Market analysis for {selectedProperty.address} in ZIP {zipCode}
                </p>
            </div>

            {/* Value Comparison */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">
                    Property Value Assessment
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg shadow-sm relative overflow-hidden ${
                        comparisonData.priceComparison.percentDifference > 0 ? 'bg-red-50' : 'bg-green-50'
                    }`}>
                        <div className="text-sm text-slate-500 mb-1">Property Price</div>
                        <div className="text-2xl font-bold text-slate-800">
                            {formatDollar(comparisonData.priceComparison.value)}
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="mr-1">vs. Area Median:</span>
                            <span className="font-medium" style={{ 
                                color: getChangeColor(comparisonData.priceComparison.percentDifference) 
                            }}>
                                {comparisonData.priceComparison.percentDifference > 0 ? '+' : ''}
                                {comparisonData.priceComparison.percentDifference.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg shadow-sm relative overflow-hidden ${
                        comparisonData.pricePerSqFtComparison.percentDifference > 0 ? 'bg-red-50' : 'bg-green-50'
                    }`}>
                        <div className="text-sm text-slate-500 mb-1">Price Per Sq Ft</div>
                        <div className="text-2xl font-bold text-slate-800">
                            {formatDollar(comparisonData.pricePerSqFtComparison.value)}
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="mr-1">vs. Area Average:</span>
                            <span className="font-medium" style={{ 
                                color: getChangeColor(comparisonData.pricePerSqFtComparison.percentDifference) 
                            }}>
                                {comparisonData.pricePerSqFtComparison.percentDifference > 0 ? '+' : ''}
                                {comparisonData.pricePerSqFtComparison.percentDifference.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center mb-2">
                        <MdCompareArrows className="mr-2 text-slate-600" size={20} />
                        <span className="font-medium text-slate-700">Value Assessment</span>
                    </div>
                    <p className="text-slate-600 text-sm">
                        This {selectedProperty.type} is priced 
                        <span className="font-medium" style={{ 
                            color: getChangeColor(comparisonData.priceComparison.percentDifference) 
                        }}> {Math.abs(comparisonData.priceComparison.percentDifference).toFixed(1)}% 
                        {comparisonData.priceComparison.percentDifference > 0 ? ' above ' : ' below '}</span> 
                        the area's median home price and costs
                        <span className="font-medium" style={{ 
                            color: getChangeColor(comparisonData.pricePerSqFtComparison.percentDifference) 
                        }}> {Math.abs(comparisonData.pricePerSqFtComparison.percentDifference).toFixed(1)}% 
                        {comparisonData.pricePerSqFtComparison.percentDifference > 0 ? ' more ' : ' less '}</span>
                        per square foot than similar properties.
                    </p>
                </div>
            </div>

            {/* Market Heat */}
            <div 
                className="rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                style={{
                    borderColor: getTemperatureColor(propertyMarketData.marketAnalysis.marketTemperature),
                    background: `linear-gradient(to right, ${getTemperatureColor(propertyMarketData.marketAnalysis.marketTemperature)}15, white)`
                }}
            >
                <div className="flex items-start">
                    <div className="mr-4">
                        {propertyMarketData.marketAnalysis.marketTemperature.toLowerCase().includes('hot') ? (
                            <FaThermometerFull size={24} className="text-red-500" />
                        ) : propertyMarketData.marketAnalysis.marketTemperature.toLowerCase().includes('warm') ? (
                            <FaThermometerHalf size={24} className="text-orange-500" />
                        ) : (
                            <FaThermometerEmpty size={24} className="text-blue-500" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Current Market Status</h3>
                        <div 
                            className="font-medium mb-1" 
                            style={{ color: getTemperatureColor(propertyMarketData.marketAnalysis.marketTemperature) }}
                        >
                            {propertyMarketData.marketAnalysis.marketTemperature}
                        </div>
                        <div className="text-sm text-slate-700">
                            {propertyMarketData.marketAnalysis.marketTemperature.toLowerCase().includes('hot') 
                                ? "This is a strong seller's market with high demand and rising prices."
                                : propertyMarketData.marketAnalysis.marketTemperature.toLowerCase().includes('warm')
                                ? "This is a balanced market with steady demand and stable prices."
                                : "This is a buyer's market with lower competition and potentially negotiable prices."
                            }
                        </div>
                        <div className="flex items-center mt-2">
                            <span className="text-sm text-slate-600">Market trend: </span>
                            <span className="ml-2 flex items-center" style={{ 
                                color: getChangeColor(propertyMarketData.marketAnalysis.marketTrend) 
                            }}>
                                {propertyMarketData.marketAnalysis.marketTrend >= 0 ? (
                                    <BiTrendingUp className="mr-1" />
                                ) : (
                                    <BiTrendingDown className="mr-1" />
                                )}
                                <span className="font-medium">
                                    {propertyMarketData.marketAnalysis.marketTrend >= 0 ? '+' : ''}
                                    {propertyMarketData.marketAnalysis.marketTrend.toFixed(1)}% annually
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Price History */}
            {propertyMarketData.priceHistory && propertyMarketData.priceHistory.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Property Price History</h3>
                    <div className="w-full h-64 mb-4">
                        {/* Improved chart with better label placement */}
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={propertyMarketData.priceHistory
                                    .filter((item: any) => item.event === 'Listed for sale' || item.event === 'Sold' || item.event === 'Price change')
                                    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                }
                                margin={{ top: 25, right: 30, left: 20, bottom: 40 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                />
                                <YAxis 
                                    tickFormatter={(value) => `$${(value/1000)}k`}
                                    tick={{ fontSize: 12 }}
                                />
                                {/* Improved tooltip with better contrast */}
                                <Tooltip content={<CustomTooltip />} />
                                {/* Legend moved to top-right */}
                                <Legend 
                                    verticalAlign="top" 
                                    align="right"
                                    wrapperStyle={{ paddingBottom: 10 }}
                                />
                                <Bar 
                                    dataKey="price" 
                                    fill="#3B82F6" 
                                    name="Price" 
                                    barSize={30}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-sm text-slate-600 mt-2">
                        {propertyMarketData.priceHistory.length > 0 ? 
                            `This property has had ${propertyMarketData.priceHistory.length} recorded price changes or listing events.` :
                            'No price history is available for this property.'
                        }
                    </div>
                </div>
            )}

            {/* Similar Properties Comparison - Improved table with better contrast */}
            {propertyMarketData.similarProperties && propertyMarketData.similarProperties.length > 0 && selectedProperty && (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Nearby Properties</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Address</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-700">Price</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-700">HOA Fee</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-700">Sq Ft</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-700">$/Sq Ft</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {/* Current property row with highlight */}
                    <tr className="bg-blue-50">
                        <td className="px-4 py-2 font-medium text-slate-900">This Property</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-900">
                            {typeof selectedProperty.price === 'number' 
                                ? formatDollar(selectedProperty.price) 
                                : selectedProperty.price}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-800">
                            {propertyDetails?.features?.hoaFee || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-800">
                            {typeof selectedProperty.sqft === 'number' 
                                ? selectedProperty.sqft.toLocaleString() 
                                : selectedProperty.sqft}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-800">
                            {typeof selectedProperty.price === 'number' && typeof selectedProperty.sqft === 'number'
                                ? formatDollar(selectedProperty.price / selectedProperty.sqft)
                                : 'N/A'}
                        </td>
                    </tr>
                    {propertyMarketData.similarProperties.slice(0, 5).map((property: any, index: number) => (
                        <tr key={index} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-800">{property.address}</td>
                            <td className="px-4 py-2 text-right text-slate-800">{formatDollar(property.price)}</td>
                            <td className="px-4 py-2 text-right text-slate-800">
                                {property.hoaFee ? formatDollar(property.hoaFee) : 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-800">
                                {property.sqft ? property.sqft.toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-800">
                                {property.sqft && property.sqft > 0 
                                    ? formatDollar(property.pricePerSqFt) 
                                    : 'N/A'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)}
            {/* Area Market Trends */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Area Market Trends</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-50 p-4 rounded-lg shadow-sm">
                        <div className="text-sm text-slate-500 mb-1">Days on Market</div>
                        <div className="text-xl font-bold text-slate-800">
                            {propertyMarketData.marketAnalysis.daysOnMarket || 'N/A'}
                        </div>
                        <div className="text-sm text-slate-600">
                            vs area avg: {propertyMarketData.marketAnalysis.averageDaysOnMarket} days
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg shadow-sm">
                        <div className="text-sm text-slate-500 mb-1">Area Median Price</div>
                        <div className="text-xl font-bold text-slate-800">
                            {formatDollar(propertyMarketData.marketAnalysis.medianPrice)}
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg shadow-sm">
                        <div className="text-sm text-slate-500 mb-1">Avg Price/Sq Ft</div>
                        <div className="text-xl font-bold text-slate-800">
                            {formatDollar(propertyMarketData.marketAnalysis.averagePricePerSqFt)}
                        </div>
                    </div>
                </div>
                
                {/* Historical trends chart */}
                {propertyMarketData.historicalTrends && propertyMarketData.historicalTrends.current_year && (
                    <div className="w-full h-64 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                                data={propertyMarketData.historicalTrends.current_year}
                                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis 
                                    tickFormatter={(value) => `$${(value/1000)}k`}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                {/* Legend moved to top-right */}
                                <Legend 
                                    verticalAlign="top" 
                                    align="right"
                                    wrapperStyle={{ paddingBottom: 10 }}
                                />
                                <ReferenceLine 
                                    y={selectedProperty.price} 
                                    stroke="#EA4335" 
                                    strokeDasharray="3 3"
                                    label={{ 
                                        value: 'This Property', 
                                        position: 'insideTopRight',
                                        fill: '#EA4335', 
                                        fontSize: 11 
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="price"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    dot={{ stroke: '#3B82F6', strokeWidth: 2, r: 4, fill: 'white' }}
                                    activeDot={{ stroke: '#3B82F6', strokeWidth: 2, r: 6, fill: '#3B82F6' }}
                                    name="Area Avg Price"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertyMarketTab;