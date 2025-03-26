# property_retriever.py
import json
import os
from typing import Dict, List, Any, Optional
import requests
import statistics
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

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
            location: City, zip code, or neighborhood
            
        Returns:
            A dictionary containing comprehensive market trend data suitable for frontend display.
        """
        url = "https://zillow56.p.rapidapi.com/market_data"
        querystring = {"location": location}
        
        # Get API key from environment variable
        api_key = os.environ.get("ZILLOW_KEY")
        if not api_key:
            return {"error": "API key not found. Please set ZILLOW_RAPIDAPI_KEY in your .env file."}
        
        headers = {
            "x-rapidapi-key": api_key,
            "x-rapidapi-host": "zillow56.p.rapidapi.com"
        }

        response = requests.get(url, headers=headers, params=querystring)
        json_data = response.json()  # Parse JSON response
        
        print(json_data)
        # Initialize result structure with all fields the frontend might need
        results = {
            "location_info": {
                "name": None,
                "type": None,
                "date": None,
            },
            "market_status": {
                "temperature": None,
                "interpretation": None,
            },
            "summary_metrics": {
                "median_rent": None,
                "monthly_change": None,
                "monthly_change_percent": None,
                "yearly_change": None,
                "yearly_change_percent": None,
                "available_rentals": None,
            },
            "price_distribution": {
                "min_price": None,
                "max_price": None,
                "median_price": None,
                "most_common_price": None,
                "most_common_price_range": None,
                "histogram": [],
            },
            "national_comparison": {
                "national_median": None,
                "difference": None,
                "difference_percent": None,
                "is_above_national": None,
            },
            "nearby_areas": [],
            "historical_trends": {
                "current_year": [],
                "previous_year": [],
                "quarterly_averages": [],
                "ytd_change": None,
                "ytd_change_percent": None,
            },
            "error": None
        }
        
        # Check for errors in the API response
        if "errors" in json_data and json_data["errors"] and len(json_data["errors"]) > 0:
            results["error"] = json_data["errors"]
            return results
        
        if "data" in json_data and "marketPage" in json_data["data"]:
            market_data = json_data["data"]["marketPage"]
            
            # Location information
            results["location_info"]["name"] = market_data.get("areaName")
            results["location_info"]["type"] = market_data.get("areaType")
            results["location_info"]["date"] = market_data.get("date")
            
            # Market temperature and interpretation
            if "marketTemperature" in market_data:
                temp = market_data["marketTemperature"].get("temperature")
                results["market_status"]["temperature"] = temp
                
                # Add interpretation based on temperature
                if temp == "HOT":
                    interpretation = "This is a seller's market with high demand and typically rising prices."
                elif temp == "WARM":
                    interpretation = "This market has solid demand with stable to increasing prices."
                elif temp == "COOL":
                    interpretation = "This is a buyer's market with lower competition and potentially negotiable prices."
                elif temp == "COLD":
                    interpretation = "This market has low demand, favoring buyers with potentially declining prices."
                else:
                    interpretation = "Market conditions are unclear."
                    
                results["market_status"]["interpretation"] = interpretation
            
            # Summary metrics
            if "summary" in market_data:
                summary = market_data["summary"]
                median_rent = summary.get("medianRent")
                monthly_change = summary.get("monthlyChange")
                yearly_change = summary.get("yearlyChange")
                
                results["summary_metrics"]["median_rent"] = median_rent
                results["summary_metrics"]["monthly_change"] = monthly_change
                results["summary_metrics"]["yearly_change"] = yearly_change
                results["summary_metrics"]["available_rentals"] = summary.get("availableRentals")
                
                # Calculate percentages for changes
                if median_rent and monthly_change:
                    results["summary_metrics"]["monthly_change_percent"] = (monthly_change / (median_rent - monthly_change)) * 100 if median_rent != monthly_change else 0
                    
                if median_rent and yearly_change:
                    results["summary_metrics"]["yearly_change_percent"] = (yearly_change / (median_rent - yearly_change)) * 100 if median_rent != yearly_change else 0
            
            # Rent histogram data
            if "rentHistogram" in market_data:
                histogram = market_data["rentHistogram"]
                price_distribution = histogram.get("priceAndCount", [])
                
                # Extract all prices, accounting for their frequency
                prices = [entry["price"] for entry in price_distribution for _ in range(entry["count"])]
                
                results["price_distribution"]["min_price"] = histogram.get("minPrice")
                results["price_distribution"]["max_price"] = histogram.get("maxPrice")
                results["price_distribution"]["histogram"] = price_distribution
                
                # Calculate statistics if we have prices
                if prices:
                    results["price_distribution"]["median_price"] = statistics.median(prices)
                    
                    # Find most common price (mode)
                    most_common_price_entry = max(price_distribution, key=lambda x: x.get("count", 0)) if price_distribution else {}
                    most_common_price = most_common_price_entry.get("price")
                    results["price_distribution"]["most_common_price"] = most_common_price
                    
                    # Create a price range around the most common price
                    if most_common_price:
                        results["price_distribution"]["most_common_price_range"] = {
                            "min": max(0, most_common_price - 100),
                            "max": most_common_price + 100
                        }
            
            # National comparison
            if "rentCompare" in market_data and "summary" in market_data:
                national_median = market_data["rentCompare"].get("medianRent")
                local_median = market_data["summary"].get("medianRent")
                
                if national_median and local_median:
                    difference = local_median - national_median
                    
                    results["national_comparison"]["national_median"] = national_median
                    results["national_comparison"]["difference"] = difference
                    results["national_comparison"]["difference_percent"] = (difference / national_median) * 100
                    results["national_comparison"]["is_above_national"] = difference > 0
            
            # Nearby areas
            if "nearbyAreaTrends" in market_data:
                local_median = market_data.get("summary", {}).get("medianRent")
                
                for area in market_data["nearbyAreaTrends"]:
                    area_rent = area.get("medianRent")
                    area_info = {
                        "name": area.get("areaName"),
                        "median_rent": area_rent,
                        "date": area.get("date")
                    }
                    
                    # Add comparison data if we have both local and area median rents
                    if local_median and area_rent:
                        difference = area_rent - local_median
                        area_info["difference"] = difference
                        area_info["difference_percent"] = (difference / local_median) * 100 if local_median else 0
                        area_info["is_premium"] = difference > 0
                    
                    results["nearby_areas"].append(area_info)
                
                # Sort nearby areas by rent (highest to lowest)
                results["nearby_areas"] = sorted(results["nearby_areas"], 
                                                key=lambda x: x.get("median_rent", 0), 
                                                reverse=True)
            
            # Historical trends
            if "medianRentPriceOverTime" in market_data:
                current_year = market_data["medianRentPriceOverTime"].get("currentYear", [])
                previous_year = market_data["medianRentPriceOverTime"].get("prevYear", [])
                
                results["historical_trends"]["current_year"] = current_year
                results["historical_trends"]["previous_year"] = previous_year
                
                # Calculate year-to-date change
                if current_year and len(current_year) >= 2:
                    first_month = current_year[0].get("price")
                    latest_month = current_year[-1].get("price")
                    
                    if first_month and latest_month:
                        ytd_change = latest_month - first_month
                        results["historical_trends"]["ytd_change"] = ytd_change
                        results["historical_trends"]["ytd_change_percent"] = (ytd_change / first_month) * 100 if first_month else 0
                
                # Calculate quarterly averages for previous year
                if previous_year and len(previous_year) >= 12:
                    quarters = [
                        previous_year[0:3],  # Q1
                        previous_year[3:6],  # Q2
                        previous_year[6:9],  # Q3
                        previous_year[9:12]  # Q4
                    ]
                    
                    quarterly_averages = []
                    for i, quarter in enumerate(quarters):
                        avg_price = sum(item.get("price", 0) for item in quarter) / len(quarter) if quarter else 0
                        quarterly_averages.append({
                            "quarter": i + 1,
                            "average_price": avg_price
                        })
                    
                    results["historical_trends"]["quarterly_averages"] = quarterly_averages
    
        return results


# Example usage
if __name__ == "__main__":
    retriever = PropertyRetriever()
    
    # Search for properties in Boston
    boston_properties = retriever.search_properties(location="Boston")
    print(f"Found {len(boston_properties)} properties in Boston")
    
    # Get market trends for zip code 60608
    trends = retriever.get_market_trends("ChicaGO, IL")
    
    print(json.dumps(trends, indent=2))