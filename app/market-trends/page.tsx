"use client";

import React from 'react';
import Link from 'next/link';

const MarketTrends = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-slate-800 mb-3">Market Trends</h1>
                    <p className="text-slate-600">
                        Current market analysis and real estate trends in your area.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Main Stats Card */}
                    <div className="p-6 bg-white rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold text-slate-800">Boston, MA</h2>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                                Updated today
                            </span>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="text-slate-600 mb-1 text-sm">Median Home Price</div>
                                <div className="text-xl font-semibold text-slate-800">$785,000</div>
                                <div className="flex items-center mt-1">
                                    <span className="text-emerald-600 text-sm flex items-center">
                                        ↑ +3.2%
                                        <span className="text-slate-500 ml-1">last month</span>
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="text-slate-600 mb-1 text-sm">Days on Market</div>
                                <div className="text-xl font-semibold text-slate-800">24 days</div>
                                <div className="flex items-center mt-1">
                                    <span className="text-rose-600 text-sm flex items-center">
                                        ↓ -5%
                                        <span className="text-slate-500 ml-1">faster sales</span>
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="text-slate-600 mb-1 text-sm">Buyer Demand</div>
                                <div className="text-xl font-semibold text-slate-800">High</div>
                                <div className="flex items-center mt-1">
                                    <span className="text-emerald-600 text-sm">
                                        Strong market activity
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Market Categories */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-slate-800">Quick Filters</h3>
                        <div className="flex flex-wrap gap-3">
                            <button className="group px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all duration-200 flex items-center space-x-2">
                                <span className="text-xl group-hover:scale-110 transition-transform duration-200">🔥</span>
                                <span>Hottest Listings</span>
                            </button>
                            <button className="group px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all duration-200 flex items-center space-x-2">
                                <span className="text-xl group-hover:scale-110 transition-transform duration-200">💎</span>
                                <span>Best Value Homes</span>
                            </button>
                            <button className="group px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all duration-200 flex items-center space-x-2">
                                <span className="text-xl group-hover:scale-110 transition-transform duration-200">🆕</span>
                                <span>New to Market</span>
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="pt-6 border-t border-slate-200">
                        <Link
                            href="/chat"
                            className="inline-flex items-center text-slate-600 hover:text-slate-800 transition-colors duration-200"
                        >
                            ← Back to Chat
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketTrends;
