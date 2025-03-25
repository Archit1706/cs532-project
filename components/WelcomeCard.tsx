// components/WelcomeCard.tsx
"use client";

import React from 'react';

const WelcomeCard = () => {
    return (
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-slate-200 text-center">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Welcome to RealEstateAI</h2>
            <p className="text-slate-600 mb-6">
                Ask our assistant about properties, market trends, or neighborhoods by chatting on the left.
                Enter a zip code to see local information.
            </p>
            <div className="flex justify-center">
                <div className="animate-bounce text-5xl">👈</div>
            </div>
        </div>
    );
};

export default WelcomeCard;