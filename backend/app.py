from flask import Flask, request, jsonify
import os
import re
from langchain.chat_models import AzureChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from serpapi import GoogleSearch
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import uuid
import logging
from flask_cors import CORS

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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
    # Log API configuration (without secrets)
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

# Google location API functions
# Update the get_lat_long function to increase timeout and add error handling
def get_lat_long(address):
    logger.info(f"Getting coordinates for address: {address}")
    geolocator = Nominatim(user_agent="geo_locator", timeout=5)  # Increase timeout to 5 seconds
    
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
        
        # Hardcoded coordinates for common US zip codes as fallback
        zip_coords = {
            "02108": (42.3583, -71.0603),  # Boston
            "60607": (41.8742, -87.6492),  # Chicago
            "10001": (40.7506, -73.9971),  # New York
            "90210": (34.0901, -118.4065)  # Beverly Hills
        }
        
        if address.startswith(tuple(zip_coords.keys())):
            zip_code = address.split(",")[0].strip()
            logger.info(f"Using fallback coordinates for {zip_code}")
            return zip_coords.get(zip_code)
        return None

# Update in the search_nearby_places function in app.py
def search_nearby_places(location, query_type="Restaurants"):
    logger.info(f"Searching for {query_type} near {location}")
    
    # Check if location is a zip code
    if isinstance(location, str) and location.isdigit() and len(location) == 5:
        location = f"{location}, USA"  # Convert zip to address format
    
    coords = get_lat_long(location)
    if not coords:
        return {"error": "Could not find coordinates for the given location.", "results": []}
    
    latitude, longitude = coords
    
    # SerpAPI search using latitude/longitude
    serpapi_key = os.environ.get('SERPAPI_KEY')
    if not serpapi_key:
        logger.error("Missing SerpAPI key. Check your environment variables.")
        return {"error": "Missing API configuration for location search.", "results": []}
    
    # For transit stations, use a more reliable query approach
    query = query_type
    # For transit stations, use a more reliable query approach
    if query_type.lower() == "transit station":
        params = {
            "engine": "google_local",
            "q": "train OR subway OR metro OR bus station",
            "type": "Transit station",
            "ll": f"@{latitude},{longitude},15z",
            "location": f"{location}",
            "google_domain": "google.com",
            "gl": "us",
            "hl": "en",
            "api_key": serpapi_key
        }
    else:
        params = {
            "engine": "google_local",
            "q": query,
            "ll": f"@{latitude},{longitude},15z",
            "location": "United States",  # Restrict to US locations
            "google_domain": "google.com",  # Use US Google domain
            "gl": "us",  # Set geolocation to US
            "hl": "en",  # Set language to English
            "api_key": serpapi_key
        }

    try:     
        # Rest of the function remains the same...
        search = GoogleSearch(params)
        results = search.get_dict()
        local_results = results.get("local_results", [])
        
        # Filter results to ensure they're in the US (look for US state abbreviations or "USA" in address)
        # Update the US filtering logic in search_nearby_places
        # Replace the existing filtering code with this:

        # Less strict filtering for US results
        us_results = []
        for place in local_results:
            # Accept results without explicit filtering until we have better detection
            us_results.append(place)
            
            # Calculate distance
            if "gps_coordinates" in place:
                lat = place["gps_coordinates"].get("latitude")
                lon = place["gps_coordinates"].get("longitude")
                if lat is not None and lon is not None:
                    place["distance"] = round(geodesic(coords, (lat, lon)).miles, 2)

        logger.info(f"Found {len(us_results)} results")
        
        # If we don't have any US results, return an empty list rather than international results
        if not us_results and local_results:
            logger.warning(f"Found {len(local_results)} results but none in the US. Returning empty list.")
            return {
                "coordinates": {"latitude": latitude, "longitude": longitude},
                "results": []
            }
            
        # Sort results based on distance
        sorted_results = sorted(us_results, key=lambda x: x.get("distance", float('inf')))
        
        # Format the results for frontend display
        formatted_results = []
        for place in sorted_results:
            formatted_results.append({
                "title": place.get("title", "Unknown"),
                "address": place.get("address", "No address"),
                "category": place.get("type", ""),
                "distance": place.get("distance", None)
            })
        
        logger.info(f"Found {len(formatted_results)} US results")
        return {
            "coordinates": {"latitude": latitude, "longitude": longitude},
            "results": formatted_results
        }
    except Exception as e:
        logger.error(f"Error in SerpAPI search: {str(e)}")
        return {"error": f"Error searching for nearby places: {str(e)}"}

# Simple mock data for property examples
property_examples = [
    {
        "address": "123 Main St, Boston, MA",
        "price": "$750,000",
        "beds": 3,
        "baths": 2,
        "sqft": 1800,
        "type": "Single Family"
    },
    {
        "address": "456 Commonwealth Ave, Boston, MA",
        "price": "$1,200,000",
        "beds": 4,
        "baths": 3,
        "sqft": 2400,
        "type": "Townhouse"
    },
    {
        "address": "789 Beacon St, Cambridge, MA",
        "price": "$650,000",
        "beds": 2,
        "baths": 1,
        "sqft": 1100,
        "type": "Condo"
    }
]

