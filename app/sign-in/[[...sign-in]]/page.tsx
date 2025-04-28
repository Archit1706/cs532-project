"use client";
import { SignIn } from '@clerk/nextjs'
import React from 'react';
import { BsChatDots } from 'react-icons/bs';
import { FaHome, FaBuilding, FaMapMarkedAlt, FaUserFriends } from 'react-icons/fa';
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
                        {/* <Link href="/pricing" className="text-gray-600 hover:text-emerald-600 text-sm font-medium">
              Pricing
            </Link> */}
                        <Link href="/sign-up" className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-md hover:bg-emerald-700 transition-colors">
                            Sign Up
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
                        <h2 className="text-3xl font-bold mb-8 text-emerald-100">Find your perfect home with AI assistance</h2>

                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="bg-emerald-700 p-3 rounded-lg">
                                    <BsChatDots className="text-white text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-emerald-100">Natural conversations</h3>
                                    <p className="text-teal-100">Chat naturally about your home preferences and get personalized recommendations.</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-emerald-700 p-3 rounded-lg">
                                    <FaMapMarkedAlt className="text-white text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-emerald-100">Location insights</h3>
                                    <p className="text-teal-100">Get detailed information about neighborhoods, transport, and amenities.</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-emerald-700 p-3 rounded-lg">
                                    <FaBuilding className="text-white text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-emerald-100">Property matching</h3>
                                    <p className="text-teal-100">Our AI matches you with properties that fit your unique requirements.</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-emerald-700 p-3 rounded-lg">
                                    <FaUserFriends className="text-white text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-emerald-100">Expert assistance</h3>
                                    <p className="text-teal-100">Connect with real estate professionals when you're ready to move forward.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section - Sign In Form */}
                <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6">
                            <div className="flex justify-center mb-3">
                                <div className="bg-white/10 p-3 rounded-full">
                                    <FaHome className="text-white text-2xl" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-center text-white">Welcome back to Keya</h1>
                            <p className="text-center text-emerald-100 mt-1">Sign in to continue your home search journey</p>
                        </div>

                        <div className="p-6">
                            <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" redirectUrl="/dashboard" />
                        </div>

                        <div className="bg-gray-50 p-6 border-t border-gray-100">
                            <p className="text-center text-gray-600 text-sm">
                                Don't have an account?{' '}
                                <Link href="/sign-up" className="text-emerald-600 font-medium hover:text-emerald-700">
                                    Sign up
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