"use client";
import React from 'react';
import Link from 'next/link';

const Legal = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-slate-800 mb-3">Legal Information</h1>
                    <p className="text-slate-600">
                        Navigate real estate legalities with confidence. Select a topic to learn more.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Legal Topics Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <button className="group p-6 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all duration-200 text-left">
                            <div className="flex items-center mb-4">
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-200">📋</span>
                                <h3 className="text-lg font-medium text-slate-800 ml-3">Purchase Agreements</h3>
                            </div>
                            <p className="text-slate-600">
                                Understanding contracts, terms, and conditions for property purchases.
                            </p>
                        </button>

                        <button className="group p-6 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all duration-200 text-left">
                            <div className="flex items-center mb-4">
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🏠</span>
                                <h3 className="text-lg font-medium text-slate-800 ml-3">Property Rights</h3>
                            </div>
                            <p className="text-slate-600">
                                Learn about ownership rights, easements, and restrictions.
                            </p>
                        </button>

                        <button className="group p-6 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all duration-200 text-left">
                            <div className="flex items-center mb-4">
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-200">⚖️</span>
                                <h3 className="text-lg font-medium text-slate-800 ml-3">Regulations</h3>
                            </div>
                            <p className="text-slate-600">
                                Local zoning laws, building codes, and property regulations.
                            </p>
                        </button>

                        <button className="group p-6 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all duration-200 text-left">
                            <div className="flex items-center mb-4">
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-200">📜</span>
                                <h3 className="text-lg font-medium text-slate-800 ml-3">Documentation</h3>
                            </div>
                            <p className="text-slate-600">
                                Required paperwork, permits, and legal documentation.
                            </p>
                        </button>
                    </div>

                    {/* Disclaimer Card */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-start">
                            <span className="text-2xl mr-3">ℹ️</span>
                            <p className="text-sm text-slate-600">
                                This information is provided for general guidance only. Always consult with a qualified legal professional for advice specific to your situation.
                            </p>
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

export default Legal;