# Session management
chat_histories = {}

# Initialize LLM
try:
    LLM = get_llm()
    logger.info("Successfully initialized Azure OpenAI LLM")
except Exception as e:
    logger.error(f"Failed to initialize LLM: {str(e)}")
    LLM = None

@app.route('/api/location', methods=['POST'])
def location():
    try:
        data = request.json
        logger.info(f"Received location request: {data}")
        
        zip_code = data.get('zipCode')
        query_type = data.get('type', 'Restaurants')
        
        if not zip_code:
            return jsonify({"error": "Missing zip code"}), 400
            
        # Search for nearby places
        results = search_nearby_places(zip_code, query_type)
        
        return jsonify(results)
        
    except Exception as e:
        error_message = f"Unexpected error in location endpoint: {str(e)}"
        logger.error(error_message)
        return jsonify({
            "error": error_message,
            "results": []
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        logger.info(f"Received chat request: {data}")
        
        message = data.get('message', '')
        session_id = data.get('session_id')
        location_context = data.get('location_context', '')  # Get location context if provided
        
        # Create a new session if none exists
        if not session_id or session_id not in chat_histories:
            session_id = str(uuid.uuid4())
            chat_histories[session_id] = []
            logger.info(f"Created new session: {session_id}")
        
        # Log location context if provided
        if location_context:
            logger.info(f"Location context provided: {location_context}")
        
        # Check for location-related queries
        if any(keyword in message.lower() for keyword in ['near', 'nearby', 'close to', 'around']):
            logger.info("Processing location-related query")
            # Extract address or use a default
            address_parts = message.split('near')
            if len(address_parts) > 1:
                address = address_parts[1].strip()
                query_type = "Properties" if "properties" in message.lower() else "Restaurants"
                location_results = search_nearby_places(address, query_type)
                
                if "error" in location_results:
                    response = location_results["error"]
                    logger.warning(f"Location search error: {response}")
                else:
                    # Format the response with the top 3 results
                    results = location_results["results"][:3]
                    result_text = ""
                    for i, place in enumerate(results, 1):
                        name = place.get('title', 'Unknown')
                        address = place.get('address', 'No address')
                        distance = place.get('distance', 'Unknown')
                        result_text += f"{i}. {name} - {address} - {distance} miles away\n"
                    
                    response = f"Here are some {query_type.lower()} near {address}:\n{result_text}"
                    logger.info(f"Returning {len(results)} location results")
            else:
                response = "I need a specific address to find nearby places. Could you please provide one?"
                logger.info("No address provided for location search")
        
        # Check for property search queries
        elif any(term in message.lower() for term in ['find homes', 'search properties', 'looking for house', 'properties for sale']):
            logger.info("Processing property search query")
            # Simple property response using mock data
            response = "Here are some properties that might interest you:\n\n"
            for i, prop in enumerate(property_examples, 1):
                response += f"{i}. {prop['address']} - {prop['price']} - {prop['beds']} bed, {prop['baths']} bath, {prop['sqft']} sqft\n"
            logger.info("Returning mock property data")
        
        else:
            logger.info("Processing general query with LLM")
            # Use the LLM for general real estate queries
            chat_history = chat_histories[session_id]
            
            if not LLM:
                response = "I'm sorry, but I'm currently unable to connect to the AI service. Please check back later."
                logger.error("LLM not initialized, returning error message")
            else:
                try:
                    # Direct call to LLM for general questions
                    messages = [
                        {"role": "system", "content": "You are an expert real estate assistant named REbot. You help users find properties, answer real estate questions, and provide market insights. Be helpful, conversational, and informative."},
                    ]
                    
                    # Add location context if provided
                    if location_context:
                        messages[0]["content"] += f"\n\nAdditional context: {location_context}"
                    
                    # Add chat history
                    for user_msg, bot_msg in chat_history:
                        messages.append({"role": "user", "content": user_msg})
                        messages.append({"role": "assistant", "content": bot_msg})
                    
                    # Add current message
                    messages.append({"role": "user", "content": message})
                    
                    logger.info(f"Sending {len(messages)} messages to LLM")
                    
                    # Get response from LLM
                    response_obj = LLM.invoke(messages)
                    response = response_obj.content
                    logger.info("Received response from LLM")
                except Exception as e:
                    response = f"I'm sorry, I encountered an error while processing your request: {str(e)}"
                    logger.error(f"Error calling LLM: {str(e)}")
        
        # Update chat history
        chat_histories[session_id].append((message, response))
        
        result = {
            "session_id": session_id,
            "response": response
        }
        logger.info(f"Returning response for session {session_id}")
        return jsonify(result)
        
    except Exception as e:
        error_message = f"Unexpected error in chat endpoint: {str(e)}"
        logger.error(error_message)
        return jsonify({
            "error": error_message,
            "session_id": session_id if 'session_id' in locals() else None,
            "response": "I'm sorry, something went wrong. Please try again later."
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint to verify the API is running"""
    return jsonify({
        "status": "ok",
        "llm_initialized": LLM is not None
    })

if __name__ == '__main__':
    logger.info("Starting Flask server on port 5000")
    app.run(debug=True)