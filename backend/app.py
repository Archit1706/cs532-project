import math
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from langchain.chat_models import AzureChatOpenAI
from langchain.prompts import PromptTemplate
from serpapi import GoogleSearch
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import uuid
import http.client
import json
import urllib.parse
import requests
import datetime
import boto3
from botocore.config import Config
import logging
import statistics
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from dotenv import load_dotenv
import httpx
import re

load_dotenv() 

class PropertyRequest(BaseModel):
    zpid: str = Field(..., example="12345678")

class LocationRequest(BaseModel):
    zipCode: str = Field(..., example="60616")
    type: Optional[str] = Field("Restaurants", example="Schools")

class PropertiesRequest(BaseModel):
    zipCode: str = Field(..., example="90210")

class ErrorResponse(BaseModel):
    error: str
    results: Optional[Any]

class PropertyResponse(BaseModel):
    error: Optional[str] = None
    results: dict

class PropertiesResponse(BaseModel):
    error: Optional[str] = None
    results: List[dict]

class ExtractFeaturesRequest(BaseModel):
    message: str = Field(..., example="Looking for a 2-bedroom house near downtown.")

class ExtractFeaturesResponse(BaseModel):
    features: Dict[str, Any]
    success: bool
    error: Optional[str] = None

class SaveChatRequest(BaseModel):
    session_id: str = Field(..., example="session_001")
    messages: List[Dict[str, Any]] = Field(..., example=[{"sender": "user", "text": "Hello!"}])
    zipCodes: Optional[List[str]] = Field(default=[], example=["90210", "60616"])

class SaveChatResponse(BaseModel):
    success: bool
    r2_upload: bool
    file_key: str
    timestamp: str

class ErrorResponse(BaseModel):
    success: bool
    message: str


class MarketTrendsRequest(BaseModel):
    location: Optional[str] = Field(None, example="Chicago, IL")
    zipCode: Optional[str] = Field(None, example="60616")


class MarketTrendsResponse(BaseModel):
    location: str
    trends: Dict[str, Any] 


class ChatRequest(BaseModel):
    message: str = Field(..., example="Find me a 2-bedroom apartment in Chicago.")
    session_id: Optional[str] = Field(None, example="a1b2c3d4-5678-90ef-ghij-klmnopqrstuv")
    location_context: Optional[str] = Field(None, example="Chicago, IL")
    feature_context: Optional[str] = Field(None, example="2 bedrooms, pet-friendly")
    is_system_query: Optional[bool] = Field(False, example=True)
    language: Optional[str] = Field(None, example="en")

class ChatResponse(BaseModel):
    session_id: str
    response: str
    extracted_features: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ChatErrorResponse(BaseModel):
    error: str
    session_id: Optional[str]
    response: str

class TranslateRequest(BaseModel):
    text: str
    language: str  # e.g. "es", "fr", "de", etc.

class TranslateResponse(BaseModel):
    text: str      # final text in the user’s language
    language: str  # same as request.language

class AgentSearchRequest(BaseModel):
    location: str = Field(..., example="houston, tx")
    specialty: Optional[str] = Field("Any", example="Residential")
    language: Optional[str] = Field("English", example="English")

class AgentSearchResponse(BaseModel):
    agents: List[Dict[str, Any]]

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DEEPL_URL = "https://api.deepl.com/v2/translate"
DEEPL_API_KEY = os.environ.get('DEEPL_API_KEY')

app = FastAPI()

# Enable CORS for all routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define section IDs - these should match what's in your frontend
SECTION_IDS = {
    "PROPERTIES": "properties-section",
    "MARKET": "market-trends-section",
    "AMENITIES": "local-amenities-section",
    "TRANSIT": "transit-section"
}

# Define property tab IDs - these should match what's in your frontend
PROPERTY_TAB_IDS = {
    "DETAILS": "property-details-tab",
    "PRICE_HISTORY": "property-price-history-tab",
    "SCHOOLS": "property-schools-tab",
    "MARKET_ANALYSIS": "property-market-analysis-tab"
}

# Dictionary to cache tokenizers and models (to avoid reloading for each request)
translation_models = {}

# Define prompts
CONDENSE_PROMPT = PromptTemplate.from_template("""
Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question that includes relevant context from the conversation.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:
""")

QA_PROMPT = PromptTemplate.from_template("""
You are REbot, a helpful and concise real estate AI assistant that helps users search for properties, track market trends, understand neighborhoods, and answer real estate questions.

IMPORTANT GUIDELINES:
1. Be brief and conversational, limiting responses to 1-2 short paragraphs maximum
2. Reference UI elements when relevant (e.g., "You can see property details in the right panel")
3. Use natural, friendly language - avoid sounding like a formal report
4. When data is loading or when asking for a zip code, let users know what's happening
5. Mention trends and insights from available data rather than listing everything
6. Never mention "API" or technical terms - keep the conversation natural and focused on real estate
7. Directly reference the visual elements the user can see in the UI, not abstract data

CURRENT UI STATE CONTEXT:
{context}

QUERY TYPE: {query_type}

Question: {question}
Answer:
""")

# Update the ENHANCED_SYSTEM_PROMPT in app.py

