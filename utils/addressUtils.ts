// utils/addressUtils.ts

/**
 * Extracts the zip code from a US address string
 * @param address The full address string
 * @returns The zip code if found, otherwise null
 */
export function extractZipCode(address: string): string | null {
    // Pattern to match 5-digit US zip code
    const zipRegex = /\b(\d{5})\b/;
    const match = address.match(zipRegex);
    
    return match ? match[1] : null;
  }
  
  /**
   * Extracts the city and state from a US address
   * @param address The full address string
   * @returns An object with city and state, or null values if not found
   */
  export function extractCityState(address: string): { city: string | null, state: string | null } {
    // Common pattern for US addresses: "City, STATE zip"
    const cityStateRegex = /([^,]+),\s*([A-Z]{2})\s*\d{5}/i;
    const match = address.match(cityStateRegex);
    
    return {
      city: match ? match[1].trim() : null,
      state: match ? match[2].toUpperCase() : null
    };
  }
  
  /**
   * Creates a Google Maps URL for the given address
   * @param address The full address string
   * @returns A Google Maps URL for the address
   */
  export function createGoogleMapsUrl(address: string): string {
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  }
  
  /**
   * Gets coordinates for an address using the browser's Geocoding API
   * @param address The full address string
   * @returns Promise that resolves to coordinates or null if geocoding fails
   */
  export async function getCoordinates(address: string): Promise<{ lat: number, lng: number } | null> {
    // Check if the Geocoding API is available in this browser
    if (!('google' in window && 'maps' in (window as any).google)) {
      console.error('Google Maps API not loaded');
      return null;
    }
    
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          console.error("Geocode was not successful: " + status);
          resolve(null);
        }
      });
    });
  }