// components/tabs/MarketTab.tsx
"use client";

import React from 'react';
import { useChatContext } from '../../context/ChatContext';

const MarketTab = () => {
    const { isLoadingMarketTrends, marketTrends } = useChatContext();

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

    if (!marketTrends) {
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
        <div className="space-y-4 animate-fadeIn">
            {/* Add Market Trend Panels Here */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Price Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm text-slate-500">Median Price</div>
                        <div className="text-xl font-bold text-slate-800">
                            ${marketTrends.price_metrics.median_price?.toLocaleString() || 'N/A'}
                        </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm text-slate-500">Price Range</div>
                        <div className="text-sm font-medium text-slate-800">
                            ${marketTrends.price_metrics.lowest_price?.toLocaleString() || 'N/A'} - ${marketTrends.price_metrics.highest_price?.toLocaleString() || 'N/A'}
                        </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm text-slate-500">Price/SqFt</div>
                        <div className="text-sm font-medium text-slate-800">
                            ${marketTrends.price_metrics.price_per_sqft_range?.min?.toFixed(0) || 'N/A'} - ${marketTrends.price_metrics.price_per_sqft_range?.max?.toFixed(0) || 'N/A'}
                        </div>
                    </div>
                </div>
            </div>
            {/* You can continue adding the rest of the Market Trends UI like Activity, Type Distribution, etc. */}
        </div>
    );
};

export default MarketTab;