ENHANCED_SYSTEM_PROMPT = """
You are REbot, a helpful real estate AI assistant that helps users search for properties, track market trends, understand neighborhoods, and answer real estate questions.

CRITICAL - RESPONSE GUIDELINES:
1. ALWAYS answer the user's question DIRECTLY and COMPLETELY first with specific facts and details
2. Include specific details from the property or area data when available to you
3. When discussing price history, include actual prices and dates if you have them 
4. When discussing market data, include actual numbers and percentages
5. For longer responses, use bullet points to organize information
6. Be conversational, friendly and concise
7. Personalize responses to show awareness of the selected property when relevant

CRITICAL - UI LINK INSTRUCTIONS:
You MUST include specific section references in your responses using these exact link formats:

MAIN SECTIONS (When discussing area-wide information):
- When mentioning properties in the area: Use exactly "[[properties]]" in your response
- When mentioning market data for the area: Use exactly "[[market trends]]" in your response  
- When mentioning restaurants or local amenities: Use exactly "[[local amenities]]" in your response
- When mentioning transit options: Use exactly "[[transit]]" in your response
- When mentioning real estate agents: Use exactly "[[agents]]" in your response

PROPERTY SECTIONS (When discussing a specific property):
- When discussing a specific property's details: Use exactly "[[property details]]" in your response
- When discussing a property's price history: Use exactly "[[price history]]" in your response
- When discussing nearby schools: Use exactly "[[schools]]" in your response
- When discussing market analysis for a property: Use exactly "[[property market analysis]]" in your response
- When discussing property description: Use exactly "[[property description]]" in your response

FORMAT EXAMPLES:
Short response: "The last sale of this property was on March 15, 2023 for $450,000. Before that, it sold in 2018 for $380,000. You can see more details in the [[price history]] tab."

Bulleted response:
"According to the market data for this area:
* Home prices have increased by 5.2% in the last year
* The median price is now $525,000
* Inventory is down 15% compared to the same period last year

You can see full market trend information in the [[market trends]] section."

CURRENT UI STATE:
{ui_context}

USER QUERY: {question}
"""


import re

# Function to format response with proper HTML links
def format_response_with_links(response_text):
    """Replace markdown and link placeholders with HTML, with enhanced cross-tab navigation."""
    text = response_text
    
    logging.info(f"Formatting response with links. Input: {text[:100]}...")
    
    # — 1) Convert headings
    heading_patterns = {
        r'^###### (.+)$': r'<h6>\1</h6>',
        r'^##### (.+)$': r'<h5>\1</h5>',
        r'^#### (.+)$':  r'<h4>\1</h4>',
        r'^### (.+)$':   r'<h3>\1</h3>',
        r'^## (.+)$':    r'<h2>\1</h2>',
        r'^# (.+)$':     r'<h1>\1</h1>',
    }
    for pattern, repl in heading_patterns.items():
        text = re.sub(pattern, repl, text, flags=re.MULTILINE)
    
    # — 2) Convert bold/italic formatting
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<em>\1</em>', text)
    
    # — 3) Log found link patterns for debugging
    all_link_patterns = re.findall(r'\[\[.+?\]\]', text)
    if all_link_patterns:
        logging.info(f"Found link patterns: {all_link_patterns}")
    
    # — 4) Define ALL link replacements with enhanced attributes for cross-tab navigation
    replacements = [
        # Main section links
        (r'\[\[market(?:\s+trends)?\]\]', 
         f'<a href="#{SECTION_IDS["MARKET"]}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="market" data-tab="explore" data-force-tab="true">market trends</a>'),
        
        (r'\[\[properties\]\]', 
         f'<a href="#{SECTION_IDS["PROPERTIES"]}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="property" data-tab="explore" data-force-tab="true">properties</a>'),
        
        (r'\[\[restaurants\]\]|\[\[local\s+amenities\]\]', 
         f'<a href="#{SECTION_IDS["AMENITIES"]}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="restaurants" data-tab="explore" data-force-tab="true">local amenities</a>'),
        
        (r'\[\[transit\]\]', 
         f'<a href="#{SECTION_IDS["TRANSIT"]}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="transit" data-tab="explore" data-force-tab="true">transit options</a>'),
         
        (r'\[\[agents\]\]', 
         f'<a href="#{SECTION_IDS["AGENTS"]}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="agents" data-tab="explore" data-force-tab="true">top agents</a>'),
        
        # Property tab links - enhanced with data attributes
        (r'\[\[property\s+details\]\]',
         f'<a href="#{PROPERTY_TAB_IDS["DETAILS"]}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="propertyDetails" data-property-tab="details" data-force-tab="true">property details</a>'),
        
        (r'\[\[price\s+history\]\]', 
         f'<a href="#{PROPERTY_TAB_IDS["PRICE_HISTORY"]}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="propertyPriceHistory" data-property-tab="priceHistory" data-force-tab="true">price history</a>'),
        
        (r'\[\[property\s+schools\]\]|\[\[schools\]\]', 
         f'<a href="#{PROPERTY_TAB_IDS["SCHOOLS"]}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="propertySchools" data-property-tab="schools" data-force-tab="true">schools</a>'),
        
        (r'\[\[property\s+market(?:\s+analysis)?\]\]|\[\[market\s+analysis\]\]', 
         f'<a href="#{PROPERTY_TAB_IDS["MARKET_ANALYSIS"]}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="propertyMarketAnalysis" data-property-tab="marketAnalysis" data-force-tab="true">market analysis</a>'),
         
        # Property description - new link
        (r'\[\[property\s+description\]\]', 
         f'<a href="#{PROPERTY_TAB_IDS["DETAILS"]}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="propertyDescription" data-property-tab="details" data-section="description" data-force-tab="true">property description</a>'),
    ]
    
    # Apply each replacement pattern
    for pattern, replacement in replacements:
        before_count = text.count("[[")
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        after_count = text.count("[[")
        if before_count > after_count:
            logging.info(f"Replaced pattern {pattern} - found {before_count - after_count} occurrences")
    
    # Check for any unprocessed link patterns
    remaining_links = re.findall(r'\[\[.+?\]\]', text)
    if remaining_links:
        logging.warning(f"Remaining unprocessed link patterns: {remaining_links}")
    
    # — 5) Format list items for better readability
    # Convert markdown-style lists to HTML lists
    text = format_bullet_points(text)
    
    logging.info(f"Formatted output: {text[:100]}...")
    
    return text

