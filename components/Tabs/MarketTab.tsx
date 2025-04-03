// components/Tabs/MarketTab.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { BiTrendingUp, BiTrendingDown } from 'react-icons/bi';
import { FaThermometerFull, FaThermometerHalf, FaThermometerEmpty } from 'react-icons/fa';

const MarketTab = () => {
    const { isLoadingMarketTrends, marketTrends } = useChatContext();

    const priceMetrics = marketTrends?.trends?.price_distribution;
    const summary = marketTrends?.trends?.summary_metrics;
    const national = marketTrends?.trends?.national_comparison;
    const marketStatus = marketTrends?.trends?.market_status;
    const nearbyAreas = marketTrends?.trends?.nearby_areas || [];
    const historical = marketTrends?.trends?.historical_trends;

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

    // Helper function for value change color
    const getChangeColor = (changeValue: string) => {
        if (!changeValue) return "#6B7280"; // Default gray
        return parseFloat(changeValue) >= 0 ? "#10B981" : "#EF4444";
    };

    // Helper function for temperature icon
    const getTemperatureIcon = (temperature: string) => {
        if (!temperature) return <FaThermometerHalf className="text-slate-400" />;

        if (temperature.toLowerCase().includes('hot')) {
            return <FaThermometerFull className="text-red-500" size={24} />;
        }
        if (temperature.toLowerCase().includes('warm')) {
            return <FaThermometerHalf className="text-orange-500" size={24} />;
        }
        if (temperature.toLowerCase().includes('cold') || temperature.toLowerCase().includes('cool')) {
            return <FaThermometerEmpty className="text-blue-500" size={24} />;
        }

        return <FaThermometerHalf className="text-purple-500" size={24} />;
    };

    // Format dollar amounts
    const formatDollar = (amount: number) => {
        if (!amount && amount !== 0) return 'N/A';
        return '$' + amount.toLocaleString();
    };

    const combinedHistoricalData = (() => {
        if (!historical?.previous_year && !historical?.current_year) return [];

        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        const previous = (historical.previous_year || []).reduce((acc: any, item: any) => {
            acc[item.month] = { month: item.month, "2024": item.price };
            return acc;
        }, {});

        const current = (historical.current_year || []).reduce((acc: any, item: any) => {
            if (!acc[item.month]) acc[item.month] = { month: item.month };
            acc[item.month]["2025"] = item.price;
            return acc;
        }, previous);

        return months.map(month => current[month] || { month });
    })();

    // Custom Tooltip for the line chart
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 shadow-lg rounded-lg border border-slate-200">
                    <p className="font-semibold">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {formatDollar(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Get median price for reference line
    const medianPrice = priceMetrics?.median_price || 0;

    if (isLoadingMarketTrends) {
        return (
            <div className="flex justify-center p-8">
                <div className="flex flex-col items-center space-y-3">
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-3 h-3 bg-teal-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <div className="text-teal-600 font-medium">Loading market data...</div>
                </div>
            </div>
        );
    }

    if (!marketTrends || !marketTrends) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-4 text-slate-600 font-medium">No market data available</p>
                <p className="text-slate-500">Enter a zip code to see market trends</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 overflow-y-auto max-h-[85vh] p-4 animate-fadeIn bg-gradient-to-b from-teal-50 to-white">
            <div className="bg-teal-700 text-white p-4 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-1">Market Details</h2>
                <p className="text-teal-100 text-sm">
                    Analysis for {marketTrends?.location?.city || 'this area' || marketTrends?.location}
                    {marketTrends?.location?.state && ` ${marketTrends.location.state}`}
                    {marketTrends?.location?.zip && ` ${marketTrends.location.zip}`}
                </p>
            </div>

            {/* Price Overview */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Price Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg shadow-sm">
                        <div className="text-sm text-slate-500 mb-1">Median Price</div>
                        <div className="text-2xl font-bold text-slate-800">
                            {formatDollar(priceMetrics?.median_price)}
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg shadow-sm">
                        <div className="text-sm text-slate-500 mb-1">Most Common Price</div>
                        <div className="text-xl font-bold text-slate-800">
                            {formatDollar(priceMetrics?.most_common_price)}
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg shadow-sm">
                        <div className="text-sm text-slate-500 mb-1">Common Price Range</div>
                        <div className="text-md font-bold text-slate-800">
                            {formatDollar(priceMetrics?.most_common_price_range?.min)} - {formatDollar(priceMetrics?.most_common_price_range?.max)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg shadow-sm">
                        <div className="text-sm text-slate-500 mb-1">Available Rentals</div>
                        <div className="text-2xl font-bold text-slate-800">{summary?.available_rentals || 'N/A'}</div>
                    </div>
                    <div
                        className="p-4 rounded-lg shadow-sm relative overflow-hidden"
                        style={{
                            background: `linear-gradient(to bottom right, ${getChangeColor(summary?.monthly_change_percent)}15, ${getChangeColor(summary?.monthly_change_percent)}05)`
                        }}
                    >
                        <div className="text-sm text-slate-500 mb-1">Monthly Change</div>
                        <div className="flex items-center">
                            <div className="text-xl font-bold" style={{ color: getChangeColor(summary?.monthly_change_percent) }}>
                                {formatDollar(summary?.monthly_change)}
                            </div>
                            <div className="ml-2 flex items-center" style={{ color: getChangeColor(summary?.monthly_change_percent) }}>
                                {summary?.monthly_change_percent >= 0 ?
                                    <BiTrendingUp size={18} /> :
                                    <BiTrendingDown size={18} />
                                }
                                <span className="text-sm font-medium ml-1">
                                    {summary?.monthly_change_percent?.toFixed(2) || 'N/A'}%
                                </span>
                            </div>
                        </div>
                    </div>
                    <div
                        className="p-4 rounded-lg shadow-sm relative overflow-hidden"
                        style={{
                            background: `linear-gradient(to bottom right, ${getChangeColor(summary?.yearly_change_percent)}15, ${getChangeColor(summary?.yearly_change_percent)}05)`
                        }}
                    >
                        <div className="text-sm text-slate-500 mb-1">Yearly Change</div>
                        <div className="flex items-center">
                            <div className="text-xl font-bold" style={{ color: getChangeColor(summary?.yearly_change_percent) }}>
                                {formatDollar(summary?.yearly_change)}
                            </div>
                            <div className="ml-2 flex items-center" style={{ color: getChangeColor(summary?.yearly_change_percent) }}>
                                {summary?.yearly_change_percent >= 0 ?
                                    <BiTrendingUp size={18} /> :
                                    <BiTrendingDown size={18} />
                                }
                                <span className="text-sm font-medium ml-1">
                                    {summary?.yearly_change_percent?.toFixed(2) || 'N/A'}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Market Status */}
            <div
                className="rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                style={{
                    borderColor: getTemperatureColor(marketStatus?.temperature),
                    background: `linear-gradient(to right, ${getTemperatureColor(marketStatus?.temperature)}15, white)`
                }}
            >
                <div className="flex items-start">
                    <div className="mr-4">
                        {getTemperatureIcon(marketStatus?.temperature)}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Market Status</h3>
                        <div className="font-medium mb-1" style={{ color: getTemperatureColor(marketStatus?.temperature) }}>
                            {marketStatus?.temperature || 'N/A'}
                        </div>
                        <div className="text-sm text-slate-700">
                            {marketStatus?.interpretation || 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            {/* National Comparison */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">National Comparison</h3>
                <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-700">Median Rent Nationally:</div>
                        <div className="font-bold text-slate-800">{formatDollar(national?.national_median)}</div>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-700">Local Difference:</div>
                        <div className="font-bold" style={{ color: getChangeColor(national?.difference) }}>
                            {formatDollar(national?.difference)} ({national?.difference_percent?.toFixed(2) || 'N/A'}%)
                        </div>
                    </div>
                    <div className="mt-2 py-2 px-3 bg-slate-50 rounded-lg flex items-center">
                        <div className="h-3 flex-1 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${Math.min(Math.max((national?.difference_percent || 0) + 50, 0), 100)}%`,
                                    backgroundColor: getChangeColor(national?.difference),
                                }}
                            ></div>
                        </div>
                        <div className="ml-3 text-sm font-medium text-slate-800">
                            Local rent is <span className="font-bold">{national?.is_above_national ? 'above' : 'below'}</span> national average
                        </div>
                    </div>
                </div>
            </div>

            {/* Historical Trends Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Historical Rental Trends</h3>
                <div className="text-sm text-slate-700 mb-3">
                    A comparison of monthly rental prices between 2024 and 2025.
                </div>
                <div className="w-full h-72 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={combinedHistoricalData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis
                                domain={['auto', 'auto']}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: 10 }} />
                            <ReferenceLine y={medianPrice} stroke="#6B7280" strokeDasharray="3 3" label={{ value: 'Median', position: 'insideBottomRight', fill: '#6B7280', fontSize: 11 }} />
                            <Line
                                type="monotone"
                                dataKey="2024"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={{ stroke: '#3B82F6', strokeWidth: 2, r: 4, fill: 'white' }}
                                activeDot={{ stroke: '#3B82F6', strokeWidth: 2, r: 6, fill: '#3B82F6' }}
                                name="2024"
                            />
                            <Line
                                type="monotone"
                                dataKey="2025"
                                stroke="#10B981"
                                strokeWidth={2}
                                dot={{ stroke: '#10B981', strokeWidth: 2, r: 4, fill: 'white' }}
                                activeDot={{ stroke: '#10B981', strokeWidth: 2, r: 6, fill: '#10B981' }}
                                name="2025"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Nearby Areas */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Nearby Areas</h3>
                <div className="grid grid-cols-2 gap-3">
                    {nearbyAreas.map((area: any, i: number) => (
                        <div
                            key={i}
                            className="p-3 rounded-lg relative overflow-hidden"
                            style={{
                                background: `linear-gradient(to bottom right, ${getChangeColor(area.difference_percent)}08, white)`,
                                borderLeft: `3px solid ${getChangeColor(area.difference_percent)}`
                            }}
                        >
                            <div className="text-md font-semibold text-slate-800 mb-1">{area.name}</div>
                            <div className="flex justify-between text-sm text-slate-700">
                                <span>Median Rent:</span>
                                <span className="font-medium">{formatDollar(area.median_rent)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-700">Difference:</span>
                                <span className="font-medium" style={{ color: getChangeColor(area.difference_percent) }}>
                                    {formatDollar(area.difference)} ({area.difference_percent.toFixed(1)}%)
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MarketTab;