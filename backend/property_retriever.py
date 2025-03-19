# property_retriever.py
import json
import os
from typing import Dict, List, Any, Optional
import requests
import statistics

class PropertyRetriever:
    """
    A class to retrieve property information.
    This is a placeholder until integrating with Zillow or other real estate APIs.
    """
    
    def __init__(self):
        # Mock database of properties
        self.properties = [
            {
                "id": "prop001",
                "address": "123 Main St, Boston, MA 02108",
                "price": 850000,
                "bedrooms": 3,
                "bathrooms": 2,
                "sqft": 1800,
                "year_built": 2005,
                "property_type": "Single Family",
                "status": "For Sale",
                "description": "Beautiful single family home in the heart of Boston with modern amenities.",
                "features": ["Hardwood floors", "Granite countertops", "Stainless steel appliances", "Backyard"],
                "coordinates": {"latitude": 42.3601, "longitude": -71.0589},
                "market_stats": {
                    "median_price_area": 900000,
                    "price_trend": "+2.5% last month",
                    "days_on_market_avg": 21
                }
            },
            {
                "id": "prop002",
                "address": "456 Beacon St, Cambridge, MA 02138",
                "price": 750000,
                "bedrooms": 2,
                "bathrooms": 2,
                "sqft": 1200,
                "year_built": 1998,
                "property_type": "Condo",
                "status": "For Sale",
                "description": "Modern condo near Harvard with open floor plan and city views.",
                "features": ["In-unit laundry", "Balcony", "Concierge", "Fitness center"],
                "coordinates": {"latitude": 42.3736, "longitude": -71.1097},
                "market_stats": {
                    "median_price_area": 780000,
                    "price_trend": "+1.8% last month",
                    "days_on_market_avg": 18
                }
            },
            {
                "id": "prop003",
                "address": "789 Commonwealth Ave, Boston, MA 02215",
                "price": 1250000,
                "bedrooms": 4,
                "bathrooms": 3,
                "sqft": 2500,
                "year_built": 2012,
                "property_type": "Townhouse",
                "status": "For Sale",
                "description": "Luxury townhouse near BU with high-end finishes and roof deck.",
                "features": ["Roof deck", "Smart home system", "Heated floors", "Custom cabinetry"],
                "coordinates": {"latitude": 42.3492, "longitude": -71.0999},
                "market_stats": {
                    "median_price_area": 1300000,
                    "price_trend": "+3.2% last month",
                    "days_on_market_avg": 14
                }
            }
        ]
    
    def search_properties(self, 
                         location: Optional[str] = None, 
                         min_price: Optional[int] = None,
                         max_price: Optional[int] = None,
                         min_beds: Optional[int] = None,
                         min_baths: Optional[int] = None,
                         property_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Search for properties based on the given criteria.
        
        Args:
            location: City, neighborhood, or zip code
            min_price: Minimum price
            max_price: Maximum price
            min_beds: Minimum number of bedrooms
            min_baths: Minimum number of bathrooms
            property_type: Type of property (Single Family, Condo, etc.)
        
        Returns:
            List of properties matching the criteria
        """
        results = []
        
        for property in self.properties:
            # Check if property matches all provided criteria
            if location and location.lower() not in property["address"].lower():
                continue
                
            if min_price and property["price"] < min_price:
                continue
                
            if max_price and property["price"] > max_price:
                continue
                
            if min_beds and property["bedrooms"] < min_beds:
                continue
                
            if min_baths and property["bathrooms"] < min_baths:
                continue
                
            if property_type and property["property_type"].lower() != property_type.lower():
                continue
                
            results.append(property)
        
        return results
    
    def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific property.
        
        Args:
            property_id: The ID of the property
            
        Returns:
            Property details or None if not found
        """
        for property in self.properties:
            if property["id"] == property_id:
                return property
                
        return {"error": "Property not found"}
    
    def get_market_trends(self, location: str) -> Dict[str, Any]:
        """
        Get market trends for a specific location.
        
        Args:
            location: City or neighborhood
            
        Returns:
            A dictionary containing all computed market trend data.
        """
        url = "https://zillow56.p.rapidapi.com/market_data"
        querystring = {"location": location}
        headers = {
            "x-rapidapi-key": "36c8c52dc3mshbb39ff413419e97p100586jsn4a24c1387fbd",
            "x-rapidapi-host": "zillow56.p.rapidapi.com"
        }

        response = requests.get(url, headers=headers, params=querystring)
        json_data = response.json()  # Parse JSON response
        properties = json_data.get("results", [])

        # Initialize lists for our metrics
        prices = []
        price_per_sqft = []
        bedrooms = []
        bathrooms = []
        living_areas = []
        lot_sizes = []
        tax_assessed_values = []
        zestimates = []
        price_to_assessed_ratios = []
        price_reductions = []
        rent_zestimates = []
        time_on_zillow_list = []
        latitudes = []
        longitudes = []
        rental_yields = []  # list of tuples (rental yield, property)

        property_type_counts = {}  # Count of each property type

        # Loop over each property and collect data
        for prop in properties:
            # Price
            price = prop.get("price")
            if price is not None:
                prices.append(price)

            # Price per square foot (only if livingArea is nonzero)
            living_area = prop.get("livingArea", 0)
            if living_area and price is not None:
                price_per_sqft.append(price / living_area)
            
            # Bedrooms and bathrooms
            bd = prop.get("bedrooms")
            if bd is not None:
                bedrooms.append(bd)
            ba = prop.get("bathrooms")
            if ba is not None:
                bathrooms.append(ba)
            
            # For largest property (by livingArea)
            if living_area:
                living_areas.append(living_area)
            
            # Lot sizes (if available)
            lot_size = prop.get("lotAreaValue")
            if lot_size is not None:
                lot_sizes.append(lot_size)
            
            # Tax-assessed value and price-to-assessed value ratio
            tax_val = prop.get("taxAssessedValue")
            if tax_val is not None:
                tax_assessed_values.append(tax_val)
                if price and tax_val != 0:
                    price_to_assessed_ratios.append(price / tax_val)
            
            # Zestimate (if available)
            if "zestimate" in prop and prop.get("zestimate") is not None:
                zestimates.append(prop.get("zestimate"))
            
            # Price reductions: use the 'priceChange' field if negative
            price_change = prop.get("priceChange")
            if price_change is not None and isinstance(price_change, (int, float)) and price_change < 0:
                price_reductions.append(abs(price_change))
            
            # Rental info (rentZestimate)
            rent_z = prop.get("rentZestimate")
            if rent_z is not None:
                rent_zestimates.append(rent_z)
                if price and price > 0:
                    # Compute annual rental yield (as a ratio)
                    rental_yield = (rent_z * 12) / price
                    rental_yields.append((rental_yield, prop))
            
            # Time on Zillow for market activity
            time_on = prop.get("timeOnZillow")
            if time_on is not None:
                time_on_zillow_list.append(time_on)
            
            # Latitude and longitude for location specifics
            lat = prop.get("latitude")
            if lat is not None:
                latitudes.append(lat)
            lon = prop.get("longitude")
            if lon is not None:
                longitudes.append(lon)
            
            # Count property types
            home_type = prop.get("homeType")
            if home_type is not None:
                property_type_counts[home_type] = property_type_counts.get(home_type, 0) + 1

        # -------------------------------
        # Compute Metrics

        # Price Metrics
        lowest_price = min(prices) if prices else None
        highest_price = max(prices) if prices else None
        median_price = statistics.median(prices) if prices else None
        min_price_per_sqft = min(price_per_sqft) if price_per_sqft else None
        max_price_per_sqft = max(price_per_sqft) if price_per_sqft else None

        # Size and Specifications
        avg_bedrooms = statistics.mean(bedrooms) if bedrooms else None
        avg_bathrooms = statistics.mean(bathrooms) if bathrooms else None
        largest_property_area = max(living_areas) if living_areas else None
        avg_lot_size = statistics.mean(lot_sizes) if lot_sizes else None

        # Average condo size: compute average livingArea for properties where homeType == "CONDO"
        condo_areas = [prop.get("livingArea") for prop in properties 
                    if prop.get("homeType") == "CONDO" and prop.get("livingArea", 0) > 0]
        avg_condo_size = statistics.mean(condo_areas) if condo_areas else None

        # Price Reductions
        num_price_reductions = len(price_reductions)
        largest_price_reduction = max(price_reductions) if price_reductions else None
        avg_price_reduction = statistics.mean(price_reductions) if price_reductions else None

        # Property Valuation
        avg_tax_assessed_value = statistics.mean(tax_assessed_values) if tax_assessed_values else None
        avg_zestimate = statistics.mean(zestimates) if zestimates else None
        avg_price_to_assessed_ratio = statistics.mean(price_to_assessed_ratios) if price_to_assessed_ratios else None

        # Rental Potential
        avg_rent_zestimate = statistics.mean(rent_zestimates) if rent_zestimates else None
        # Determine best rental yield opportunity (highest yield)
        best_rental = max(rental_yields, key=lambda x: x[0]) if rental_yields else (None, None)

        # Market Activity
        most_recent_listing = min(time_on_zillow_list) if time_on_zillow_list else None
        longest_listing = max(time_on_zillow_list) if time_on_zillow_list else None

        # Location Specifics
        lat_range = (min(latitudes), max(latitudes)) if latitudes else (None, None)
        lon_range = (min(longitudes), max(longitudes)) if longitudes else (None, None)
        num_concentrated = len(latitudes) if latitudes else None

        # -------------------------------
        # Create a results dictionary to return all metrics
        results = {
            "price_metrics": {
                "lowest_price": lowest_price,
                "highest_price": highest_price,
                "median_price": median_price,
                "price_per_sqft_range": {
                    "min": min_price_per_sqft,
                    "max": max_price_per_sqft
                }
            },
            "property_type_distribution": property_type_counts,
            "size_and_specifications": {
                "avg_bedrooms": avg_bedrooms,
                "min_bedrooms": min(bedrooms) if bedrooms else None,
                "max_bedrooms": max(bedrooms) if bedrooms else None,
                "avg_bathrooms": avg_bathrooms,
                "min_bathrooms": min(bathrooms) if bathrooms else None,
                "max_bathrooms": max(bathrooms) if bathrooms else None,
                "largest_property_area": largest_property_area,
                "avg_lot_size": avg_lot_size,
                "avg_condo_size": avg_condo_size
            },
            "price_reductions": {
                "num_price_reductions": num_price_reductions,
                "largest_price_reduction": largest_price_reduction,
                "avg_price_reduction": avg_price_reduction
            },
            "property_valuation": {
                "avg_tax_assessed_value": avg_tax_assessed_value,
                "avg_zestimate": avg_zestimate,
                "avg_price_to_assessed_ratio": avg_price_to_assessed_ratio
            },
            "rental_potential": {
                "avg_rent_zestimate": avg_rent_zestimate,
                "best_rental": {
                    "streetAddress": best_rental[1].get("streetAddress", "N/A") if best_rental[1] else None,
                    "price": best_rental[1].get("price") if best_rental[1] else None,
                    "rentZestimate": best_rental[1].get("rentZestimate") if best_rental[1] else None,
                }
            },
            "market_activity": {
                "most_recent_listing": most_recent_listing,
                "longest_listing": longest_listing
            },
            "location_specifics": {
                "latitude_range": lat_range,
                "longitude_range": lon_range,
                "num_properties_concentrated": num_concentrated
            }
        }

        return results


# Example usage
if __name__ == "__main__":
    retriever = PropertyRetriever()
    
    # Search for properties in Boston
    boston_properties = retriever.search_properties(location="Boston")
    print(f"Found {len(boston_properties)} properties in Boston")
    
    # Get market trends for Cambridge
    cambridge_trends = retriever.get_market_trends("Cambridge")
    print(f"Cambridge median price: ${cambridge_trends['median_price']}")