def format_bullet_points(text):
    """Convert markdown-style bullet points to HTML lists for better readability."""
    
    # Find contiguous blocks of bullet points (lines starting with * or -)
    bullet_pattern = re.compile(r'((?:^[*-] .+?\n)+)', re.MULTILINE)
    
    def replace_bullet_list(match):
        bullet_list = match.group(1)
        # Convert each bullet point to a list item
        items = re.sub(r'^[*-] (.+?)$', r'<li>\1</li>', bullet_list, flags=re.MULTILINE)
        # Wrap in an unordered list
        return f'<ul class="list-disc pl-5 space-y-1 my-2">{items}</ul>'
    
    # Replace bullet lists
    processed_text = bullet_pattern.sub(replace_bullet_list, text)
    
    # Find contiguous blocks of numbered lists (lines starting with 1., 2., etc.)
    numbered_pattern = re.compile(r'((?:^\d+\. .+?\n)+)', re.MULTILINE)
    
    def replace_numbered_list(match):
        numbered_list = match.group(1)
        # Convert each numbered item to a list item
        items = re.sub(r'^\d+\. (.+?)$', r'<li>\1</li>', numbered_list, flags=re.MULTILINE)
        # Wrap in an ordered list
        return f'<ol class="list-decimal pl-5 space-y-1 my-2">{items}</ol>'
    
    # Replace numbered lists
    processed_text = numbered_pattern.sub(replace_numbered_list, processed_text)
    
    return processed_text

# Initialize Azure OpenAI
def get_llm():
    logger.info(f"Initializing Azure OpenAI with deployment: VARELab-GPT4o, API version: 2024-08-01-preview")
    api_key = os.environ.get('AZURE_OPENAI_VARE_KEY')
    endpoint = os.environ.get('AZURE_ENDPOINT')
    if not api_key or not endpoint:
        logger.error("Missing Azure OpenAI API key or endpoint. Check your environment variables.")
        raise ValueError("Missing Azure OpenAI API key or endpoint")
    try:
        return AzureChatOpenAI(
            azure_deployment="VARELab-GPT4o",
            api_key=api_key,
            api_version="2024-08-01-preview",
            azure_endpoint=endpoint,
            temperature=0.5,
            max_tokens=None,
            timeout=None,
            max_retries=2,
        )
    except Exception as e:
        logger.error(f"Error initializing Azure OpenAI: {str(e)}")
        raise

def get_lat_long(address):
    logger.info(f"Getting coordinates for address: {address}")
    geolocator = Nominatim(user_agent="geo_locator", timeout=5)
    try:
        location = geolocator.geocode(address)
        if location:
            logger.info(f"Found coordinates: {location.latitude}, {location.longitude}")
            return location.latitude, location.longitude
        else:
            logger.warning(f"Could not find coordinates for address: {address}")
            return None
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        zip_coords = {
            "02108": (42.3583, -71.0603),
            "60607": (41.8742, -87.6492),
            "10001": (40.7506, -73.9971),
            "90210": (34.0901, -118.4065)
        }
        if address.startswith(tuple(zip_coords.keys())):
            zip_code = address.split(",")[0].strip()
            logger.info(f"Using fallback coordinates for {zip_code}")
            return zip_coords.get(zip_code)
        return None

def search_nearby_places(location, query_type="Restaurants"):
    logger.info(f"Searching for {query_type} near {location}")
    if isinstance(location, str) and location.isdigit() and len(location) == 5:
        zip_code = location
        location = f"{location}, USA"
    else:
        zip_code = None
    coords = get_lat_long(location)
    if not coords:
        return {"error": "Could not find coordinates for the given location.", "results": []}
    latitude, longitude = coords
    serpapi_key = os.environ.get('SERPAPI_KEY')
    if not serpapi_key:
        return {"error": "Missing API key", "results": []}
    params = {
        "engine": "google_local",
        "q": query_type,
        "ll": f"@{latitude},{longitude},15z",
        "location": zip_code if zip_code else location,
        "google_domain": "google.com",
        "gl": "us",
        "hl": "en",
        "api_key": serpapi_key
    }
    try:
        search = GoogleSearch(params)
        results = search.get_dict()
        local_results = results.get("local_results", [])
        for place in local_results:
            if "gps_coordinates" in place:
                lat = place["gps_coordinates"].get("latitude")
                lon = place["gps_coordinates"].get("longitude")
                if lat is not None and lon is not None:
                    place["distance"] = round(geodesic(coords, (lat, lon)).miles, 2)
        sorted_results = sorted(local_results, key=lambda x: x.get("distance", float('inf')))
        formatted_results = []
        if query_type == "Restaurants":
            for place in sorted_results:
                formatted_results.append({
                    "image": place.get("thumbnail", ""),
                    "price": place.get("price", ""),
                    "rating": place.get("rating", ""),
                    "reviews_original": place.get("reviews_original", ""),
                    "title": place.get("title", "Unknown"),
                    "address": place.get("address", "No address"),
                    "category": place.get("type", ""),
                    "distance": place.get("distance", None),
                    "type": place.get("type", "")
                })
        elif query_type.lower() == "bus stop":
            for place in sorted_results:
                formatted_results.append({
                    "title": place.get("title", "Unknown"),
                    "address": place.get("address", "No address"),
                    "distance": place.get("distance", None),
                    "type": place.get("type", ""),
                    "directions": place.get("links").get("directions", "No directions"),
                })
        return {
            "coordinates": {"latitude": latitude, "longitude": longitude},
            "results": formatted_results
        }
    except Exception as e:
        logger.error(f"Error in search: {str(e)}")
        return {"error": str(e), "results": []}

