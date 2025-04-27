// components/Tabs/AIWorkflow/PropertySearchResults.tsx
"use client";

import React, { useState } from 'react';
import { Property, FeatureExtraction } from 'types/chat';
import { FaFilter, FaFilePdf, FaFileDownload, FaSearch, FaSlidersH, FaTimes, FaSort, FaSortAmountDown, FaSortAmountUp, FaExclamationTriangle } from 'react-icons/fa';
import { FaChartLine, FaBed, FaBath, FaRulerCombined, FaHouseUser } from 'react-icons/fa';
import { MdFilterAlt, MdFilterAltOff, MdOutlineFilterAlt } from 'react-icons/md';
import { useChatContext } from 'context/ChatContext';

interface PropertyFilter {
  bedrooms?: number | [number, number];
  bathrooms?: number | [number, number];
  priceRange?: [number, number];
  propertyType?: string;
  amenities?: string[];
}

interface PropertySearchResultsProps {
  properties: Property[];
  filters: PropertyFilter;
  features: FeatureExtraction | null;
  zipCode: string;
  query: string;
  onExport: (format: 'json' | 'pdf') => void;
}

const PropertySearchResults: React.FC<PropertySearchResultsProps> = ({
  properties,
  filters,
  features,
  zipCode,
  query,
  onExport
}) => {
  const { setSelectedProperty } = useChatContext();
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'price_asc' | 'price_desc' | null>(
    features?.sortBy as 'price_asc' | 'price_desc' | null
  );

  // Format price display
  const formatPrice = (price: number | string): string => {
    if (typeof price === 'string') {
      // Extract numeric value if it's a string like "$450,000"
      const numericValue = price.replace(/[^0-9]/g, '');
      return `$${parseInt(numericValue).toLocaleString()}`;
    }
    return `$${price.toLocaleString()}`;
  };

  // Format filter display
  const formatFilterDisplay = (filter: PropertyFilter) => {
    const filterStrings = [];
    
    if (filter.bedrooms) {
      if (Array.isArray(filter.bedrooms)) {
        filterStrings.push(`${filter.bedrooms[0]}-${filter.bedrooms[1]} bedrooms`);
      } else {
        filterStrings.push(`${filter.bedrooms}+ bedrooms`);
      }
    }
    
    if (filter.bathrooms) {
      if (Array.isArray(filter.bathrooms)) {
        filterStrings.push(`${filter.bathrooms[0]}-${filter.bathrooms[1]} bathrooms`);
      } else {
        filterStrings.push(`${filter.bathrooms}+ bathrooms`);
      }
    }
    
    if (filter.priceRange) {
      filterStrings.push(`$${filter.priceRange[0].toLocaleString()} - $${filter.priceRange[1].toLocaleString()}`);
    }
    
    if (filter.propertyType) {
      filterStrings.push(`Type: ${filter.propertyType}`);
    }
    
    if (filter.amenities && filter.amenities.length > 0) {
      filterStrings.push(`Amenities: ${filter.amenities.join(', ')}`);
    }
    
    return filterStrings;
  };

  // Handle sorting
  const handleSort = (order: 'price_asc' | 'price_desc') => {
    setSortOrder(order);
  };

  // Get sorted properties
  const getSortedProperties = () => {
    if (!sortOrder) return properties;
    
    return [...properties].sort((a, b) => {
      const priceA = typeof a.price === 'string' ? parseInt(a.price.replace(/[^0-9]/g, '')) : a.price;
      const priceB = typeof b.price === 'string' ? parseInt(b.price.replace(/[^0-9]/g, '')) : b.price;
      
      return sortOrder === 'price_asc' ? priceA - priceB : priceB - priceA;
    });
  };

  const displayProperties = getSortedProperties();
  const filterDisplay = formatFilterDisplay(filters);

  return (
    <div className="p-6 bg-gradient-to-b from-blue-50 to-white rounded-xl shadow-sm animate-fadeIn">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <FaSearch className="text-blue-600 mr-3 text-xl" />
            <h2 className="text-xl font-semibold text-slate-800">Property Search Results</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center"
            >
              {showFilters ? <MdFilterAltOff className="mr-1" /> : <MdOutlineFilterAlt className="mr-1" />}
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={() => onExport('json')}
              title="Export as JSON"
              className="p-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              <FaFileDownload />
            </button>
            <button
              onClick={() => onExport('pdf')}
              title="Export as PDF"
              className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaFilePdf />
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
          <p className="text-slate-700 mb-1">
            <span className="font-semibold">Query:</span> "{query}"
          </p>
          <p className="text-slate-700 mb-2">
            <span className="font-semibold">Location:</span> ZIP Code {zipCode}
          </p>
          
          {filterDisplay.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-slate-700 font-medium">Filters:</span>
              {filterDisplay.map((filter, index) => (
                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm">
                  {filter}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {showFilters && (
        <div className="mb-6 bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-slate-800">Filter & Sort Properties</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-slate-500 hover:text-slate-700"
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sort by Price</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSort('price_asc')}
                  className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center text-sm ${
                    sortOrder === 'price_asc' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FaSortAmountUp className="mr-1" /> Low to High
                </button>
                <button
                  onClick={() => handleSort('price_desc')}
                  className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center text-sm ${
                    sortOrder === 'price_desc' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FaSortAmountDown className="mr-1" /> High to Low
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bedrooms</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(beds => (
                  <button
                    key={beds}
                    className={`flex-1 py-2 rounded-md text-sm font-medium ${
                      filters.bedrooms === beds || 
                      (Array.isArray(filters.bedrooms) && filters.bedrooms[0] <= beds && filters.bedrooms[1] >= beds)
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {beds}+
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bathrooms</label>
              <div className="flex gap-2">
                {[1, 1.5, 2, 3].map(baths => (
                  <button
                    key={baths}
                    className={`flex-1 py-2 rounded-md text-sm font-medium ${
                      filters.bathrooms === baths || 
                      (Array.isArray(filters.bathrooms) && filters.bathrooms[0] <= baths && filters.bathrooms[1] >= baths)
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {baths}+
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Property Type</label>
              <div className="flex gap-2">
                {['House', 'Condo', 'Townhouse', 'Apartment'].map(type => (
                  <button
                    key={type}
                    className={`flex-1 py-2 rounded-md text-sm font-medium ${
                      filters.propertyType?.toLowerCase() === type.toLowerCase()
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price Range</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-slate-500">$</span>
                  <input
                    type="text"
                    className="w-full pl-7 pr-3 py-1.5 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Min"
                    defaultValue={filters.priceRange ? filters.priceRange[0].toLocaleString() : ''}
                    readOnly
                  />
                </div>
                <span className="text-slate-500">to</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-slate-500">$</span>
                  <input
                    type="text"
                    className="w-full pl-7 pr-3 py-1.5 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Max"
                    defaultValue={filters.priceRange ? filters.priceRange[1].toLocaleString() : ''}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property Results */}
      <div className="space-y-4">
        {displayProperties.length > 0 ? (
          <>
            <div className="bg-white p-3 border-b border-slate-200 rounded-t-lg shadow-sm flex justify-between items-center">
              <span className="font-medium text-slate-700">
                Found {displayProperties.length} properties matching your criteria
              </span>
              <div className="flex items-center text-sm text-slate-500">
                <FaSort className="mr-1" />
                Sort: 
                <button
                  onClick={() => handleSort('price_asc')}
                  className={`ml-2 ${sortOrder === 'price_asc' ? 'text-blue-600 font-medium' : ''}`}
                >
                  Price ↑
                </button>
                <span className="mx-1">|</span>
                <button
                  onClick={() => handleSort('price_desc')}
                  className={`ml-2 ${sortOrder === 'price_desc' ? 'text-blue-600 font-medium' : ''}`}
                >
                  Price ↓
                </button>
              </div>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayProperties.map((property, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedProperty(property)}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={property.imgSrc || "https://via.placeholder.com/400x300?text=No+Image"}
                      alt={property.address}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/400x300?text=No+Image";
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <div className="font-semibold text-lg text-slate-800 mb-1">
                      {formatPrice(property.price)}
                    </div>
                    <div className="text-sm text-slate-600 mb-3 line-clamp-2">{property.address}</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        <FaBed className="mr-1" /> {property.beds}
                      </span>
                      <span className="flex items-center text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        <FaBath className="mr-1" /> {property.baths}
                      </span>
                      <span className="flex items-center text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        <FaRulerCombined className="mr-1" /> {typeof property.sqft === 'number' ? property.sqft.toLocaleString() : property.sqft}
                      </span>
                      <span className="flex items-center text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        <FaHouseUser className="mr-1" /> {property.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm text-center">
            <FaExclamationTriangle className="text-amber-500 text-4xl mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No properties found</h3>
            <p className="text-slate-600 mb-4">
              No properties match your search criteria. Try adjusting your filters for more results.
            </p>
            <div className="inline-flex items-center justify-center">
              <FaChartLine className="text-blue-600 mr-2" />
              <span className="text-blue-600">
                Try checking market trends for this area instead
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertySearchResults;