import React, { useState, useEffect, useRef } from 'react';
import { FaHome, FaSearch, FaChartLine, FaGlobe, FaComments, FaRobot, FaMapMarkedAlt, FaLanguage, FaUserFriends, FaBriefcase, FaRegBuilding, FaSubway, FaUtensils, FaRegListAlt, FaLinkedin } from 'react-icons/fa';
import { BsStars, BsChatDots, BsGraphUp, BsBuilding, BsFilter } from 'react-icons/bs';
import { TbTransform } from 'react-icons/tb';
import { IoMdArrowRoundForward } from 'react-icons/io';
import { RiTwitterXLine } from "react-icons/ri";
import { IoLogoInstagram } from "react-icons/io5";
import { FaBars, FaTimes, FaSortUp } from 'react-icons/fa';
import {
    ClerkProvider,
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from '@clerk/nextjs'
import Link from 'next/link';

const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="bg-white shadow-md fixed w-full z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left: Logo */}
                    <div className="flex items-center space-x-2">
                        <img src="/realestate-ai-logo.png" alt="Keya Logo" className="h-8 w-8 bg-emerald-300 rounded-lg" />
                        <span className="text-xl font-bold text-emerald-700">Keya</span>
                    </div>

                    {/* Center: Navigation (hidden on mobile) */}
                    <nav className="hidden md:flex space-x-8">
                        <a href="#features" className="text-teal-700 hover:text-emerald-600 font-medium transition-colors">Features</a>
                        <a href="#how-it-works" className="text-teal-700 hover:text-emerald-600 font-medium transition-colors">How It Works</a>
                        <a href="#demo" className="text-teal-700 hover:text-emerald-600 font-medium transition-colors">Demo</a>
                    </nav>

                    {/* Right: Auth buttons (hidden on mobile) */}
                    <div className="hidden md:flex space-x-4">
                        <Link href={"/sign-in"} className="px-4 py-2 text-emerald-700 font-semibold border border-emerald-600 rounded-md hover:bg-emerald-50 transition-colors">
                            Sign In
                        </Link>
                        <Link href={"/sign-up"} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 transition-colors">
                            Sign Up
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-emerald-700 text-xl"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
                    <nav className="flex flex-col px-4 py-4 space-y-3">
                        <a href="#features" className="text-teal-700 hover:text-emerald-600 font-medium transition-colors">Features</a>
                        <a href="#how-it-works" className="text-teal-700 hover:text-emerald-600 font-medium transition-colors">How It Works</a>
                        <a href="#demo" className="text-teal-700 hover:text-emerald-600 font-medium transition-colors">Demo</a>
                        <hr className="border-gray-200 my-2" />

                        <SignedOut>

                            <Link href={"/sign-in"} className="w-full text-left px-4 py-2 text-emerald-700 border border-emerald-600 rounded-md hover:bg-emerald-50 transition-colors">
                                Sign In

                            </Link>
                            <Link href={"/sign-up"} className="w-full text-left px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">
                                Sign Up
                            </Link>
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>

                    </nav>
                </div>
            )}
        </header>
    );
};

