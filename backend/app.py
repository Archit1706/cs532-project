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

class ChatResponse(BaseModel):
    session_id: str
    response: str
    extracted_features: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ChatErrorResponse(BaseModel):
    error: str
    session_id: Optional[str]
    response: str


# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS for all routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
You are an expert real estate assistant named REbot. You help users search for properties, track market trends, set preferences, and answer legal questions related to real estate.

Use the following context to answer the question. If you don't know the answer, don't make up information - just say you don't know.

{context}

Question: {question}
Answer:
""")

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

# # Option 1: Use a free external translation API (more reliable for deployment)
# def translate_with_external_api(text, source_lang, target_lang="en"):
#     """Use an external translation API (LibreTranslate) for more reliable service"""
#     try:
#         logger.info(f"Using external API to translate from {source_lang} to {target_lang}, text length: {len(text)}")

#         DEEPL_API_KEY = os.environ['DEEPL_API_KEY'] # key go here
#         # Use LibreTranslate or similar service
#         # Note: For production use, consider setting up your own LibreTranslate instance
#         # or using a paid service with an API key
#         api_url = "https://api-free.deepl.com/v2/translate"
        
#         # # Convert language codes if needed (e.g., 'zh' to 'zh-CN')
#         # lang_map = {
#         #     'zh': 'zh-CN',
#         #     'hi': 'hi', # Add if LibreTranslate uses a different code
#         #     'es': 'es',
#         #     'fr': 'fr',
#         #     'de': 'de',
#         #     'en': 'en'
#         # }
        
#         # source = lang_map.get(source_lang, source_lang)
#         # target = lang_map.get(target_lang, target_lang)
#         #
#         # payload = {
#         #     "q": text,
#         #     "source": source,
#         #     "target": target,
#         #     "format": "text",
#         #     "api_key": ""  # Add API key if you have one
#         # }
#         params = {
#             "auth_key": DEEPL_API_KEY,
#             "text": text,
#             "target_lang": target_lang
#         }
        
#         headers = {
#             "Content-Type": "application/json"
#         }

#         response = requests.post(api_url, headers=headers, data=params, timeout=30)
#         # TODO : replace sync with async for multi user requests
#         if response.status_code != 200:
#             logger.error(f"External translation API error: {response.status_code}, {response.text}")
#             return None
            
#         result = response.json()
#         translated_text = result["translations"][0]["text"]
        
#         if translated_text:
#             logger.info(f"Translation successful: {len(text)} chars → {len(translated_text)} chars")
#             return translated_text
#         else:
#             logger.error(f"Translation failed, no translated text returned: {result}")
#             return None
            
#     except Exception as e:
#         logger.error(f"External translation API error: {str(e)}")
#         return



# @app.route('/api/translate', methods=['POST'])
# def translate_api():
#     """API endpoint for translation with enhanced logging and fallbacks"""
#     start_time = time.time()
    
#     try:
#         data = request.json
#         logger.info(f"📝 Received translation request: {data.get('sourceLanguage')} → {data.get('targetLanguage')}")
        
#         text = data.get('text', '')
#         source_language = data.get('sourceLanguage', 'en')
#         target_language = data.get('targetLanguage', 'en')
        
#         # Debug info
#         logger.info(f"Text length: {len(text)} characters")
#         logger.info(f"First 50 chars: {text[:50]}...")
        
#         if not text:
#             logger.warning("Empty text received for translation")
#             return jsonify({"error": "Missing text to translate", "translatedText": ""}), 400
            
#         # Always translate to the target language, regardless of input language
#         logger.info(f"🔄 Starting translation from {source_language} to {target_language}")
        
#         # IMPORTANT: Choose which translation function to use based on your resources
#         # Option 1: External API (recommended for most deployments)
#         #translated_text = translate_with_external_api(text, source_language, target_language)
        
#         # Option 2: Mock translation (for testing)
#         # translated_text = mock_translate(text, source_language, target_language)
        
#         # Option 3: HuggingFace (if you have sufficient resources)
#         translated_text = translate_with_huggingface(text, source_language, target_language)
        
#         # If translation failed, use original text
#         if translated_text is None:
#             logger.warning("❌ Translation failed, using original text")
#             translated_text = text
            
#         elapsed_time = time.time() - start_time
#         logger.info(f"✅ Translation completed in {elapsed_time:.2f} seconds")
        
#         return jsonify({
#             "translatedText": translated_text,
#             "sourceLanguage": source_language,
#             "targetLanguage": target_language,
#             "processingTime": f"{elapsed_time:.2f}s"
#         })
        
#     except Exception as e:
#         elapsed_time = time.time() - start_time
#         error_message = f"❌ Translation error after {elapsed_time:.2f}s: {str(e)}"
#         logger.error(error_message)
        
#         # Always return something usable, even on error
#         return jsonify({
#             "error": error_message,
#             "translatedText": data.get('text', '') if 'data' in locals() else "",
#             "sourceLanguage": data.get('sourceLanguage', 'unknown') if 'data' in locals() else "unknown",
#             "targetLanguage": data.get('targetLanguage', 'unknown') if 'data' in locals() else "unknown"
#         }), 500
    
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
    try:
        logger.info(f"Received chat request: {data}")
        message = data.message
        session_id = data.session_id
        location_context = data.location_context or ""
        feature_context = data.feature_context or ""
        is_system_query = data.is_system_query

        # Generate a new session ID if needed
        if not session_id or session_id not in chat_histories:
            session_id = str(uuid.uuid4())
            chat_histories[session_id] = []
            logger.info(f"Created new session: {session_id}")

        # Handle system queries
        if is_system_query:
            logger.info("Processing system query")
            try:
                if not LLM:
                    return JSONResponse(status_code=500, content={
                        "error": "LLM not initialized",
                        "session_id": session_id,
                        "response": "Error: LLM service is not available"
                    })
                
                messages = [
                    {"role": "system", "content": "You are a system processing component for real estate queries."},
                    {"role": "user", "content": message}
                ]
                logger.info("Sending system query to LLM")
                response_obj = LLM.invoke(messages)
                response = response_obj.content
                logger.info("Received system response from LLM")
                return {"session_id": session_id, "response": response}
            except Exception as e:
                logger.error(f"Error in system query: {str(e)}")
                return JSONResponse(status_code=500, content={
                    "error": str(e),
                    "session_id": session_id,
                    "response": f"Error: {str(e)}"
                })

        # Extract features - with better error handling
        extracted_features = {}
        query_type = "general"  # Default fallback
        
        if LLM:  # Only try to extract features if LLM is available
            try:
                extracted_features = extract_query_features(message)
                logger.info(f"Extracted features: {extracted_features}")
                query_type = extracted_features.get('queryType', 'general')
            except Exception as e:
                logger.error(f"Feature extraction failed: {str(e)}")
                # Fallback to simple classification if we have LLM
                try:
                    query_type = classify_query(message)
                    logger.info(f"Query classified as: {query_type}")
                except Exception as classify_err:
                    logger.error(f"Classification also failed: {str(classify_err)}")
        else:
            logger.warning("Skipping feature extraction - LLM not available")

        # Process chat message
        if LLM:
            try:
                system_content = f"You are an expert real estate assistant named REbot. You are handling a {query_type} question."
                if feature_context:
                    system_content += f"\n\nExtracted features: {feature_context}"
                if location_context:
                    system_content += f"\n\nLocation context: {location_context}"
                
                messages = [
                    {"role": "system", "content": system_content},
                ]
                
                chat_history = chat_histories[session_id]
                for user_msg, bot_msg in chat_history:
                    messages.append({"role": "user", "content": user_msg})
                    messages.append({"role": "assistant", "content": bot_msg})
                
                messages.append({"role": "user", "content": message})
                logger.info(f"Sending {len(messages)} messages to LLM")
                response_obj = LLM.invoke(messages)
                response = response_obj.content
                logger.info("Received response from LLM")
            except Exception as e:
                response = f"I'm sorry, I encountered an error while processing your request: {str(e)}"
                logger.error(f"Error calling LLM: {str(e)}")
        else:
            response = "I'm sorry, but I'm currently unable to connect to the AI service. Please try again later."
            logger.error("LLM not initialized, returning error message")

        # Save to chat history and return
        chat_histories[session_id].append((message, response))
        result = {
            "session_id": session_id,
            "response": response,
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
    
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "llm_initialized": LLM is not None}