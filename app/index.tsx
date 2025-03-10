"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const Onboarding = () => {
    const router = useRouter();
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
    const [language, setLanguage] = useState<string | null>(null);
    const [userType, setUserType] = useState<string | null>(null);

    const handleLanguageContinue = () => {
        if (selectedLanguage) {
            setLanguage(selectedLanguage);
        }
    };

    const handleContinue = () => {
        if (language && userType) {
            // You can store these preferences if needed
            router.push('/chat');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
            {/* Language Selection */}
            {!language && (
                <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-slate-200">
                    <h1 className="text-3xl font-semibold text-slate-800 mb-3">Welcome</h1>
                    <p className="text-slate-600 mb-8">
                        I can help you find or sell properties in multiple languages. Choose your preferred language to continue.
                    </p>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <button
                            onClick={() => setSelectedLanguage('English')}
                            className={`px-6 py-3 bg-white border rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm ${selectedLanguage === 'English'
                                ? 'border-slate-400 ring-2 ring-slate-200 text-slate-900'
                                : 'border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => setSelectedLanguage('Español')}
                            className={`px-6 py-3 bg-white border rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm ${selectedLanguage === 'Español'
                                ? 'border-slate-400 ring-2 ring-slate-200 text-slate-900'
                                : 'border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            Español
                        </button>
                        <button
                            onClick={() => setSelectedLanguage('Français')}
                            className={`px-6 py-3 bg-white border rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm ${selectedLanguage === 'Français'
                                ? 'border-slate-400 ring-2 ring-slate-200 text-slate-900'
                                : 'border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            Français
                        </button>
                    </div>
                    <button
                        onClick={handleLanguageContinue}
                        disabled={!selectedLanguage}
                        className="inline-block px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                        Continue
                    </button>
                </div>
            )}

            {/* User Type Selection */}
            {language && (
                <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-slate-200">
                    <h1 className="text-3xl font-semibold text-slate-800 mb-6">What best describes you?</h1>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {['buyer', 'seller', 'investor', 'renter'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setUserType(type)}
                                className={`flex flex-col items-center p-6 bg-white rounded-xl hover:bg-slate-50 transition-all duration-200 border ${userType === type
                                    ? 'border-slate-400 ring-2 ring-slate-200'
                                    : 'border-slate-200'
                                    } group`}
                            >
                                <span className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">
                                    {type === 'buyer' ? '🏠' :
                                        type === 'seller' ? '🤝' :
                                            type === 'investor' ? '💼' : '🏘️'}
                                </span>
                                <span className="text-slate-700 font-medium capitalize">{type}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => setUserType('agent')}
                            className={`flex flex-col items-center p-6 bg-white rounded-xl hover:bg-slate-50 transition-all duration-200 border ${userType === 'agent'
                                ? 'border-slate-400 ring-2 ring-slate-200'
                                : 'border-slate-200'
                                } group col-span-2`}
                        >
                            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">👩‍💼</span>
                            <span className="text-slate-700 font-medium">Agent</span>
                        </button>
                    </div>

                    <button
                        onClick={handleContinue}
                        disabled={!userType}
                        className="inline-block px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                        Continue
                    </button>
                </div>
            )}
        </div>
    );
};

export default Onboarding;
