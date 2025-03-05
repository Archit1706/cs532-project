import React from 'react';

const Footer = () => {
    return (
        <footer className="w-full bg-white/70 backdrop-blur-lg border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl">🏠</span>
                            <span className="font-semibold text-xl text-slate-800">RealEstateAI</span>
                        </div>
                        <p className="text-slate-600">
                            Your AI-powered real estate assistant, helping you make informed decisions.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><a href="/find-homes" className="text-slate-600 hover:text-slate-900">Find Homes</a></li>
                            <li><a href="/market-trends" className="text-slate-600 hover:text-slate-900">Market Trends</a></li>
                            <li><a href="/legal" className="text-slate-600 hover:text-slate-900">Legal Information</a></li>
                            <li><a href="/preferences" className="text-slate-600 hover:text-slate-900">Preferences</a></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-4">Resources</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-slate-600 hover:text-slate-900">Help Center</a></li>
                            <li><a href="#" className="text-slate-600 hover:text-slate-900">Market Reports</a></li>
                            <li><a href="#" className="text-slate-600 hover:text-slate-900">Buying Guide</a></li>
                            <li><a href="#" className="text-slate-600 hover:text-slate-900">Selling Guide</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-4">Contact</h3>
                        <ul className="space-y-2">
                            <li className="text-slate-600">support@realestateai.com</li>
                            <li className="text-slate-600">1-800-REAL-EST</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-slate-600">
                            © 2024 RealEstateAI. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <a href="#" className="text-slate-600 hover:text-slate-900">Privacy Policy</a>
                            <a href="#" className="text-slate-600 hover:text-slate-900">Terms of Service</a>
                            <a href="#" className="text-slate-600 hover:text-slate-900">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;