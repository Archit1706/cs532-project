// components/PropertyRoutesMap.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Property } from 'types/chat';
import { FaCar, FaWalking, FaBus, FaBicycle, FaSearch, FaPlus, FaTimes, FaChevronLeft, FaChevronRight, FaDirections } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';

// Declare global initMap function
declare global {
  interface Window {
    initMap?: () => void;
  }
}

// Travel mode types
enum TravelMode {
  DRIVING = "DRIVING",
  TRANSIT = "TRANSIT", 
  BICYCLING = "BICYCLING",
  WALKING = "WALKING"
}

// Destination interface
interface Destination {
  name: string;
  placeId: string;
  label: string;
  travelMode: TravelMode;
  distance?: string;
  duration?: string;
  url?: string;
  active?: boolean;
}

interface PropertyRoutesMapProps {
  property: Property;
}

const PropertyRoutesMap: React.FC<PropertyRoutesMapProps> = ({ property }) => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeDestinationIndex, setActiveDestinationIndex] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [modalDestination, setModalDestination] = useState<string>('');
  const [selectedTravelMode, setSelectedTravelMode] = useState<TravelMode>(TravelMode.DRIVING);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const destinationContainerRef = useRef<HTMLDivElement>(null);

  const originAddress = property.address;
  //const apiKey = "";
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  const markerLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  useEffect(() => {
    // Initialize Google Maps when component mounts
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    console.log(`Google Maps API Key: ${apiKey}`);
    script.async = true;
    script.defer = true;
    
    window.initMap = () => {
      if (mapRef.current) {
        // Initialize map
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: { lat: property.latitude || 41.8781, lng: property.longitude || -87.6298 },
          zoom: 14,
          mapTypeControl: false
        });
        
        // Initialize directions service
        directionsService.current = new google.maps.DirectionsService();
        directionsRenderer.current = new google.maps.DirectionsRenderer({
          map: mapInstance.current,
          suppressMarkers: true
        });
        
        // Add marker for property location
        new google.maps.Marker({
          position: { lat: property.latitude || 41.8781, lng: property.longitude || -87.6298 },
          map: mapInstance.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2
          },
          zIndex: 1
        });
      }
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Clean up script and global callback
      document.head.removeChild(script);
      delete window.initMap;
      
      // Clear markers
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
      }
    };
  }, [property]);

  useEffect(() => {
    // Initialize autocomplete when modal is shown
    if (showModal && window.google && window.google.maps) {
      if (destinationInputRef.current) {
        autocompleteRef.current = new google.maps.places.Autocomplete(destinationInputRef.current, {
          types: ['establishment', 'geocode'],
          fields: ['place_id', 'geometry', 'name']
        });
        
        // Set bias to current map bounds
        if (mapInstance.current) {
          const bounds = mapInstance.current.getBounds();
          if (bounds) {
            autocompleteRef.current.setBounds(bounds);
          }
        }
        
        // Focus input
        destinationInputRef.current.focus();
      }
    }
  }, [showModal]);

  const handleAddDestination = () => {
    setIsEditMode(false);
    setModalDestination('');
    setSelectedTravelMode(TravelMode.DRIVING);
    setErrorMessage('');
    setShowModal(true);
  };

  const handleEditDestination = (index: number) => {
    setIsEditMode(true);
    setModalDestination(destinations[index].name);
    setSelectedTravelMode(destinations[index].travelMode);
    setErrorMessage('');
    setActiveDestinationIndex(index);
    setShowModal(true);
  };

  const handleDeleteDestination = () => {
    if (activeDestinationIndex !== null) {
      const newDestinations = [...destinations];
      newDestinations.splice(activeDestinationIndex, 1);
      setDestinations(newDestinations);
      setShowModal(false);
      
      // Clear route for the deleted destination
      if (directionsRenderer.current) {
        directionsRenderer.current.setMap(null);
      }
      
      // Remove marker
      if (markersRef.current[activeDestinationIndex]) {
        markersRef.current[activeDestinationIndex].setMap(null);
        markersRef.current.splice(activeDestinationIndex, 1);
      }
    }
  };

  const handleModalSubmit = () => {
    if (!autocompleteRef.current) return;
    
    const place = autocompleteRef.current.getPlace();
    if (!place || !place.geometry || !place.geometry.location) {
      setErrorMessage('Please select a valid location');
      return;
    }
    
    if (destinations.length >= 10 && !isEditMode) {
      setErrorMessage('Maximum 10 destinations allowed');
      return;
    }
    
    // Check for duplicate destinations
    if (!isEditMode && destinations.some(dest => dest.placeId === place.place_id)) {
      setErrorMessage('Destination already added');
      return;
    }
    
    const getDirections = (destination: Destination) => {
      if (!directionsService.current || !mapInstance.current) return;
      
      const request = {
        origin: originAddress,
        destination: { placeId: destination.placeId },
        travelMode: google.maps.TravelMode[destination.travelMode as keyof typeof google.maps.TravelMode],
        unitSystem: google.maps.UnitSystem.IMPERIAL
      };
      
      directionsService.current.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          // Update destination with distance and duration
          const route = result.routes[0];
          const leg = route.legs[0];
          
          const updatedDestinations = [...destinations];
          
          // Use existing index for edit mode, or add new destination
          const destIndex = isEditMode && activeDestinationIndex !== null ? 
            activeDestinationIndex : updatedDestinations.length;
          
          // Update destination details
          const updatedDestination = {
            ...destination,
            distance: leg.distance?.text || '',
            duration: leg.duration?.text || ''
          };
          
          if (isEditMode && activeDestinationIndex !== null) {
            updatedDestinations[activeDestinationIndex] = updatedDestination;
          } else {
            updatedDestinations.push(updatedDestination);
          }
          
          setDestinations(updatedDestinations);
          
          // Add or update marker
          if (markersRef.current[destIndex]) {
            markersRef.current[destIndex].setMap(null);
          }
          
          const marker = new google.maps.Marker({
            position: leg.end_location,
            map: mapInstance.current,
            label: { 
              text: destination.label,
              color: '#FFFFFF',
              fontWeight: 'bold'
            },
            icon: {
              path: 'M10 27c-.2 0-.2 0-.5-1-.3-.8-.7-2-1.6-3.5-1-1.5-2-2.7-3-3.8-2.2-2.8-3.9-5-3.9-8.8C1 4.9 5 1 10 1s9 4 9 8.9c0 3.9-1.8 6-4 8.8-1 1.2-1.9 2.4-2.8 3.8-1 1.5-1.4 2.7-1.6 3.5-.3 1-.4 1-.6 1Z',
              fillColor: '#EA4335',
              fillOpacity: 1,
              strokeColor: '#C5221F',
              strokeWeight: 1,
              scale: 1.2,
              anchor: new google.maps.Point(15, 29),
              labelOrigin: new google.maps.Point(10, 9)
            }
          });
          
          if (isEditMode && activeDestinationIndex !== null) {
            markersRef.current[activeDestinationIndex] = marker;
          } else {
            markersRef.current.push(marker);
          }
          
          // Display route
          if (directionsRenderer.current) {
            directionsRenderer.current.setDirections(result);
            directionsRenderer.current.setMap(mapInstance.current);
          }
          
          // Set this destination as active
          handleDestinationClick(isEditMode && activeDestinationIndex !== null ? 
            activeDestinationIndex : updatedDestinations.length - 1);
        }
      });
    };
    
    // Create new destination
    const newDestination: Destination = {
      name: place.name || modalDestination,
      placeId: place.place_id || '',
      label: isEditMode && activeDestinationIndex !== null ? 
        destinations[activeDestinationIndex].label : 
        markerLabels[destinations.length % markerLabels.length],
      travelMode: selectedTravelMode,
      url: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddress)}&destination=${encodeURIComponent(place.name || modalDestination)}&destination_place_id=${place.place_id}&travelmode=${selectedTravelMode.toLowerCase()}`
    };
    
    // Get directions for the destination
    getDirections(newDestination);
    
    // Close modal
    setShowModal(false);
  };

  const handleDestinationClick = (index: number) => {
    if (!directionsService.current || !mapInstance.current) return;
    
    // Update active destination
    setActiveDestinationIndex(index);
    
    const destination = destinations[index];
    
    // Show route for selected destination
    const request = {
      origin: originAddress,
      destination: { placeId: destination.placeId },
      travelMode: google.maps.TravelMode[destination.travelMode as keyof typeof google.maps.TravelMode]
    };
    
    directionsService.current.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result && directionsRenderer.current) {
        directionsRenderer.current.setDirections(result);
        directionsRenderer.current.setMap(mapInstance.current);
        
        // Fit bounds to show the entire route
        if (mapInstance.current && result.routes[0].bounds) {
          mapInstance.current.fitBounds(result.routes[0].bounds);
        }
      }
    });
    
    // Update markers appearance
    markersRef.current.forEach((marker, i) => {
      const isActive = i === index;
      marker.setIcon({
        path: 'M10 27c-.2 0-.2 0-.5-1-.3-.8-.7-2-1.6-3.5-1-1.5-2-2.7-3-3.8-2.2-2.8-3.9-5-3.9-8.8C1 4.9 5 1 10 1s9 4 9 8.9c0 3.9-1.8 6-4 8.8-1 1.2-1.9 2.4-2.8 3.8-1 1.5-1.4 2.7-1.6 3.5-.3 1-.4 1-.6 1Z',
        fillColor: isActive ? '#EA4335' : '#F1F3F4',
        fillOpacity: 1,
        strokeColor: isActive ? '#C5221F' : '#9AA0A6',
        strokeWeight: 1,
        scale: 1.2,
        anchor: new google.maps.Point(15, 29),
        labelOrigin: new google.maps.Point(10, 9)
      });
      marker.setLabel({
        text: destinations[i].label,
        color: isActive ? '#FFFFFF' : '#3C4043',
        fontWeight: 'bold'
      });
    });
  };

  const searchNearby = (searchTerm: string) => {
    const url = `https://www.google.com/maps/search/${searchTerm}+near+${encodeURIComponent(originAddress)}`;
    window.open(url, '_blank');
  };

  const handleScroll = (direction: number) => {
    if (destinationContainerRef.current) {
      const scrollAmount = direction * 250; // Adjust scroll amount as needed
      destinationContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full">
      {/* Map Container */}
      <div className="w-full h-80 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 mb-3">
        <div ref={mapRef} className="w-full h-full"></div>
      </div>
      
      {/* Destination Panel */}
      {destinations.length > 0 ? (
        <div className="mb-4 relative">
          <div 
            ref={destinationContainerRef}
            className="flex overflow-x-auto pb-2 hide-scrollbar" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex">
              {destinations.map((destination, index) => (
                <div 
                  key={index} 
                  className={`relative flex-shrink-0 mr-3 p-3 rounded-lg border ${index === activeDestinationIndex ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'} cursor-pointer`}
                  style={{ minWidth: '250px' }}
                  onClick={() => handleDestinationClick(index)}
                >
                  <div className="flex items-center mb-2">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full ${index === activeDestinationIndex ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-700'} font-bold mr-2`}>
                      {destination.label}
                    </span>
                    <span className="font-medium text-slate-800 truncate" title={destination.name}>
                      {destination.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-slate-600 text-sm mb-1">
                    {destination.travelMode === TravelMode.DRIVING && <FaCar className="mr-1" />}
                    {destination.travelMode === TravelMode.WALKING && <FaWalking className="mr-1" />}
                    {destination.travelMode === TravelMode.TRANSIT && <FaBus className="mr-1" />}
                    {destination.travelMode === TravelMode.BICYCLING && <FaBicycle className="mr-1" />}
                    <span>{destination.distance}</span>
                  </div>
                  
                  <div className="text-xl font-bold text-slate-800">
                    {destination.duration}
                  </div>
                  
                  <div className="absolute top-3 right-3 flex">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDestination(index);
                      }}
                      className="p-1 text-slate-500 hover:text-teal-600"
                    >
                      <MdEdit size={16} />
                    </button>
                    <a 
                      href={destination.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-slate-500 hover:text-teal-600 ml-1"
                    >
                      <FaDirections size={16} />
                    </a>
                  </div>
                </div>
              ))}
              
              {/* Add Destination Button */}
              <div 
                className="flex-shrink-0 flex flex-col items-center justify-center h-32 px-4 py-6 bg-teal-50 text-teal-700 rounded-lg border border-teal-200 cursor-pointer mr-3"
                style={{ minWidth: '150px' }}
                onClick={handleAddDestination}
              >
                <FaPlus className="mb-2" size={20} />
                <span className="text-sm font-medium">Add destination</span>
              </div>
            </div>
          </div>
          
          {/* Scroll controls */}
          <button 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md border border-slate-200 hover:bg-slate-50"
            onClick={() => handleScroll(-1)}
          >
            <FaChevronLeft className="text-slate-500" />
          </button>
          <button 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md border border-slate-200 hover:bg-slate-50"
            onClick={() => handleScroll(1)}
          >
            <FaChevronRight className="text-slate-500" />
          </button>
        </div>
      ) : (
        <div className="flex items-center p-4 mb-4 bg-teal-50 border border-teal-200 rounded-lg text-teal-700">
          <div className="mr-4">
            <FaDirections size={32} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Estimate commute time</h3>
            <p className="text-sm">See travel time and directions to important places from this property</p>
          </div>
          <button 
            onClick={handleAddDestination}
            className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md"
          >
            <FaPlus className="mr-2" size={14} />
            Add destination
          </button>
        </div>
      )}
      
      {/* Nearby Places Buttons */}
      <div className="text-sm text-slate-600">
        <p>Search for nearby places:</p>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <button 
            onClick={() => searchNearby("restaurants")}
            className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-200 text-xs font-medium hover:bg-teal-100"
          >
            Restaurants
          </button>
          <button
            onClick={() => searchNearby("schools")}
            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 text-xs font-medium hover:bg-blue-100"
          >
            Schools
          </button>
          <button
            onClick={() => searchNearby("parks")}
            className="px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium hover:bg-green-100"
          >
            Parks
          </button>
          <button
            onClick={() => searchNearby("grocery stores")}
            className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 text-xs font-medium hover:bg-amber-100"
          >
            Grocery
          </button>
          <button
            onClick={() => searchNearby("transit")}
            className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 text-xs font-medium hover:bg-purple-100"
          >
            Transit
          </button>
          <button
            onClick={() => searchNearby("shopping")}
            className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full border border-pink-200 text-xs font-medium hover:bg-pink-100"
          >
            Shopping
          </button>
          <button
            onClick={() => searchNearby("hospitals")}
            className="px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-200 text-xs font-medium hover:bg-red-100"
          >
            Hospitals
          </button>
        </div>
      </div>
      
      {/* Custom Search Input */}
      <div className="mt-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for other places nearby..."
            className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                searchNearby(target.value);
                target.value = '';
              }
            }}
          />
          <button 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-teal-600"
            onClick={() => {
              const input = document.querySelector('input[placeholder="Search for other places nearby..."]') as HTMLInputElement;
              if (input && input.value) {
                searchNearby(input.value);
                input.value = '';
              }
            }}
          >
            <FaSearch />
          </button>
        </div>
      </div>
      
      {/* Modal for adding/editing destinations */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              {isEditMode ? 'Edit destination' : 'Add destination'}
            </h2>
            
            <input
              ref={destinationInputRef}
              type="text"
              placeholder="Enter a place or address"
              defaultValue={modalDestination}
              className={`w-full p-2 border rounded-md mb-2 ${errorMessage ? 'border-red-500' : 'border-slate-300'}`}
            />
            
            {errorMessage && (
              <p className="text-red-500 text-sm mb-2">{errorMessage}</p>
            )}
            
            <div className="flex border border-slate-300 rounded-md overflow-hidden mb-4">
              <button
                className={`flex-1 py-2 flex justify-center items-center ${selectedTravelMode === TravelMode.DRIVING ? 'bg-teal-50 text-teal-700' : 'text-slate-600'}`}
                onClick={() => setSelectedTravelMode(TravelMode.DRIVING)}
              >
                <FaCar />
              </button>
              <button
                className={`flex-1 py-2 flex justify-center items-center ${selectedTravelMode === TravelMode.TRANSIT ? 'bg-teal-50 text-teal-700' : 'text-slate-600'}`}
                onClick={() => setSelectedTravelMode(TravelMode.TRANSIT)}
              >
                <FaBus />
              </button>
              <button
                className={`flex-1 py-2 flex justify-center items-center ${selectedTravelMode === TravelMode.BICYCLING ? 'bg-teal-50 text-teal-700' : 'text-slate-600'}`}
                onClick={() => setSelectedTravelMode(TravelMode.BICYCLING)}
              >
                <FaBicycle />
              </button>
              <button
                className={`flex-1 py-2 flex justify-center items-center ${selectedTravelMode === TravelMode.WALKING ? 'bg-teal-50 text-teal-700' : 'text-slate-600'}`}
                onClick={() => setSelectedTravelMode(TravelMode.WALKING)}
              >
                <FaWalking />
              </button>
            </div>
            
            <div className="flex justify-between">
              {isEditMode && (
                <button
                  onClick={handleDeleteDestination}
                  className="px-3 py-1 text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              )}
              
              <div className="ml-auto">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1 text-slate-600 hover:text-slate-800 mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSubmit}
                  className="px-4 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md"
                >
                  {isEditMode ? 'Save' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default PropertyRoutesMap;