const HeroSection = () => {
    // Chat conversation state
    const [chatMessages, setChatMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const chatContainerRef = useRef(null);

    // Predefined conversation flow with property listings
    const conversationFlow = [
        { role: 'user', text: "Hi! I'm looking for a 2-bedroom apartment in Chicago." },
        { role: 'assistant', text: "I can help with that! What's your budget range?" },
        { role: 'user', text: "Around $2,000 per month, and I'd like to be close to public transit." },
        { role: 'assistant', text: "Great! I found 12 properties matching your criteria. Here are the top recommendations..." },
        { role: 'user', text: "Can you show me places with in-unit laundry?" },
        {
            role: 'assistant',
            text: "Absolutely! I've filtered the results. Here are the best properties with in-unit laundry within your budget:",
            showProperties: true
        }
    ];

    // Typing animation effect
    useEffect(() => {
        if (currentIndex < conversationFlow.length) {
            const nextMessage = conversationFlow[currentIndex];
            let charIndex = 0;
            setIsTyping(true);

            // Simulate typing speed
            const typingInterval = setInterval(() => {
                if (charIndex <= nextMessage.text.length) {
                    setCurrentMessage(nextMessage.text.substring(0, charIndex));
                    charIndex++;
                } else {
                    clearInterval(typingInterval);
                    setIsTyping(false);
                    setChatMessages(prev => [...prev, nextMessage]);
                    setCurrentMessage('');

                    // Wait before starting the next message
                    setTimeout(() => {
                        setCurrentIndex(prevIndex => prevIndex + 1);
                    }, 1000);
                }
            }, nextMessage.role === 'user' ? 50 : 30); // Users type slower than the assistant

            return () => clearInterval(typingInterval);
        }
    }, [currentIndex]);

    // Auto-scroll to the bottom of chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages, currentMessage]);

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 to-teal-800 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="pt-10 pb-8 md:pt-16 md:pb-20 lg:pt-24 lg:pb-28 flex flex-col md:flex-row items-center">
                    <div className="md:w-1/2 md:pr-8 mb-10 md:mb-0">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-emerald-100">
                            The Smartest Way to Find Your Next Home
                        </h1>
                        <p className="text-lg md:text-xl text-teal-100 mb-6">
                            AI-powered conversation assistant for real estate inquiries, property searches, and market insights.
                        </p>
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                            <SignedIn>
                                <Link href={"/chat"} className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-md shadow-lg hover:bg-emerald-700 transition-colors">
                                    Chat Now
                                </Link>
                            </SignedIn>
                            <SignedOut>
                                <Link href={"/sign-in"} className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-md shadow-lg hover:bg-emerald-700 transition-colors">
                                    Chat Now
                                </Link>
                            </SignedOut>
                            {/* <Link href="/sign-in" className="px-6 py-3 bg-white text-emerald-900 font-semibold rounded-md shadow-lg hover:bg-emerald-50 transition-colors">
                                 Get Started 
                             </Link> */}
                            <Link href={"#demo"} className="px-6 py-3 border-2 border-white text-white font-semibold rounded-md hover:bg-white/10 transition-colors">
                                See Demo                            </Link>
                        </div>
                    </div>

                    {/* Chat UI */}
                    <div className="md:w-1/2 relative">
                        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                            <div className="bg-emerald-600 text-white p-3 flex items-center space-x-2">
                                <BsChatDots className="text-xl text-white" />
                                <span className="font-medium text-white">Keya Assistant</span>
                            </div>
                            <div className="p-4 bg-gray-50 space-y-3 h-64 overflow-y-auto" ref={chatContainerRef}>
                                {/* Rendered chat messages */}
                                {chatMessages.map((msg, index) => (
                                    <div key={index} className="flex flex-col">
                                        <div className={`flex justify-${msg.role === 'assistant' ? 'end' : 'start'}`}>
                                            <div
                                                className={`${msg.role === 'assistant'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-teal-100 text-emerald-900'
                                                    } rounded-lg p-3 max-w-xs animate-fadeIn`}
                                            >
                                                {msg.text}
                                            </div>
                                        </div>

                                        {/* Property listings */}
                                        {msg.showProperties && (
                                            <div className="mt-2 mb-2 w-full">
                                                <div className="flex overflow-x-auto space-x-2 pb-2 fscrollbar-hide">
                                                    {/* Property 1 */}
                                                    <div className="flex-shrink-0 w-32 rounded-md overflow-hidden border border-gray-200 bg-white shadow-sm">
                                                        <div className="h-20 bg-gray-200 relative">
                                                            <img src="/sample/prop1.jpg" alt="Property" className="w-full h-full object-cover" />
                                                            <div className="absolute bottom-0 left-0 bg-emerald-600 text-white text-xs px-1">$319,900</div>
                                                        </div>
                                                        <div className="p-1">
                                                            <p className="text-xs font-medium text-gray-900 truncate">2309 W 21st St</p>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <span className="text-xs text-gray-500">2 bed</span>
                                                                <span className="text-xs text-gray-500">2 bath</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Property 2 */}
                                                    <div className="flex-shrink-0 w-32 rounded-md overflow-hidden border border-gray-200 bg-white shadow-sm">
                                                        <div className="h-20 bg-gray-200 relative">
                                                            <img src="/sample/prop2.jpg" alt="Property" className="w-full h-full object-cover" />
                                                            <div className="absolute bottom-0 left-0 bg-emerald-600 text-white text-xs px-1">$539,000</div>
                                                        </div>
                                                        <div className="p-1">
                                                            <p className="text-xs font-medium text-gray-900 truncate">2720 W Cermak Rd</p>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <span className="text-xs text-gray-500">6 bed</span>
                                                                <span className="text-xs text-gray-500">3 bath</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Property 3 */}
                                                    <div className="flex-shrink-0 w-32 rounded-md overflow-hidden border border-gray-200 bg-white shadow-sm">
                                                        <div className="h-20 bg-gray-200 relative">
                                                            <img src="/sample/prop3.jpg" alt="Property" className="w-full h-full object-cover" />
                                                            <div className="absolute bottom-0 left-0 bg-emerald-600 text-white text-xs px-1">$415,000</div>
                                                        </div>
                                                        <div className="p-1">
                                                            <p className="text-xs font-medium text-gray-900 truncate">919 W 18th Pl</p>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <span className="text-xs text-gray-500">3 bed</span>
                                                                <span className="text-xs text-gray-500">2 bath</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Property 4 */}
                                                    <div className="flex-shrink-0 w-32 rounded-md overflow-hidden border border-gray-200 bg-white shadow-sm">
                                                        <div className="h-20 bg-gray-200 relative">
                                                            <img src="/sample/prop4.webp" alt="Property" className="w-full h-full object-cover" />
                                                            <div className="absolute bottom-0 left-0 bg-emerald-600 text-white text-xs px-1">$287,000</div>
                                                        </div>
                                                        <div className="p-1">
                                                            <p className="text-xs font-medium text-gray-900 truncate">1125 W Washburne Ave</p>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <span className="text-xs text-gray-500">4 bed</span>
                                                                <span className="text-xs text-gray-500">2 bath</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Currently typing message */}
                                {isTyping && currentIndex < conversationFlow.length && (
                                    <div className={`flex justify-${conversationFlow[currentIndex].role === 'assistant' ? 'end' : 'start'}`}>
                                        <div
                                            className={`${conversationFlow[currentIndex].role === 'assistant'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-teal-100 text-emerald-900'
                                                } rounded-lg p-3 max-w-xs`}
                                        >
                                            {currentMessage}
                                            <span className="inline-block animate-pulse">|</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Field */}
                            <div className="flex border rounded-full overflow-hidden bg-white mt-3 mx-4 mb-4">
                                <input
                                    type="text"
                                    placeholder="Ask me anything about real estate..."
                                    className="flex-grow px-4 py-2 focus:outline-none text-emerald-900"
                                />
                                <button className="bg-emerald-600 text-white px-4 py-2">
                                    <IoMdArrowRoundForward className="text-xl text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wave shape divider */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" className="w-full">
                    <path
                        fill="#ffffff"
                        fillOpacity="1"
                        d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,42.7C672,32,768,32,864,42.7C960,53,1056,75,1152,75C1248,75,1344,53,1392,42.7L1440,32L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"
                    ></path>
                </svg>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
        <div className="w-12 h-12 flex items-center justify-center bg-teal-100 text-emerald-600 rounded-full mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-emerald-800">{title}</h3>
        <p className="text-gray-600">{description}</p>
    </div>
);

const FeaturesSection = () => (
    <div id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-emerald-800 mb-4">
                    Smart Features for Smarter Decisions
                </h2>
                <p className="text-xl text-teal-700 max-w-3xl mx-auto">
                    Our AI-powered platform combines intelligent search with contextual insights to transform your real estate experience.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard
                    icon={<BsChatDots className="text-xl text-emerald-600" />}
                    title="AI-Powered Chat"
                    description="Get instant answers to all your real estate questions with our conversational assistant."
                />
                <FeatureCard
                    icon={<FaHome className="text-xl text-emerald-600" />}
                    title="Smart Property Search"
                    description="Filter listings by zip code, beds, baths, price, and more with natural language."
                />
                <FeatureCard
                    icon={<BsGraphUp className="text-xl text-emerald-600" />}
                    title="Market Insights"
                    description="Access real-time market trends, price ranges, and year-over-year changes."
                />
                <FeatureCard
                    icon={<FaMapMarkedAlt className="text-xl text-emerald-600" />}
                    title="Location Intelligence"
                    description="Discover nearby restaurants, transit options, and amenities for any property."
                />
                <FeatureCard
                    icon={<FaLanguage className="text-xl text-emerald-600" />}
                    title="Multilingual Support"
                    description="Interact with our assistant in multiple languages with our translation service."
                />
                <FeatureCard
                    icon={<BsStars className="text-xl text-emerald-600" />}
                    title="Context-Aware Responses"
                    description="Get personalized recommendations based on your preferences and search history."
                />
            </div>
        </div>
    </div>
);

const TabPanel = ({ children, activeTab, index }: any) => (
    <div className={activeTab === index ? "block" : "hidden"}>
        {children}
    </div>
);

const UseCaseSection = () => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        {
            title: "Property Buyers & Renters",
            icon: <FaUserFriends className="mr-2 text-emerald-600" />,
            content: (
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-2xl font-bold mb-4 text-emerald-800">For Home Seekers</h3>
                    <p className="text-gray-600 mb-6">
                        Whether you're buying your first home or relocating to a new city, our AI assistant streamlines your search process.
                    </p>
                    <ul className="space-y-4 text-emerald-900">
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span>Get tailored property recommendations based on your unique preferences</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span>Ask natural questions about neighborhoods, schools, and market conditions</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span>Compare properties and analyze price trends with visual insights</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span>Explore nearby amenities and commute times from potential homes</span>
                        </li>
                    </ul>
                </div>
            )
        },
        {
            title: "Real Estate Agents",
            icon: <FaBriefcase className="mr-2 text-emerald-600" />,
            content: (
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-2xl font-bold mb-4 text-emerald-800">For Real Estate Professionals</h3>
                    <p className="text-gray-600 mb-6">
                        Focus on building relationships while our platform handles routine inquiries and initial property matches.
                    </p>
                    <ul className="space-y-4 text-emerald-900">
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span>Automate responses to common questions and initial property searches</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span>Qualify leads more effectively with AI-powered conversation analysis</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span>Access real-time market data to provide informed advice to clients</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span>Generate detailed property and neighborhood reports in seconds</span>
                        </li>
                    </ul>
                </div>
            )
        },
        {
            title: "Property Marketplaces",
            icon: <FaRegBuilding className="mr-2 text-emerald-600" />,
            content: (
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-2xl font-bold mb-4 text-emerald-800">For Real Estate Platforms</h3>
                    <p className="text-gray-600 mb-6">
                        Enhance your existing real estate platform with our conversational AI to improve user engagement and conversion.
                    </p>
                    <ul className="space-y-4 text-emerald-900">
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span>Integrate our API to add conversational search capabilities to your platform</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span>Increase user engagement with personalized property recommendations</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span>Reduce bounce rates with intuitive natural language search</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span>Gather valuable insights on user preferences and search patterns</span>
                        </li>
                    </ul>
                </div>
            )
        }
    ];

    return (
        <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-emerald-800 mb-4">Who Benefits from Keya?</h2>
                    <p className="text-xl text-teal-700 max-w-3xl mx-auto">
                        Our platform is designed to help everyone in the real estate ecosystem make better, faster decisions.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center border-b mb-8">
                    {tabs.map((tab, index) => (
                        <button
                            key={index}
                            className={`flex items-center px-6 py-4 font-medium text-lg transition-colors ${activeTab === index
                                ? 'border-b-2 border-emerald-600 text-emerald-600'
                                : 'text-gray-500 hover:text-teal-700'
                                }`}
                            onClick={() => setActiveTab(index)}
                        >
                            {tab.icon}
                            {tab.title}
                        </button>
                    ))}
                </div>

                {tabs.map((tab, index) => (
                    <TabPanel key={index} activeTab={activeTab} index={index}>
                        {tab.content}
                    </TabPanel>
                ))}
            </div>
        </div>
    );
};

const HowItWorksSection = () => (
    <div id='how-it-works' className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-emerald-800 mb-4">How Keya Works</h2>
                <p className="text-xl text-teal-700 max-w-3xl mx-auto">
                    Our sophisticated AI engine translates your natural language queries into actionable insights.
                </p>
            </div>

            <div className="relative">
                {/* Timeline line */}
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-teal-200 -translate-x-1/2 z-0"></div>

                {/* Steps */}
                <div className="space-y-16 relative z-10">
                    {/* Step 1 */}
                    <div className="flex flex-col lg:flex-row items-center gap-6">
                        <div className="lg:w-1/2 text-center lg:text-right">
                            <h3 className="text-2xl font-bold text-emerald-800 mb-3">You Ask a Question</h3>
                            <p className="text-gray-600">Type your question in natural language, like asking a real estate expert.</p>
                        </div>
                        <div className="lg:w-24 flex justify-center">
                            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">1</div>
                        </div>
                        <div className="lg:w-1/2 text-center lg:text-left">
                            <div className="bg-white p-4 rounded-lg shadow-md inline-block text-emerald-900 max-w-full">
                                "I'm looking for a 3-bedroom house under $500,000 in Chicago with good schools nearby."
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col lg:flex-row items-center gap-6">
                        <div className="lg:w-1/2 order-2 lg:order-1 text-center lg:text-right">
                            <div className="bg-white p-4 rounded-lg shadow-md inline-block w-full max-w-md mx-auto">
                                <div className="mb-2 text-sm text-gray-500">Feature Extraction</div>
                                <div className="bg-gray-100 p-3 rounded text-sm font-mono text-left text-emerald-900 leading-relaxed whitespace-pre overflow-x-auto">
                                    <span className="text-teal-600">{"{"}</span>
                                    {"\n    "}
                                    <span className="text-emerald-700">"beds"</span>
                                    <span className="text-gray-500">: </span>
                                    <span className="text-purple-600">3</span>
                                    <span className="text-teal-600">,</span>
                                    {"\n    "}
                                    <span className="text-emerald-700">"propertyType"</span>
                                    <span className="text-gray-500">: </span>
                                    <span className="text-orange-600">"house"</span>
                                    <span className="text-teal-600">,</span>
                                    {"\n    "}
                                    <span className="text-emerald-700">"maxPrice"</span>
                                    <span className="text-gray-500">: </span>
                                    <span className="text-purple-600">500000</span>
                                    <span className="text-teal-600">,</span>
                                    {"\n    "}
                                    <span className="text-emerald-700">"location"</span>
                                    <span className="text-gray-500">: </span>
                                    <span className="text-orange-600">"Chicago"</span>
                                    <span className="text-teal-600">,</span>
                                    {"\n    "}
                                    <span className="text-emerald-700">"nearbyFeature"</span>
                                    <span className="text-gray-500">: </span>
                                    <span className="text-orange-600">"schools"</span>
                                    {"\n"}
                                    <span className="text-teal-600">{"}"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-24 flex justify-center order-1 lg:order-2">
                            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">2</div>
                        </div>
                        <div className="lg:w-1/2 order-3 text-center lg:text-left">
                            <h3 className="text-2xl font-bold text-emerald-800 mb-3">AI Analyzes Your Question</h3>
                            <p className="text-gray-600">
                                Our hybrid LLM + regex system extracts key real estate features from your query.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col lg:flex-row items-center gap-6">
                        <div className="lg:w-1/2 text-center lg:text-right">
                            <h3 className="text-2xl font-bold text-emerald-800 mb-3">We Find Relevant Data</h3>
                            <p className="text-gray-600">
                                The platform queries multiple data sources to find properties and market information.
                            </p>
                        </div>
                        <div className="lg:w-24 flex justify-center">
                            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">3</div>
                        </div>
                        <div className="lg:w-1/2 text-center lg:text-left">
                            <div className="flex justify-center lg:justify-start flex-wrap gap-2">
                                <div className="bg-teal-100 p-3 rounded-lg">
                                    <FaRegListAlt className="text-emerald-600 text-2xl" />
                                </div>
                                <div className="bg-teal-100 p-3 rounded-lg">
                                    <FaChartLine className="text-emerald-600 text-2xl" />
                                </div>
                                <div className="bg-teal-100 p-3 rounded-lg">
                                    <FaMapMarkedAlt className="text-emerald-600 text-2xl" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col lg:flex-row items-center gap-6">
                        <div className="lg:w-1/2 order-2 lg:order-1 text-center lg:text-right">
                            <div className="bg-white p-4 rounded-lg shadow-md inline-block max-w-md w-full mx-auto">
                                <div className="bg-emerald-600 text-white p-3 rounded-lg mb-3">
                                    I found 15 houses in Chicago under $500,000 with 3+ bedrooms near top-rated schools. The average price is $425,000 with most homes in Jefferson Park and North Center. Would you like to see the listings?
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button className="bg-teal-100 text-emerald-800 px-3 py-1 rounded-full text-sm">View listings</button>
                                    <button className="bg-teal-100 text-emerald-800 px-3 py-1 rounded-full text-sm">Show on map</button>
                                    <button className="bg-teal-100 text-emerald-800 px-3 py-1 rounded-full text-sm">School ratings</button>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-24 flex justify-center order-1 lg:order-2">
                            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">4</div>
                        </div>
                        <div className="lg:w-1/2 order-3 text-center lg:text-left">
                            <h3 className="text-2xl font-bold text-emerald-800 mb-3">You Get Smart Answers</h3>
                            <p className="text-gray-600">
                                The AI generates a conversational response with actionable insights and next steps.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const DemoSection = () => (
    <div id='demo' className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-6 text-emerald-300">See Keya in Action</h2>
                    <p className="text-xl text-teal-200 mb-8">
                        Our conversational AI platform makes property search intuitive and informative. Watch how it works.
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <div className="mr-3 text-emerald-400">
                                <FaSearch className="text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-white">Natural Language Search</h3>
                                <p className="text-gray-400">
                                    Search for properties using everyday language rather than complex filters.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="mr-3 text-emerald-400">
                                <BsBuilding className="text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-white">Visual Property Cards</h3>
                                <p className="text-gray-400">
                                    View detailed property information in an easy-to-scan format with key highlights.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="mr-3 text-emerald-400">
                                <FaUtensils className="text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-white">Neighborhood Insights</h3>
                                <p className="text-gray-400">
                                    Discover restaurants, transit options, and local amenities for any property.
                                </p>
                            </div>
                        </div>
                    </div>
                    <button className="mt-8 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-lg transition-colors flex items-center">
                        <span>Start Your Free Trial</span>
                        <IoMdArrowRoundForward className="ml-2 text-xl text-white" />
                    </button>
                </div>
                <div className="relative">
                    <div className="aspect-w-16 aspect-h-9 bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
                        {/* This would be a video or animated GIF in a real implementation */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <button className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                            <div className="p-6">
                                <p className="text-xl font-semibold text-emerald-200">Watch the full demo</p>
                                <p className="text-teal-200">See how Keya transforms property search</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const CTASection = () => (
    <div className="py-16 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Transform Your Real Estate Experience?
            </h2>
            <p className="text-xl text-teal-100 mb-8 max-w-3xl mx-auto">
                Join thousands of agents and home seekers who are already using Keya to make faster, smarter real estate decisions.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <SignedIn>
                    <Link href={"/chat"} className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-md shadow-lg hover:bg-teal-50 transition-colors text-lg">
                        Chat Now
                    </Link>
                </SignedIn>
                <SignedOut>
                    <Link href={"/sign-in"} className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-md shadow-lg hover:bg-teal-50 transition-colors text-lg">
                        Chat Now
                    </Link>
                </SignedOut>
                <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-md hover:bg-white/10 transition-colors text-lg">
                    Schedule a Demo
                </button>
            </div>
            <p className="mt-6 text-teal-100">
                No credit card required. Free for 14 days.
            </p>
        </div>
    </div>
);

const FooterSection = () => (
    <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <div className="flex items-center space-x-2 mb-4">
                        {/* <FaRobot className="text-2xl text-emerald-400" /> */}
                        <img src="/realestate-ai-logo.png" alt="Keya Logo" className="h-8 w-8 bg-emerald-300 rounded-lg" />
                        <span className="text-xl font-bold text-white">Keya</span>
                    </div>
                    <p className="text-gray-400 mb-4">
                        The smarter way to navigate real estate with AI-powered insights.
                    </p>
                    <div className="flex space-x-4">
                        {/* <a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">
                            <RiTwitterXLine className='h-6 w-6' />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">
                            <IoLogoInstagram className='h-6 w-6' />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">
                            <FaLinkedin className='h-6 w-6' />
                        </a> */}
                        <a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">
                            <FaSortUp className='h-6 w-6' />  <span>Scroll to Top</span>
                        </a>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4 text-teal-100">Product</h3>
                    <ul className="space-y-2">
                        <li><a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">Features</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">Pricing</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">API</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">Integrations</a></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4 text-teal-100">Resources</h3>
                    <ul className="space-y-2">
                        <li><a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">Documentation</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">Blog</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">Case Studies</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">Support</a></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4 text-teal-100">Company</h3>
                    <ul className="space-y-2">
                        <li><a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">About</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">Careers</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">Privacy</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-teal-300 transition-colors">Terms</a></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} Keya. All rights reserved.
                </p>
                <div className="mt-4 md:mt-0">
                    <a href="#" className="text-sm text-gray-400 hover:text-teal-300 transition-colors mr-4">
                        Privacy Policy
                    </a>
                    <a href="#" className="text-sm text-gray-400 hover:text-teal-300 transition-colors mr-4">
                        Terms of Service
                    </a>
                    <a href="#" className="text-sm text-gray-400 hover:text-teal-300 transition-colors">
                        Cookie Policy
                    </a>
                </div>
            </div>
        </div>
    </footer>
);

const Landing = () => (
    <div>
        <Header />
        <HeroSection />
        <FeaturesSection />
        <UseCaseSection />
        <HowItWorksSection />
        <DemoSection />
        <CTASection />
        <FooterSection />
    </div>
);

export default Landing;