def search_nearby_houses(zipcode, query_type="house"):
    logger.info(f"Searching for {query_type} near {zipcode}")
    if not isinstance(zipcode, str) or not zipcode.isdigit() or len(zipcode) != 5:
        return {"error": "Please input 5 digits zipcode.", "results": []}
    zillowapi_key = os.environ.get('ZILLOW_KEY')
    if not zillowapi_key:
        return {"error": "Missing Zillow API key", "results": []}
    location = f"{zipcode}, USA"
    params = {
        "location": location,
        "output": "json",
        "status": "forSale",
        "sortSelection": "priorityscore",
        "listing_type": "by_agent",
        "doz": "any"
    }
    query_string = urllib.parse.urlencode(params)
    request_path = f"/search?{query_string}"
    logger.info(f"Zillow API request path: {request_path}")
    headers = {
        'x-rapidapi-key': zillowapi_key,
        'x-rapidapi-host': "zillow56.p.rapidapi.com"
    }
    try:
        conn = http.client.HTTPSConnection("zillow56.p.rapidapi.com")
        conn.request("GET", request_path, headers=headers)
        response = conn.getresponse()
        logger.info(f"Zillow API response status: {response.status}")
        data = response.read().decode('utf-8')
        logger.info(f"Zillow API response snippet: {data[:200]}...")
        formatted_results = json.loads(data)
        results_count = len(formatted_results.get("results", []))
        logger.info(f"Zillow API returned {results_count} results")
        if results_count == 0:
            logger.warning("No properties found from Zillow API")
        property_listings = []
        for property in formatted_results.get("results", []):
            listing = {
                "address": f"{property.get('streetAddress', 'N/A')}, {property.get('city', 'N/A')}, {property.get('state', 'N/A')} {property.get('zipcode', 'N/A')}",
                "price": property.get("price", "N/A"),
                "beds": property.get("bedrooms", "N/A"),
                "baths": property.get("bathrooms", "N/A"),
                "sqft": property.get("livingArea", "N/A"),
                "type": property.get("homeType", "N/A"),
                "imgSrc": property.get("imgSrc", ""),
                "zpid": property.get("zpid", "")
            }
            property_listings.append(listing)
        return {"results": property_listings}
    except Exception as e:
        logger.error(f"Error in Zillow search: {str(e)}")
        return {"error": str(e), "results": []}


# Session management
chat_histories = {}

# Initialize LLM
try:
    LLM = get_llm()
    logger.info("Successfully initialized Azure OpenAI LLM")
except Exception as e:
    logger.error(f"Failed to initialize LLM: {str(e)}")
    LLM = None

def get_property_details(zpid):
    logger.info(f"Getting property details for zpid: {zpid}")
    zillowapi_key = os.environ.get('ZILLOW_KEY')
    if not zillowapi_key:
        return {"error": "Missing Zillow API key", "results": None}
    url = "https://zillow56.p.rapidapi.com/propertyV2"
    querystring = {"zpid": zpid}
    headers = {
        'x-rapidapi-key': zillowapi_key,
        'x-rapidapi-host': "zillow56.p.rapidapi.com"
    }
    try:
        logger.info(f"Calling Zillow API for property details with zpid: {zpid}")
        conn = http.client.HTTPSConnection("zillow56.p.rapidapi.com")
        conn.request("GET", f"/propertyV2?zpid={zpid}", headers=headers)
        response = conn.getresponse()
        logger.info(f"Zillow property details API response status: {response.status}")
        data = response.read().decode('utf-8')
        property_data = json.loads(data)
        if not property_data or "error" in property_data:
            logger.error(f"Error in Zillow property details API: {property_data.get('error', 'Unknown error')}")
            return {"error": "Failed to retrieve property details", "results": None}
        property_details = {
            "basic_info": {
                "zpid": property_data.get("zpid"),
                "address": {
                    "streetAddress": property_data.get("address", {}).get("streetAddress"),
                    "city": property_data.get("address", {}).get("city"),
                    "state": property_data.get("address", {}).get("state"),
                    "zipcode": property_data.get("address", {}).get("zipcode"),
                    "full": property_data.get("address", {}).get("streetAddress") + ", " + 
                            property_data.get("address", {}).get("city") + ", " + 
                            property_data.get("address", {}).get("state") + " " + 
                            property_data.get("address", {}).get("zipcode")
                },
                "price": property_data.get("price"),
                "homeStatus": property_data.get("homeStatus"),
                "homeType": property_data.get("homeType"),
                "description": property_data.get("description"),
                "bedrooms": property_data.get("bedrooms"),
                "bathrooms": property_data.get("bathrooms"),
                "livingArea": property_data.get("livingArea"),
                "lotSize": property_data.get("lotSize"),
                "yearBuilt": property_data.get("yearBuilt"),
                "daysOnZillow": property_data.get("daysOnZillow")
            },
            "images": property_data.get("images", []),
            "features": property_data.get("resoFacts", {}),
            "taxes": property_data.get("taxHistory", []),
            "schools": property_data.get("schools", []),
            "nearbyHomes": property_data.get("nearbyHomes", []),
            "priceHistory": property_data.get("priceHistory", [])
        }

        # Fetch property photos
        url = "https://zillow56.p.rapidapi.com/photos"
        querystring = {"zpid": zpid}
        headers = {
            "x-rapidapi-key": os.environ.get('ZILLOW_KEY'),
            "x-rapidapi-host": "zillow56.p.rapidapi.com"
        }
        response = requests.get(url, headers=headers, params=querystring)

        # Extract the first image URL (jpeg, jpg, or png) from each photo's mixedSources
        photos = response.json().get('photos', [])
        image_urls = []
        for photo in photos:
            if 'mixedSources' in photo:
                for key in ['jpeg', 'jpg', 'png']:
                    if key in photo['mixedSources']:
                        image_urls.append(photo['mixedSources'][key][0]['url'])
                        break

        # Add the list of images to the property details
        property_details["images"] = image_urls

        # Rent estimate
        try:
            url = "https://zillow56.p.rapidapi.com/rent_estimate"
            querystring = {"address": property_details["basic_info"]["address"]["streetAddress"]}

            response = requests.get(url, headers=headers, params=querystring)
            rent_data = response.json().get("data", {}).get("floorplans", [{}])[0].get("zestimate", {})
            rent_estimate = rent_data.get("rentZestimate")
            rent_estimate_range_high = rent_data.get("rentZestimateRangeHigh")
            rent_estimate_range_low = rent_data.get("rentZestimateRangeLow")

            property_details["rent_estimate"] = {
            "rent_estimate": rent_estimate,
            "rent_estimate_range_high": rent_estimate_range_high,
            "rent_estimate_range_low": rent_estimate_range_low
            }
        except Exception as e:
            logger.warning(f"Failed to fetch rent estimate: {str(e)}")
            property_details["rent_estimate"] = {
            "rent_estimate": None,
            "rent_estimate_range_high": None,
            "rent_estimate_range_low": None
            }

        # Walkability, transit, and bike scores
        try:
            url = "https://zillow56.p.rapidapi.com/walk_transit_bike_score"
            querystring = {"zpid": zpid}
            response = requests.get(url, headers=headers, params=querystring)
            scores_data = response.json().get("data", {}).get("property", {})
            walkability = scores_data.get("walkScore")
            transit = scores_data.get("transitScore")
            bike = scores_data.get("bikeScore")

            property_details["walkability"] = walkability
            property_details["transit"] = transit
            property_details["bike"] = bike
        except Exception as e:
            logger.warning(f"Failed to fetch walkability, transit, and bike scores: {str(e)}")
            property_details["walkability"] = None
            property_details["transit"] = None
            property_details["bike"] = None

        logger.info(f"Successfully retrieved property details for zpid: {zpid}")
        return {"results": property_details}
    except Exception as e:
        logger.error(f"Error getting property details: {str(e)}")
        return {"error": str(e), "results": None}

