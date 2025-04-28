"use client";
import { SignUp } from '@clerk/nextjs'
import React from 'react';
import { BsGraphUp, BsShieldCheck } from 'react-icons/bs';
import { FaHome, FaRegLightbulb, FaSearch, FaRegClock } from 'react-icons/fa';
import Link from 'next/link';

const Header = () => {
    return (
        <header className="bg-white shadow-md fixed w-full z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center space-x-2">
                        <img src="/realestate-ai-logo.png" alt="Keya Logo" className="h-8 w-8 bg-emerald-300 rounded-lg" />
                        <span className="text-xl font-bold text-emerald-700">Keya</span>
                    </Link>

                    <div className="flex items-center space-x-3">
                        <Link href="/" className="text-gray-600 hover:text-emerald-600 text-sm font-medium">
                            Home
                        </Link>
                        <Link href="/about" className="text-gray-600 hover:text-emerald-600 text-sm font-medium">
                            About
                        </Link>
                        <Link href="/sign-in" className="px-4 py-2 border border-emerald-600 text-emerald-600 text-sm font-semibold rounded-md hover:bg-emerald-50 transition-colors">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default function Page() {
    return (
        <div className="min-h-screen bg-gradient-to-r from-emerald-900 to-teal-800">
            <Header />

            <div className="flex min-h-screen pt-16">
                {/* Left Section - Benefits */}
                <div className="hidden md:flex md:w-1/2 p-8 items-center justify-center">
                    <div className="max-w-md text-white">
                        <h2 className="text-3xl font-bold mb-8 text-emerald-100">Start your smarter home search today</h2>

                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="bg-emerald-700 p-3 rounded-lg">
                                    <FaRegLightbulb className="text-white text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-emerald-100">Smart recommendations</h3>
                                    <p className="text-teal-100">Our AI learns your preferences to show you homes you'll actually love.</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-emerald-700 p-3 rounded-lg">
                                    <FaSearch className="text-white text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-emerald-100">Natural language search</h3>
                                    <p className="text-teal-100">Simply describe what you want in a home and we'll find perfect matches.</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-emerald-700 p-3 rounded-lg">
                                    <BsGraphUp className="text-white text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-emerald-100">Market insights</h3>
                                    <p className="text-teal-100">Get data-driven insights about property values and neighborhood trends.</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-emerald-700 p-3 rounded-lg">
                                    <FaRegClock className="text-white text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-emerald-100">Save time</h3>
                                    <p className="text-teal-100">Find your perfect home faster with our AI-powered matching system.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 p-4 bg-white/10 rounded-lg border border-white/20">
                            <div className="flex items-center space-x-3">
                                <div className="bg-emerald-500 p-2 rounded-full">
                                    <BsShieldCheck className="text-white text-sm" />
                                </div>
                                <p className="text-sm text-emerald-100">Your data is always secure and never shared with third parties without your permission.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section - Sign Up Form */}
                <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6">
                            <div className="flex justify-center mb-3">
                                <div className="bg-white/10 p-3 rounded-full">
                                    <FaHome className="text-white text-2xl" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-center text-white">Create your Keya account</h1>
                            <p className="text-center text-emerald-100 mt-1">Find your dream home with AI assistance</p>
                        </div>

                        <div className="p-6">
                            <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" redirectUrl="/onboarding" />
                        </div>

                        <div className="bg-gray-50 p-6 border-t border-gray-100">
                            <p className="text-center text-gray-600 text-sm">
                                Already have an account?{' '}
                                <Link href="/sign-in" className="text-emerald-600 font-medium hover:text-emerald-700">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wave Shape Footer */}
            <div className="absolute bottom-0 left-0 right-0 z-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" className="w-full">
                    <path
                        fill="#ffffff"
                        fillOpacity="0.1"
                        d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,42.7C672,32,768,32,864,42.7C960,53,1056,75,1152,75C1248,75,1344,53,1392,42.7L1440,32L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"
                    ></path>
                </svg>
            </div>
        </div>
    );
}