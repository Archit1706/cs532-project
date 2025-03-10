"use client";
import React from 'react';
import Link from 'next/link';

const FindHomes = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-slate-800 mb-3">Find Homes for Sale</h1>
                    <p className="text-slate-600">
                        Discover available properties that match your criteria.
                    </p>
                </div>

                {/* Search Filters */}
                <div className="mb-8">
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by location..."
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all duration-200"
                            />
                        </div>
                        <button className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl">
                            Search
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button className="px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all duration-200">
                            Price: Any ▼
                        </button>
                        <button className="px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all duration-200">
                            Beds: Any ▼
                        </button>
                        <button className="px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all duration-200">
                            Property Type ▼
                        </button>
                        <button className="px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all duration-200">
                            More Filters ▼
                        </button>
                    </div>
                </div>

                {/* Property Listings */}
                <div className="space-y-4">
                    <div className="group p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200">
                        <div className="flex gap-4">
                            <div className="w-32 h-24 bg-slate-100 rounded-lg overflow-hidden">
                                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-3xl">
                                    🏠
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-xl font-semibold text-slate-800 group-hover:text-slate-900">Cozy Family Home</h2>
                                    <span className="text-lg font-semibold text-slate-800">$750,000</span>
                                </div>
                                <div className="flex items-center text-slate-600 mb-2">
                                    <span className="mr-2">📍</span>
                                    Boston, MA
                                </div>
                                <div className="flex gap-4 text-sm text-slate-600">
                                    <span>4 beds</span>
                                    <span>•</span>
                                    <span>3 baths</span>
                                    <span>•</span>
                                    <span>2,400 sqft</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="group p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200">
                        <div className="flex gap-4">
                            <div className="w-32 h-24 bg-slate-100 rounded-lg overflow-hidden">
                                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-3xl">
                                    🏢
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-xl font-semibold text-slate-800 group-hover:text-slate-900">Modern Apartment</h2>
                                    <span className="text-lg font-semibold text-slate-800">$650,000</span>
                                </div>
                                <div className="flex items-center text-slate-600 mb-2">
                                    <span className="mr-2">📍</span>
                                    Cambridge, MA
                                </div>
                                <div className="flex gap-4 text-sm text-slate-600">
                                    <span>2 beds</span>
                                    <span>•</span>
                                    <span>2 baths</span>
                                    <span>•</span>
                                    <span>1,200 sqft</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                    <Link
                        href="/chat"
                        className="inline-flex items-center text-slate-600 hover:text-slate-800 transition-colors duration-200"
                    >
                        ← Back to Chat
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FindHomes;