@app.post("/api/property", response_model=PropertyResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def property_details(data: PropertyRequest):
    try:
        zpid = data.zpid
        logger.info(f"Received property details request for zpid: {zpid}")
        if not zpid:
            return JSONResponse(status_code=400, content={"error": "Missing zpid parameter", "results": None})
        results = get_property_details(zpid)
        if "error" in results and results["error"] and not results["results"]:
            logger.error(f"Error retrieving property details: {results['error']}")
            return JSONResponse(status_code=500, content=results)
        logger.info(f"Returning property details for zpid: {zpid}")
        return results
    except Exception as e:
        error_message = f"Unexpected error in property details endpoint: {str(e)}"
        logger.error(error_message)
        return JSONResponse(status_code=500, content={"error": error_message, "results": None})

@app.post("/api/location", response_model=PropertiesResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def location(data: LocationRequest):
    try:
        logger.info(f"Received location request: {data}")
        zip_code = data.zipCode
        query_type = data.type
        if not zip_code:
            return JSONResponse(status_code=400, content={"error": "Missing zip code"})
        results = search_nearby_places(zip_code, query_type)
        return results
    except Exception as e:
        error_message = f"Unexpected error in location endpoint: {str(e)}"
        logger.error(error_message)
        return JSONResponse(status_code=500, content={"error": error_message, "results": []})

@app.post("/api/properties", response_model=PropertiesResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def properties(data: PropertiesRequest):
    try:
        logger.info(f"Received property search request: {data}")
        zip_code = data.zipCode
        if not zip_code or not zip_code.isdigit() or len(zip_code) != 5:
            return JSONResponse(status_code=400, content={"error": "Invalid zip code", "results": []})
        results = search_nearby_houses(zip_code)
        logger.info(f"Found {len(results.get('results', []))} properties")
        return results
    except Exception as e:
        error_message = f"Unexpected error in properties endpoint: {str(e)}"
        logger.error(error_message)
        return JSONResponse(status_code=500, content={"error": error_message, "results": []})
##########################################################################################################################################

async def translate_with_deepl(text: str, source: str, target: str) -> str:
    if not DEEPL_API_KEY:
        raise RuntimeError("Missing DEEPL_API_KEY")
    payload = {
        "auth_key": DEEPL_API_KEY,
        "text": text,
        "source_lang": source.upper(),
        "target_lang": target.upper(),
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(DEEPL_URL, data=payload)
        r.raise_for_status()
        resp = r.json()
    return resp["translations"][0]["text"]

async def translate_text(text: str, source: str, target: str) -> str:
    return await translate_with_deepl(text, source, target)
    
##########################################################################################################################################

# FEATURE EXTRACTION
########################################################################################

def extract_query_features(query):
    try:
        logger.info(f"🔍 Feature extraction request for: '{query}'")
        
        # Prepare the feature extraction prompt
        extraction_prompt = f"""
        You are a real estate assistant specialized in understanding user queries. Extract structured data from this query.
        
        For the following user query:
        "{query}"
        
        Extract and return ONLY a JSON object with these fields:
        
        {{
          "queryType": str,  // One of: "general", "property_search", "property_detail", "market_info", "legal", "preferences"
          "zipCode": str or null,  // Any US zip code mentioned
          "propertyFeatures": {{  // All property features mentioned
            "bedrooms": int or [min, max] or null,
            "bathrooms": int or [min, max] or null,
            "squareFeet": int or [min, max] or null,
            "propertyType": str or null,  // e.g., "house", "condo", "apartment"
            "yearBuilt": int or [min, max] or null
          }},
          "locationFeatures": {{  // All location details mentioned
            "neighborhood": str or null,
            "city": str or null,
            "proximity": {{
              "to": str or null,  // What to be close to e.g., "downtown", "schools"
              "distance": number or null,  // Numeric value
              "unit": str or null  // "miles", "minutes", etc.
            }}
          }},
          "actionRequested": str or null,  // e.g., "show_listings", "show_details", "analyze_market"
          "filters": {{  // Any filtering criteria
            "priceRange": [min, max] or null,
            "amenities": [str] or null  // Array of requested amenities
          }},
          "sortBy": str or null  // e.g., "price_asc", "price_desc", "newest"
        }}
        
        Always return valid JSON without explanation or other text. Use null for missing fields.
        """
        
        messages = [{"role": "user", "content": extraction_prompt}]
        
        # Get response from LLM
        logger.info("🤖 Sending feature extraction request to LLM")
        response = LLM.invoke(messages)
        
        # Extract JSON from response
        content = response.content.strip()
        
        # Log raw response for debugging
        logger.info(f"📝 Raw LLM response: {content[:200]}...")
        
        # Try to find JSON in the response
        import re
        import json
        
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            json_str = json_match.group(0)
            features = json.loads(json_str)
            
            # Format features for easier reading in logs
            formatted_features = json.dumps(features, indent=2)
            logger.info(f"📊 Extracted features:\n{formatted_features}")
            
            return features
        else:
            logger.warning("⚠️ No JSON found in LLM response")
            default_features = {
                "queryType": "general",
                "zipCode": None,
                "propertyFeatures": {},
                "locationFeatures": {},
                "actionRequested": None,
                "filters": {},
                "sortBy": None
            }
            logger.info(f"📊 Using default features:\n{json.dumps(default_features, indent=2)}")
            return default_features
            
    except Exception as e:
        logger.error(f"❌ Feature extraction error: {str(e)}")
        # Fallback to basic classification
        fallback = {
            "queryType": classify_query(query),
            "zipCode": None,
            "propertyFeatures": {},
            "locationFeatures": {},
            "actionRequested": None,
            "filters": {},
            "sortBy": None
        }
        logger.info(f"📊 Using fallback features:\n{json.dumps(fallback, indent=2)}")
        return fallback
    


@app.post(
    "/api/extract_features",
    response_model=ExtractFeaturesResponse,
    responses={500: {"model": ExtractFeaturesResponse}}
)
async def extract_features(data: ExtractFeaturesRequest):
    try:
        query = data.message
        logger.info(f"🔎 Feature extraction API request: '{query}'")
        features = extract_query_features(query)
        logger.info(f"✅ Feature extraction complete. Returning: {json.dumps(features, indent=2)}")
        return {"features": features, "success": True}
    except Exception as e:
        error_msg = f"Feature extraction error: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return JSONResponse(status_code=500, content={"features": None, "success": False, "error": error_msg})


##########################################################################################################################################

class S3Service:
    def __init__(self, s3_client, bucket):
        self.s3_client = s3_client
        self.bucket = bucket

    def upload_json_to_r2(self, key, json_data, content_type='application/json'):
        if isinstance(json_data, dict):
            json_data = json.dumps(json_data)
        json_bytes = json_data.encode('utf-8')
        logging.info(f"Uploading to bucket: {self.bucket}, key: {key}")
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=json_bytes,
            ContentType=content_type
        )

def new_r2_service():
    account = os.environ.get('CLOUDFLARE_ACCOUNT')
    access_key = os.environ.get('CLOUDFLARE_KEY')
    secret_key = os.environ.get('CLOUDFLARE_SECRET')
    bucket = "dialogue-json"
    logging.info(f"Initializing R2 service for account: {account[:4]}... and bucket: {bucket}")
    r2_config = Config(
        s3={"addressing_style": "virtual"},
        retries={"max_attempts": 10, "mode": "standard"}
    )
    s3_client = boto3.client(
        's3',
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=r2_config
    )
    return S3Service(s3_client, bucket)

@app.post(
    "/api/save_chat",
    response_model=SaveChatResponse,
    responses={500: {"model": ErrorResponse}}
)
async def save_chat(data: SaveChatRequest):
    try:
        logger.info(f"Save chat request received: {len(data.get('messages', []))} messages")
        session_id = data.session_id
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        file_key = f"chat_{session_id}_{timestamp}.json"
        chat_data = {
            "session_id": session_id,
            "timestamp": timestamp,
            "messages": data.get('messages', []),
            "zipCodes": data.get('zipCodes', [])
        }
        try:
            s3_service = new_r2_service()
            s3_service.upload_json_to_r2(file_key, chat_data)
            logger.info(f"Chat data uploaded to R2 successfully: {file_key}")
            r2_upload_success = True
        except Exception as e:
            logger.error(f"R2 upload failed: {str(e)}")
            r2_upload_success = False
        return {
            "success": True,
            "r2_upload": r2_upload_success,
            "file_key": file_key,
            "timestamp": timestamp
        }
    except Exception as e:
        logger.error(f"Failed to save chat: {str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "message": f"Error: {str(e)}"})

##########################################################################################################################################

## MARKET TRENDS 

#######################################################################################################################################

# Add to backend/app.py

@app.post(
    "/api/market_trends",
    response_model=MarketTrendsResponse,
    responses={
        400: {"description": "Missing required parameters"},
        500: {"description": "Internal server error"}
    }
)
async def market_trends(data: MarketTrendsRequest):
    try:
        logger.info(f"Received market trends request: {data}")
        location = data.location
        zip_code = data.zipCode

        if not location and not zip_code:
            return JSONResponse(status_code=400, content={"error": "Missing location or zip code"})
        if zip_code and not location:
            location = f"{zip_code}"

        url = "https://zillow56.p.rapidapi.com/market_data"
        querystring = {"location": location}

        api_key = os.environ.get("ZILLOW_KEY")
        print(api_key)
        if not api_key:
            logger.error("Zillow API key not found in environment variables")
            return JSONResponse(status_code=500, content={"error": "API key not found. Please set ZILLOW_RAPIDAPI_KEY in your .env file."})

        headers = {
            "x-rapidapi-key": api_key,
            "x-rapidapi-host": "zillow56.p.rapidapi.com"
        }

        logger.info(f"Calling Zillow market data API for {location}")
        response = requests.get(url, headers=headers, params=querystring)

        if not response.ok:
            logger.error(f"Zillow API error: {response.status_code} - {response.text}")
            return JSONResponse(status_code=500, content={"error": f"Zillow API error: {response.status_code}"})

        json_data = response.json()
        results = {
            "location_info": {},
            "market_status": {},
            "summary_metrics": {},
            "price_distribution": {},
            "national_comparison": {},
            "nearby_areas": [],
            "historical_trends": {}
        }

        if "errors" in json_data and json_data["errors"]:
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

        logger.info(f"Successfully calculated market trends for {location}")
        return {"location": location, "trends": results}

    except Exception as e:
        error_message = f"Unexpected error in market trends endpoint: {str(e)}"
        logger.error(error_message)
        return JSONResponse(status_code=500, content={"error": error_message})



#######################################################################################################################################

# Correct the linkn s in chat
def parse_ui_context(context_str):
    """Parse the UI context string into a structured format with UI link information."""
    try:
        context = json.loads(context_str) if context_str else {}
        ui_context = context.get('ui_context', {})
        
        # Create a human-readable context string
        context_description = []
        available_sections = []
        property_tabs = []
        
        # First check if we're in a property view with tabs
        if ui_context.get('propertyContext') or ui_context.get('currentProperty'):
            # Add available property tab links
            property_tabs = [
                "[[property details]] - Shows details about this property",
                "[[price history]] - Shows the property's price and tax history",
                "[[property schools]] - Shows nearby schools",
                "[[property market analysis]] - Shows market analysis for this property"
            ]
            
            # Extract detailed property information from propertyContext if available
            property_context = ui_context.get('propertyContext', {})
            if property_context:
                context_description.append(f"This is a {property_context.get('beds', '')}bd {property_context.get('baths', '')}ba {property_context.get('type', 'property')} at {property_context.get('address', '')}, priced at ${property_context.get('price', 0):,}.")
                context_description.append(f"It was built in {property_context.get('yearBuilt', 'N/A')} and has {property_context.get('sqft', 0)} square feet.")
                
                # Add price history if available
                if property_context.get('priceHistory'):
                    price_history = property_context.get('priceHistory', [])
                    if price_history:
                        context_description.append(f"Price history includes {len(price_history)} events:")
                        # Include up to 3 most recent price events
                        for event in price_history[:3]:
                            context_description.append(f"- {event.get('date')}: {event.get('event')} at ${event.get('price', 0):,}")
                
                # Add tax history if available
                if property_context.get('taxHistory'):
                    tax_history = property_context.get('taxHistory', [])
                    if tax_history:
                        most_recent_tax = tax_history[0]
                        context_description.append(f"Most recent property tax (year {most_recent_tax.get('year')}): ${most_recent_tax.get('taxPaid', 0):,}")
                        if most_recent_tax.get('value'):
                            context_description.append(f"Assessed value: ${most_recent_tax.get('value', 0):,}")
                
                # Add school information if available
                if property_context.get('schools'):
                    schools = property_context.get('schools', [])
                    context_description.append(f"The property is near {len(schools)} schools:")
                    # Include up to 3 schools
                    for school in schools[:3]:
                        context_description.append(f"- {school.get('name')}: {school.get('type')}, rating {school.get('rating')}/10, {school.get('distance')} miles away")
                
                # Add feature summaries
                if property_context.get('features'):
                    features = property_context.get('features', {})
                    if features.get('appliances'):
                        context_description.append(f"Appliances: {', '.join(features.get('appliances', []))}")
                    if features.get('heating'):
                        context_description.append(f"Heating: {', '.join(features.get('heating', []))}")
                    if features.get('cooling'):
                        context_description.append(f"Cooling: {', '.join(features.get('cooling', []))}")
            else:
                # If no detailed context, use simpler info from currentProperty
                current_property = ui_context.get('currentProperty', {})
                if current_property:
                    context_description.append(f"This is a {current_property.get('beds', '')}bd {current_property.get('baths', '')}ba {current_property.get('type', 'property')} at {current_property.get('address', '')}, priced at ${current_property.get('price', 0):,}.")
        
        # Add standard UI sections if available
        if ui_context.get('hasMarketData', False) or ui_context.get('zipCode'):
            available_sections.append("[[market trends]] - Shows market data for the area")
            
        if ui_context.get('propertiesCount', 0) > 0 or ui_context.get('zipCode'):
            available_sections.append("[[properties]] - Shows properties in the area")
            context_description.append(f"There are {ui_context.get('propertiesCount', 0)} properties displayed in the UI.")
        
        if ui_context.get('hasRestaurants', False) or ui_context.get('zipCode'):
            available_sections.append("[[restaurants]] or [[local amenities]] - Shows dining and amenities in the area")
            context_description.append(f"There are {ui_context.get('restaurantCount', 0)} restaurants shown in the UI.")
        
        if ui_context.get('hasTransit', False) or ui_context.get('zipCode'):
            available_sections.append("[[transit]] - Shows transit options in the area")
            context_description.append(f"There are {ui_context.get('transitCount', 0)} transit options shown in the UI.")
            
        # Add zip code context
        if ui_context.get('zipCode'):
            context_description.append(f"The user is looking at data for ZIP code {ui_context.get('zipCode')}.")
        
        # Add reminder about section links
        link_reminder = """
IMPORTANT REMINDER:
- ALWAYS include at least one section link in your response
- When talking about the property, use the property tab links (e.g., [[property details]], [[price history]])
- When talking about the area, use the section links (e.g., [[market trends]], [[restaurants]])
- Use the EXACT syntax shown above for links
"""
        
        # Combine all sections based on context
        result = ""
        if property_tabs:
            result += "PROPERTY TAB LINKS (USE THESE EXACT FORMATS):\n" + "\n".join(property_tabs) + "\n\n"
        
        if available_sections:
            result += "AREA SECTION LINKS (USE THESE EXACT FORMATS):\n" + "\n".join(available_sections) + "\n\n"
            
        result += "UI CONTEXT:\n" + "\n".join(context_description) + "\n\n" + link_reminder
        
        return result
    except Exception as e:
        logger.error(f"Error parsing UI context: {e}")
        return "UI context not available. Include general links to [[properties]], [[market trends]], [[restaurants]], and [[transit]] in your response."


# Update the createLinkableContent function in ChatContext.tsx to include property market link
# On the backend, add a function to classify queries with the LLM
def classify_query(query):
    try:
        classification_prompt = f"""
        Classify the following real estate question into exactly one of these categories:
        - FAQ: General questions about processes, definitions, or explanations
        - Regional: Questions about specific areas, neighborhoods, or locations
        - Legal: Questions about laws, regulations, taxes, or legal requirements

        Question: {query}

        Classification (FAQ/Regional/Legal):
        """
        messages = [{"role": "user", "content": classification_prompt}]
        response = LLM.invoke(messages)
        classification = response.content.strip().lower()
        if "faq" in classification:
            return "faq"
        elif "regional" in classification:
            return "regional"
        elif "legal" in classification:
            return "legal"
        else:
            return "general"
    except Exception as e:
        logger.error(f"Classification error: {str(e)}")
        return "general"

@app.post(
    "/api/chat",
    response_model=ChatResponse,
    responses={
        500: {"model": ChatErrorResponse, "description": "Internal Server Error"}
    }
)

async def chat(data: ChatRequest):
    session_id = data.session_id
    user_lang  = (data.language or "en").lower()
    original   = data.message
    try:
        logger.info(f"Received chat request: {data}")
        feature_context = data.feature_context or ""
        is_system_query = data.is_system_query

        if user_lang != "en":
            logger.info(f"Translating user → en: {original[:50]}…")
            message_en = await translate_text(original, user_lang, "en")
        else:
            message_en = original

        # Generate a new session ID if needed
        if not session_id or session_id not in chat_histories:
            session_id = str(uuid.uuid4())
            chat_histories[session_id] = []
            logger.info(f"Created new session: {session_id}")

        # Handle system queries
        if is_system_query:
            # [existing system query handler code]
            pass

        # Extract features and UI context
        extracted_features = {}
        query_type = "general"
        ui_context = ""
        
        if LLM:  # Only try to extract features if LLM is available
            try:
                extracted_features = extract_query_features(message_en)
                logger.info(f"Extracted features: {extracted_features}")
                query_type = extracted_features.get('queryType', 'general')
                
                # Parse UI context
                ui_context = parse_ui_context(feature_context)
                logger.info(f"Parsed UI context: {ui_context}")
                
            except Exception as e:
                logger.error(f"Feature extraction or UI context parsing failed: {str(e)}")
                # [existing fallback code]
        else:
            logger.warning("Skipping feature extraction - LLM not available")
        
        formatted_response = None 

        # Process chat message
        if LLM:
            try:
                # Create prompt with UI context
                system_content = ENHANCED_SYSTEM_PROMPT.format(
                    ui_context=ui_context,
                    question=message_en
                )
                
                messages = [
                    {"role": "system", "content": system_content},
                ]
                
                chat_history = chat_histories[session_id]
                for user_msg, bot_msg in chat_history:
                    messages.append({"role": "user", "content": user_msg})
                    messages.append({"role": "assistant", "content": bot_msg})
                
                messages.append({"role": "user", "content": message_en})
                logger.info(f"Sending {len(messages)} messages to LLM with enhanced UI context")
                response_obj = LLM.invoke(messages)
                
                en_reply = response_obj.content
                logger.info("Received English reply from LLM")

                if user_lang != "en":
                    logger.info(f"Translating en → {user_lang}: {en_reply[:50]}…")
                    translated_reply = await translate_text(en_reply, "en", user_lang)
                else:
                    translated_reply = en_reply

                # Format links in the response
                try:
                    formatted_response = format_response_with_links(translated_reply)
                    logger.info("Formatted response with links")
                except Exception as e:
                    logger.error(f"Link-formatting failed: {e}")
                    formatted_response = translated_reply  # fall back to raw text
            except Exception as e:
                formatted_response = f"I'm sorry, I encountered an error while processing your request: {str(e)}"
                logger.error(f"Error calling LLM: {str(e)}")
        else:
            formatted_response = "I'm sorry, but I'm currently unable to connect to the AI service. Please try again later."
            logger.error("LLM not initialized, returning error message")

        # Save to chat history and return
        chat_histories[session_id].append((original, formatted_response))
        result = {
            "session_id": session_id,
            "response": formatted_response,
            "extracted_features": extracted_features
        }
        logger.info(f"Returning response for session {session_id}")
        return result

    except Exception as e:
        error_message = f"Unexpected error in chat endpoint: {str(e)}"
        logger.error(error_message)
        return JSONResponse(status_code=500, content={
            "error": error_message,
            "session_id": session_id if 'session_id' in locals() else None,
            "response": "I'm sorry, something went wrong. Please try again later."
        })


@app.post("/api/nearby_zips")
async def nearby_zips(data: LocationRequest):
    try:
        zip_code = data.zipCode
        if not zip_code:
            return JSONResponse(status_code=400, content={"error": "Missing zip code"})
            
        # Get coordinates for the zip code
        coords = get_lat_long(zip_code)
        if not coords:
            return JSONResponse(status_code=400, content={"error": "Could not find coordinates for zip code"})
            
        # Use Google Maps API to find nearby postal codes
        nearby_zips = []
        lat, lng = coords
        
        # Use geocoding to find nearby zip codes (simplified)
        for i in range(1, 6):  # Find 5 nearby zip codes
            # Calculate points in different directions
            offset_lat = lat + (0.02 * math.cos(i * math.pi / 2.5))
            offset_lng = lng + (0.02 * math.sin(i * math.pi / 2.5))
            
            geolocator = Nominatim(user_agent="geo_locator")
            result = geolocator.reverse((offset_lat, offset_lng))
            if result:
                for address in result:
                    if 'postal_code' in address.raw:
                        nearby_zips.append(address.raw['postal_code'])
                        break
        
        # Remove duplicates and the original zip
        nearby_zips = list(set([z for z in nearby_zips if z != zip_code]))[:5]
        
        return JSONResponse(content={"nearby_zips": nearby_zips})
    except Exception as e:
        logger.error(f"Error finding nearby zip codes: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "llm_initialized": LLM is not None}

@app.post(
    "/api/search_agents",
    response_model=AgentSearchResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def search_agents(data: AgentSearchRequest):
    try:
        logger.info(f"Received agent search request: {data}")
        url = "https://zillow56.p.rapidapi.com/search_agents"
        querystring = {
            "location": data.location,
            "specialty": data.specialty,
            "language": data.language
        }
        headers = {
            "x-rapidapi-key": os.environ.get("ZILLOW_KEY"),
            "x-rapidapi-host": "zillow56.p.rapidapi.com"
        }

        response = requests.get(url, headers=headers, params=querystring)
        if not response.ok:
            logger.error(f"Zillow API error: {response.status_code} - {response.text}")
            return JSONResponse(status_code=500, content={"error": "Failed to fetch agents from Zillow API"})

        agents = response.json()
        logger.info(f"Found {len(agents)} agents for location: {data.location}")
        return {"agents": agents}
    except Exception as e:
        error_message = f"Unexpected error in agent search endpoint: {str(e)}"
        logger.error(error_message)
        return JSONResponse(status_code=500, content={"error": error_message})