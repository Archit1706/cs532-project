"use client";

import Link from "next/link";
import Landing from "@/components/Landing";

export default function Home() {
  return (
    // <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    //   {/* Hero Section */}
    //   <div className="container mx-auto px-6 pt-16 pb-24">
    //     <div className="flex flex-col items-center text-center mb-16">
    //       <h1 className="text-5xl font-bold text-slate-900 mb-6">
    //         Your AI-Powered Real Estate Assistant
    //       </h1>
    //       <p className="text-xl text-slate-600 max-w-2xl mb-8">
    //         Discover, analyze, and make informed real estate decisions with our conversational AI assistant. Available 24/7 to help you navigate the property market.
    //       </p>
    //       <Link
    //         href="/onboarding"
    //         className="px-8 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
    //       >
    //         Get Started
    //       </Link>
    //     </div>

    //     {/* Use Cases Section */}
    //     <div className="grid md:grid-cols-3 gap-8 mb-24">
    //       <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200">
    //         <div className="text-3xl mb-4">🏠</div>
    //         <h2 className="text-xl font-semibold text-slate-800 mb-4">
    //           Property Buyers & Renters
    //         </h2>
    //         <ul className="space-y-3 text-slate-600">
    //           <li className="flex items-start">
    //             <span className="text-emerald-500 mr-2">✓</span>
    //             Get real-time property listings based on preferences
    //           </li>
    //           <li className="flex items-start">
    //             <span className="text-emerald-500 mr-2">✓</span>
    //             Ask questions about pricing and neighborhood insights
    //           </li>
    //           <li className="flex items-start">
    //             <span className="text-emerald-500 mr-2">✓</span>
    //             Compare market trends dynamically
    //           </li>
    //         </ul>
    //       </div>

    //       <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200">
    //         <div className="text-3xl mb-4">👥</div>
    //         <h2 className="text-xl font-semibold text-slate-800 mb-4">
    //           Real Estate Agents & Sellers
    //         </h2>
    //         <ul className="space-y-3 text-slate-600">
    //           <li className="flex items-start">
    //             <span className="text-emerald-500 mr-2">✓</span>
    //             Automate initial inquiries and lead qualification
    //           </li>
    //           <li className="flex items-start">
    //             <span className="text-emerald-500 mr-2">✓</span>
    //             Get instant market updates and analysis
    //           </li>
    //           <li className="flex items-start">
    //             <span className="text-emerald-500 mr-2">✓</span>
    //             Focus on high-touch client interactions
    //           </li>
    //         </ul>
    //       </div>

    //       <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200">
    //         <div className="text-3xl mb-4">🌐</div>
    //         <h2 className="text-xl font-semibold text-slate-800 mb-4">
    //           Platforms & Marketplaces
    //         </h2>
    //         <ul className="space-y-3 text-slate-600">
    //           <li className="flex items-start">
    //             <span className="text-emerald-500 mr-2">✓</span>
    //             Enhanced user engagement with AI search
    //           </li>
    //           <li className="flex items-start">
    //             <span className="text-emerald-500 mr-2">✓</span>
    //             Increased conversion with personalization
    //           </li>
    //           <li className="flex items-start">
    //             <span className="text-emerald-500 mr-2">✓</span>
    //             Automated customer support responses
    //           </li>
    //         </ul>
    //       </div>
    //     </div>

    //     {/* Business Impact Section */}
    //     <div className="mb-24">
    //       <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
    //         Business Impact
    //       </h2>
    //       <div className="grid md:grid-cols-2 gap-8">
    //         <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200">
    //           <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
    //             <span className="text-2xl mr-3">💼</span>
    //             For Real Estate Firms & Agents
    //           </h3>
    //           <ul className="space-y-4 text-slate-600">
    //             <li className="flex items-start">
    //               <span className="text-emerald-500 mr-2">✓</span>
    //               Higher lead conversion through AI-driven engagement
    //             </li>
    //             <li className="flex items-start">
    //               <span className="text-emerald-500 mr-2">✓</span>
    //               Reduced operational costs with automation
    //             </li>
    //             <li className="flex items-start">
    //               <span className="text-emerald-500 mr-2">✓</span>
    //               Scalable solutions for broader reach
    //             </li>
    //             <li className="flex items-start">
    //               <span className="text-emerald-500 mr-2">✓</span>
    //               Data-driven insights for decision-making
    //             </li>
    //           </ul>
    //         </div>

    //         <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200">
    //           <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
    //             <span className="text-2xl mr-3">🏡</span>
    //             For Buyers & Renters
    //           </h3>
    //           <ul className="space-y-4 text-slate-600">
    //             <li className="flex items-start">
    //               <span className="text-emerald-500 mr-2">✓</span>
    //               Faster property discovery with intelligent filtering
    //             </li>
    //             <li className="flex items-start">
    //               <span className="text-emerald-500 mr-2">✓</span>
    //               Personalized recommendations based on preferences
    //             </li>
    //             <li className="flex items-start">
    //               <span className="text-emerald-500 mr-2">✓</span>
    //               24/7 availability for seamless property search
    //             </li>
    //             <li className="flex items-start">
    //               <span className="text-emerald-500 mr-2">✓</span>
    //               Localized & multilingual support for inclusivity
    //             </li>
    //           </ul>
    //         </div>
    //       </div>
    //     </div>

    //     {/* CTA Section */}
    //     <div className="text-center">
    //       <h2 className="text-3xl font-bold text-slate-900 mb-6">
    //         Ready to Transform Your Real Estate Experience?
    //       </h2>
    //       <Link
    //         href="/onboarding"
    //         className="inline-block px-8 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
    //       >
    //         Start Now
    //       </Link>
    //     </div>
    //   </div>
    // </div>

    <Landing />
  );
}
