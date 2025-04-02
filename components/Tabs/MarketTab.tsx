// components/Tabs/MarketTab.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer
} from 'recharts';


const MarketTab = () => {
    const { isLoadingMarketTrends, marketTrends } = useChatContext();

    const priceMetrics = marketTrends?.trends?.price_distribution;
    const summary = marketTrends?.trends?.summary_metrics;
    const national = marketTrends?.trends?.national_comparison;
    const marketStatus = marketTrends?.trends?.market_status;
    const nearbyAreas = marketTrends?.trends?.nearby_areas || [];
    const historical = marketTrends?.trends?.historical_trends;

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


    if (isLoadingMarketTrends) {
        return (
            <div className="flex justify-center p-4">
                <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
            </div>
        );
    }

    if (!marketTrends || !marketTrends) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-2 text-slate-600">No market data available. Enter a zip code to see market trends.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 overflow-y-auto max-h-[85vh] p-4 animate-fadeIn bg-teal-50">
            {/* Price Overview */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Price Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm text-slate-500">Median Price</div>
                        <div className="text-xl font-bold text-slate-800">
                            ${priceMetrics?.median_price?.toLocaleString() || 'N/A'}
                        </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm text-slate-500">Most Common Price</div>
                        <div className="text-sm font-medium text-slate-800">
                            ${priceMetrics?.most_common_price?.toLocaleString() || 'N/A'}
                        </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm text-slate-500">Common Price Range</div>
                        <div className="text-sm font-medium text-slate-800">
                            ${priceMetrics?.most_common_price_range?.min || 'N/A'} - ${priceMetrics?.most_common_price_range?.max || 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm text-slate-500">Available Rentals</div>
                        <div className="text-xl font-bold text-slate-800">{summary?.available_rentals || 'N/A'}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm text-slate-500">Monthly Change</div>
                        <div className="text-sm font-medium text-slate-800">
                            ${summary?.monthly_change?.toFixed(0) || 'N/A'} ({summary?.monthly_change_percent?.toFixed(2) || 'N/A'}%)
                        </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm text-slate-500">Yearly Change</div>
                        <div className="text-sm font-medium text-slate-800">
                            ${summary?.yearly_change?.toFixed(0) || 'N/A'} ({summary?.yearly_change_percent?.toFixed(2) || 'N/A'}%)
                        </div>
                    </div>
                </div>
            </div>

            {/* Market Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Market Status</h3>
                <div className="text-sm text-slate-700">
                    <strong>Status:</strong> {marketStatus?.temperature || 'N/A'}
                </div>
                <div className="text-sm text-slate-700 mt-1">
                    {marketStatus?.interpretation || 'N/A'}
                </div>
            </div>

            {/* National Comparison */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">National Comparison</h3>
                <div className="text-sm text-slate-700">
                    Median Rent Nationally: <strong>${national?.national_median?.toFixed(0) || 'N/A'}</strong>
                </div>
                <div className="text-sm text-slate-700 mt-1">
                    Local Difference: <strong>${national?.difference?.toFixed(0) || 'N/A'}</strong> (
                    {national?.difference_percent?.toFixed(2) || 'N/A'}%)
                </div>
                <div className="text-sm mt-1 text-slate-700">
                    Local rent is <strong>{national?.is_above_national ? 'above' : 'below'}</strong> national average.
                </div>
            </div>

            {/* Nearby Areas */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Nearby Areas</h3>
                <div className="grid grid-cols-2 gap-3">
                    {nearbyAreas.map((area: any, i: number) => (
                        <div key={i} className="bg-slate-50 p-3 rounded-lg">
                            <div className="text-sm font-semibold text-slate-800">{area.name}</div>
                            <div className="text-sm text-slate-700">Median Rent: ${area.median_rent}</div>
                            <div className="text-sm text-slate-700">
                                Difference: ${area.difference.toFixed(0)} ({area.difference_percent.toFixed(2)}%)
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Historical Trends Placeholder */}
            {/* Historical Trends Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Historical Rental Trends</h3>
                <div className="text-sm text-slate-700 mb-3">
                    A comparison of monthly rental prices between 2024 and 2025.
                </div>
                <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={combinedHistoricalData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis domain={['auto', 'auto']} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="2024" stroke="#60A5FA" strokeWidth={2} name="2024" />
                            <Line type="monotone" dataKey="2025" stroke="#34D399" strokeWidth={2} name="2025" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default MarketTab;
