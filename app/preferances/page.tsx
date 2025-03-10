"use client";

import React from 'react';
import Link from 'next/link';

const Preferences = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-slate-800 mb-3">Set Your Preferences</h1>
                    <p className="text-slate-600">
                        Customize your property search criteria to find your perfect match.
                    </p>
                </div>

                <form className="space-y-6">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-slate-700 font-medium mb-2">
                                Location
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    placeholder="Enter city, neighborhood, or ZIP code"
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all duration-200 placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-700 font-medium mb-2">
                                    Minimum Price
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input
                                        type="text"
                                        placeholder="Min price"
                                        className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all duration-200 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-700 font-medium mb-2">
                                    Maximum Price
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input
                                        type="text"
                                        placeholder="Max price"
                                        className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all duration-200 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-700 font-medium mb-2">
                                Property Type
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 group focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
                                >
                                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">🏠</span>
                                    <span className="text-slate-700">House</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 group focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
                                >
                                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">🏢</span>
                                    <span className="text-slate-700">Apartment</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 group focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
                                >
                                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">🏘️</span>
                                    <span className="text-slate-700">Condo</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                        <Link
                            href="/chat"
                            className="text-slate-600 hover:text-slate-800 transition-colors duration-200"
                        >
                            ← Back to Chat
                        </Link>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-transform"
                        >
                            Save Preferences
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Preferences;
