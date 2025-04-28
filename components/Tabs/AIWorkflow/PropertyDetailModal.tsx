// components/Tabs/AIWorkflow/PropertyDetailModal.tsx
import React, { useState } from 'react';
import { Property } from 'types/chat';
import Link from 'next/link';
import { 
  FaHome, 
  FaBed, 
  FaBath, 
  FaRulerCombined, 
  FaCalendarAlt
} from 'react-icons/fa';
import { MdChat, MdInfo, MdClose, MdLocationCity } from 'react-icons/md';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
  propertyDetails?: any;
}

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ property, onClose, propertyDetails }) => {
  const [showChatInfo, setShowChatInfo] = useState(true);
  
  // Don't fetch property details, just use what we have
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Property Details</h2>
          <button onClick={onClose} className="text-slate-700 hover:text-slate-900">
            <MdClose size={24} />
          </button>
        </div>

        {/* First row: Property image and details */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Property Image with Price Tag */}
          <div className="md:w-1/2 relative">
            <div className="h-64 md:h-80 overflow-hidden rounded-lg border border-slate-200">
              <img
                src={property.imgSrc || "https://via.placeholder.com/800x400?text=No+Image"}
                alt={property.address}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/800x400?text=No+Image";
                }}
              />
            </div>
            <div className="absolute top-4 right-4 bg-emerald-600 text-white py-2 px-4 rounded-lg shadow-lg">
              <span className="text-xl font-bold">${typeof property.price === 'number' ? property.price.toLocaleString() : property.price}</span>
            </div>
          </div>

          {/* Property Details */}
          <div className="md:w-1/2">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{property.address}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 p-3 rounded-lg flex items-center">
                <FaBed className="text-emerald-600 mr-3 text-xl" />
                <div>
                  <div className="text-sm text-slate-900 font-medium">Beds</div>
                  <div className="text-lg font-bold text-slate-900">{property.beds}</div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg flex items-center">
                <FaBath className="text-emerald-600 mr-3 text-xl" />
                <div>
                  <div className="text-sm text-slate-900 font-medium">Baths</div>
                  <div className="text-lg font-bold text-slate-900">{property.baths}</div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg flex items-center">
                <FaRulerCombined className="text-emerald-600 mr-3 text-xl" />
                <div>
                  <div className="text-sm text-slate-900 font-medium">Square Feet</div>
                  <div className="text-lg font-bold text-slate-900">
                    {typeof property.sqft === 'number' ? property.sqft.toLocaleString() : property.sqft}
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg flex items-center">
                <FaHome className="text-emerald-600 mr-3 text-xl" />
                <div>
                  <div className="text-sm text-slate-900 font-medium">Type</div>
                  <div className="text-lg font-bold text-slate-900">{property.type}</div>
                </div>
              </div>
            </div>
            
            <div className="text-slate-900 font-medium mb-4">
              <MdLocationCity className="inline-block mr-2 text-emerald-600" />
              {property.address.split(',').slice(1).join(',')}
            </div>
          </div>
        </div>

        {/* Second row: Chat button and map side by side */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Chat button section */}
          <div className="md:w-1/2">
            <div className="relative mb-6">
              {showChatInfo && (
                <div className="bg-white p-4 rounded-lg shadow-lg border border-teal-200 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-teal-700">Chat with This Property</h3>
                    <button 
                      onClick={() => setShowChatInfo(false)}
                      className="text-slate-600 hover:text-slate-800"
                    >
                      <MdClose />
                    </button>
                  </div>
                  <p className="text-slate-900 text-sm mb-2">
                    Start a conversation about this property to:
                  </p>
                  <ul className="text-sm text-slate-900 mb-3 list-disc pl-5">
                    <li>Get detailed property information</li>
                    <li>See historical price data</li>
                    <li>Access comparative market analysis</li>
                    <li>Learn about the neighborhood</li>
                    <li>Explore financing options</li>
                  </ul>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Link href={`/chat?propertyId=${property.zpid}`} className="flex-1" target="_blank">
                  <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md w-full justify-center">
                    <MdChat className="h-5 w-5" />
                    Chat with this property
                  </button>
                </Link>
                <button 
                  onClick={() => setShowChatInfo(!showChatInfo)}
                  className="bg-teal-100 text-teal-600 p-2 rounded-md hover:bg-teal-200"
                  title="Learn about chat features"
                >
                  <MdInfo className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Map view */}
          <div className="md:w-1/2">
            <div className="h-56 rounded-lg overflow-hidden border border-slate-200">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(property.address)}`}
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailModal;