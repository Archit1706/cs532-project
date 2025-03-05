"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header = () => {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <header className="w-full bg-white/70 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-2xl">🏠</span>
                        <span className="font-semibold text-xl text-slate-800">RealEstateAI</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center space-x-4">
                        <Link
                            href="/chat"
                            className={`px-3 py-2 rounded-lg transition-colors duration-200 ${isActive('/chat')
                                ? 'bg-slate-100 text-slate-900'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            Chat
                        </Link>
                        <Link
                            href="/find-homes"
                            className={`px-3 py-2 rounded-lg transition-colors duration-200 ${isActive('/find-homes')
                                ? 'bg-slate-100 text-slate-900'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            Find Homes
                        </Link>
                        <Link
                            href="/market-trends"
                            className={`px-3 py-2 rounded-lg transition-colors duration-200 ${isActive('/market-trends')
                                ? 'bg-slate-100 text-slate-900'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            Market Trends
                        </Link>
                        <Link
                            href="/preferences"
                            className={`px-3 py-2 rounded-lg transition-colors duration-200 ${isActive('/preferences')
                                ? 'bg-slate-100 text-slate-900'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            Preferences
                        </Link>
                    </nav>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        <button className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors duration-200">
                            Help
                        </button>
                        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200">
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;