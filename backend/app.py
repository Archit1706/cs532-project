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
import http.client
import json
import urllib.parse
from transformers import MarianMTModel, MarianTokenizer
import torch
import time

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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

def search_nearby_places(location, query_type="Restaurants"):
    logger.info(f"Searching for {query_type} near {location}")
    
    # Check if location is a zip code
    if isinstance(location, str) and location.isdigit() and len(location) == 5:
        zip_code = location
        location = f"{location}, USA"  # For geocoding
    else:
        zip_code = None
    
    coords = get_lat_long(location)
    if not coords:
        return {"error": "Could not find coordinates for the given location.", "results": []}
    
    latitude, longitude = coords
    
    # SerpAPI search
    serpapi_key = os.environ.get('SERPAPI_KEY')
    if not serpapi_key:
        return {"error": "Missing API key", "results": []}
        
    params = {
        "engine": "google_local",
        "q": query_type,
        "ll": f"@{latitude},{longitude},15z",
        "location": zip_code if zip_code else location,  # Use numeric zip when possible
        "google_domain": "google.com",
        "gl": "us",
        "hl": "en",
        "api_key": serpapi_key
    }
    
    try:
        search = GoogleSearch(params)
        results = search.get_dict()
        local_results = results.get("local_results", [])
        
        # Calculate distance for each result
        for place in local_results:
            if "gps_coordinates" in place:
                lat = place["gps_coordinates"].get("latitude")
                lon = place["gps_coordinates"].get("longitude")
                if lat is not None and lon is not None:
                    place["distance"] = round(geodesic(coords, (lat, lon)).miles, 2)
        
        # Sort by distance
        sorted_results = sorted(local_results, key=lambda x: x.get("distance", float('inf')))
        
        # Format results
        formatted_results = []
        for place in sorted_results:
            formatted_results.append({
                "title": place.get("title", "Unknown"),
                "address": place.get("address", "No address"),
                "category": place.get("type", ""),
                "distance": place.get("distance", None)
            })
        
        return {
            "coordinates": {"latitude": latitude, "longitude": longitude},
            "results": formatted_results
        }
    except Exception as e:
        logger.error(f"Error in search: {str(e)}")
        return {"error": str(e), "results": []}


# get api_key from https://rapidapi.com/s.mahmoud97/api/zillow56/playground/apiendpoint_444379e9-126c-4fd2-b584-1c9c355e3d8f
def search_nearby_houses(zipcode, query_type="house"):
    logger.info(f"Searching for {query_type} near {zipcode}")
    
    if not isinstance(zipcode, str) or not zipcode.isdigit() or len(zipcode) != 5:
        return {"error": "Please input 5 digits zipcode.", "results": []}
    
    zillowapi_key = os.environ.get('ZILLOW_KEY')
    if not zillowapi_key:
        return {"error": "Missing Zillow API key", "results": []}
        
    # Try with zip code in the format of "zipcode, USA"
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
        
        # Log response status
        logger.info(f"Zillow API response status: {response.status}")
        
        data = response.read().decode('utf-8')
        
        # Log a snippet of the response for debugging
        logger.info(f"Zillow API response snippet: {data[:200]}...")
        
        formatted_results = json.loads(data)
        
        # Check if we got any results
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
    



@app.route('/api/properties', methods=['POST'])
def properties():
    try:
        data = request.json
        logger.info(f"Received property search request: {data}")
        
        zip_code = data.get('zipCode')
        
        if not zip_code or not zip_code.isdigit() or len(zip_code) != 5:
            return jsonify({"error": "Invalid zip code", "results": []}), 400
            
        # Search for properties
        results = search_nearby_houses(zip_code)
        logger.info(f"Found {len(results.get('results', []))} properties")
        
        return jsonify(results)
        
    except Exception as e:
        error_message = f"Unexpected error in properties endpoint: {str(e)}"
        logger.error(error_message)
        return jsonify({
            "error": error_message,
            "results": []
        }), 500
    
##########################################################################################################################################

# Translate functions
##########################################################################################################################################


# Function to get or load a translation model and tokenizer
def get_translation_model(source_lang, target_lang):
    model_key = f"{source_lang}-{target_lang}"
    
    # Handle English as source language directly
    if source_lang == 'en':
        model_name = f"Helsinki-NLP/opus-mt-en-{target_lang}"
    # Handle English as target language directly
    elif target_lang == 'en':
        model_name = f"Helsinki-NLP/opus-mt-{source_lang}-en"
    # Handle non-English to non-English by translating to English first
    else:
        return None  # Will handle this case with two separate translations
    
    # Check if the model is already loaded
    if model_key not in translation_models:
        try:
            logger.info(f"Loading translation model: {model_name}")
            tokenizer = MarianTokenizer.from_pretrained(model_name)
            model = MarianMTModel.from_pretrained(model_name)
            
            translation_models[model_key] = {
                "tokenizer": tokenizer,
                "model": model
            }
            logger.info(f"Model {model_name} loaded successfully")
        except Exception as e:
            logger.error(f"Error loading translation model {model_name}: {str(e)}")
            return None
    
    return translation_models[model_key]

# Function to identify and preserve proper nouns
def preserve_proper_nouns(text):
    # Pattern for addresses, names of places, etc.
    patterns = [
        r'\b\d+\s+[A-Z][a-z]+\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Pl|Place)\b',  # Addresses
        r'\b[A-Z][a-z]+\s+(?:Park|Square|Plaza|Center|Mall|Station|Restaurant)\b',  # Named places
        r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b'  # Proper names with 2-4 words
    ]
    
    # Find all matches
    proper_nouns = []
    for pattern in patterns:
        matches = re.finditer(pattern, text)
        for match in matches:
            proper_nouns.append((match.group(), match.start(), match.end()))
    
    # Sort by position to process from end to beginning (to avoid offset issues)
    proper_nouns.sort(key=lambda x: x[1], reverse=True)
    
    # Replace proper nouns with placeholders
    modified_text = text
    replacements = {}
    
    for i, (noun, start, end) in enumerate(proper_nouns):
        placeholder = f"__PROPER_NOUN_{i}__"
        modified_text = modified_text[:start] + placeholder + modified_text[end:]
        replacements[placeholder] = noun
    
    return modified_text, replacements

# Function to restore proper nouns after translation
def restore_proper_nouns(translated_text, replacements):
    restored_text = translated_text
    for placeholder, original in replacements.items():
        restored_text = restored_text.replace(placeholder, original)
    return restored_text

# Main translation function
def translate_text(text, source_lang, target_lang):
    # Early return if languages are the same
    if source_lang == target_lang:
        return text
    
    try:
        # Preserve proper nouns
        modified_text, replacements = preserve_proper_nouns(text)
        
        # Direct translation if we have a model for this language pair
        translation_model = get_translation_model(source_lang, target_lang)
        
        if translation_model:
            # Translate text
            tokenizer = translation_model["tokenizer"]
            model = translation_model["model"]
            
            # Process markdown structure to preserve it
            # Split text by code blocks and other markdown elements
            # This is a simplified approach - real implementation would need more robust markdown parsing
            text_chunks = []
            is_code_block = False
            current_chunk = ""
            
            for line in modified_text.split('\n'):
                if line.strip().startswith('```'):
                    if current_chunk:
                        text_chunks.append((current_chunk, is_code_block))
                        current_chunk = ""
                    is_code_block = not is_code_block
                    text_chunks.append((line, True))  # Treat markdown symbols as code
                else:
                    current_chunk += line + '\n'
            
            if current_chunk:
                text_chunks.append((current_chunk, is_code_block))
            
            # Translate each non-code chunk
            translated_chunks = []
            for chunk, is_code in text_chunks:
                if is_code:
                    translated_chunks.append(chunk)  # Don't translate code or markdown symbols
                else:
                    # Split into smaller pieces if chunk is too large
                    if len(chunk) > 500:
                        sentences = chunk.split('. ')
                        translated_sentences = []
                        
                        for sentence in sentences:
                            if not sentence.strip():
                                translated_sentences.append(sentence)
                                continue
                                
                            inputs = tokenizer.encode(sentence, return_tensors="pt", max_length=512, truncation=True)
                            outputs = model.generate(inputs, max_length=512, num_beams=4, early_stopping=True)
                            translated_sentence = tokenizer.decode(outputs[0], skip_special_tokens=True)
                            translated_sentences.append(translated_sentence)
                        
                        translated_chunk = '. '.join(translated_sentences)
                    else:
                        inputs = tokenizer.encode(chunk, return_tensors="pt", max_length=512, truncation=True)
                        outputs = model.generate(inputs, max_length=512, num_beams=4, early_stopping=True)
                        translated_chunk = tokenizer.decode(outputs[0], skip_special_tokens=True)
                    
                    translated_chunks.append(translated_chunk)
            
            translated_text = ''.join(translated_chunks)
            
        else:
            # Two-step translation: source -> English -> target
            if source_lang != 'en':
                # First translate to English
                en_model = get_translation_model(source_lang, 'en')
                if not en_model:
                    logger.error(f"No translation model available for {source_lang} to en")
                    return text
                
                tokenizer = en_model["tokenizer"]
                model = en_model["model"]
                
                inputs = tokenizer.encode(modified_text, return_tensors="pt", max_length=512, truncation=True)
                outputs = model.generate(inputs, max_length=512, num_beams=4, early_stopping=True)
                english_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            else:
                english_text = modified_text
            
            # Then translate from English to target
            if target_lang != 'en':
                target_model = get_translation_model('en', target_lang)
                if not target_model:
                    logger.error(f"No translation model available for en to {target_lang}")
                    return text if source_lang == 'en' else english_text
                
                tokenizer = target_model["tokenizer"]
                model = target_model["model"]
                
                inputs = tokenizer.encode(english_text, return_tensors="pt", max_length=512, truncation=True)
                outputs = model.generate(inputs, max_length=512, num_beams=4, early_stopping=True)
                translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            else:
                translated_text = english_text
        
        # Restore proper nouns
        final_text = restore_proper_nouns(translated_text, replacements)
        return final_text
        
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return text  # Return original text on error
    

import requests
import json   


# Option 1: Use a free external translation API (more reliable for deployment)
def translate_with_external_api(text, source_lang, target_lang="en"):
    """Use an external translation API (LibreTranslate) for more reliable service"""
    try:
        logger.info(f"Using external API to translate from {source_lang} to {target_lang}, text length: {len(text)}")

        DEEPL_API_KEY = os.environ['DEEPL_API_KEY'] # key go here
        # Use LibreTranslate or similar service
        # Note: For production use, consider setting up your own LibreTranslate instance
        # or using a paid service with an API key
        api_url = "https://api-free.deepl.com/v2/translate"
        
        # # Convert language codes if needed (e.g., 'zh' to 'zh-CN')
        # lang_map = {
        #     'zh': 'zh-CN',
        #     'hi': 'hi', # Add if LibreTranslate uses a different code
        #     'es': 'es',
        #     'fr': 'fr',
        #     'de': 'de',
        #     'en': 'en'
        # }
        
        # source = lang_map.get(source_lang, source_lang)
        # target = lang_map.get(target_lang, target_lang)
        #
        # payload = {
        #     "q": text,
        #     "source": source,
        #     "target": target,
        #     "format": "text",
        #     "api_key": ""  # Add API key if you have one
        # }
        params = {
            "auth_key": DEEPL_API_KEY,
            "text": text,
            "target_lang": target_lang
        }
        
        headers = {
            "Content-Type": "application/json"
        }

        response = requests.post(api_url, headers=headers, data=params, timeout=30)
        # TODO : replace sync with async for multi user requests
        if response.status_code != 200:
            logger.error(f"External translation API error: {response.status_code}, {response.text}")
            return None
            
        result = response.json()
        translated_text = result["translations"][0]["text"]
        
        if translated_text:
            logger.info(f"Translation successful: {len(text)} chars → {len(translated_text)} chars")
            return translated_text
        else:
            logger.error(f"Translation failed, no translated text returned: {result}")
            return None
            
    except Exception as e:
        logger.error(f"External translation API error: {str(e)}")
        return

# Option 2: Simple mock translation for testing - use this if the API is not working
def mock_translate(text, source_lang, target_lang):
    """Mock translation for testing purposes"""
    logger.info(f"Using MOCK translation from {source_lang} to {target_lang}")
    
    # Just add a prefix to indicate "translation" happened
    return f"[{target_lang}] {text}"

# Option 3: Improved HuggingFace translation (use if you have GPU resources)
def translate_with_huggingface(text, source_lang, target_lang):
    """Use HuggingFace models for translation with improved error handling"""
    try:
        logger.info(f"Using HuggingFace to translate from {source_lang} to {target_lang}, text length: {len(text)}")
        
        # Import here to avoid loading unless needed
        from transformers import MarianMTModel, MarianTokenizer
        import torch
        
        # Set a flag to indicate if we're in testing mode
        testing_mode = False
        
        if testing_mode:
            logger.info("TESTING MODE: Using mock translation")
            return mock_translate(text, source_lang, target_lang)
        
        # Handle language code mapping
        lang_code_map = {
            'en': 'en',
            'es': 'es',
            'fr': 'fr',
            'de': 'de',
            'hi': 'hi',
            'zh': 'zh',
        }
        
        source = lang_code_map.get(source_lang, source_lang)
        target = lang_code_map.get(target_lang, target_lang)
        
        # Define model name based on source and target
        if source == 'en':
            model_name = f"Helsinki-NLP/opus-mt-en-{target}"
        elif target == 'en':
            model_name = f"Helsinki-NLP/opus-mt-{source}-en"
        else:
            # For language pairs without direct models, translate through English
            logger.info(f"No direct {source}-{target} model, translating via English")
            
            # First translate to English
            english_text = translate_with_huggingface(text, source, 'en')
            if not english_text:
                logger.error(f"Failed to translate {source} to en")
                return None
                
            # Then translate from English to target
            return translate_with_huggingface(english_text, 'en', target)
        
        logger.info(f"Loading translation model: {model_name}")
        
        try:
            tokenizer = MarianTokenizer.from_pretrained(model_name)
            model = MarianMTModel.from_pretrained(model_name)
            
            # Split text into chunks to handle long text
            max_length = 512
            words = text.split()
            chunks = []
            current_chunk = []
            
            for word in words:
                current_chunk.append(word)
                if len(' '.join(current_chunk)) > max_length:
                    chunks.append(' '.join(current_chunk[:-1]))
                    current_chunk = [current_chunk[-1]]
            
            if current_chunk:
                chunks.append(' '.join(current_chunk))
                
            if not chunks:
                chunks = [text]
                
            logger.info(f"Split text into {len(chunks)} chunks for translation")
            
            translated_chunks = []
            for i, chunk in enumerate(chunks):
                logger.info(f"Translating chunk {i+1}/{len(chunks)}")
                tokens = tokenizer(chunk, return_tensors="pt", padding=True, truncation=True, max_length=max_length)
                translated = model.generate(**tokens)
                translated_text = tokenizer.batch_decode(translated, skip_special_tokens=True)[0]
                translated_chunks.append(translated_text)
            
            result = ' '.join(translated_chunks)
            logger.info(f"Translation successful: {len(text)} chars → {len(result)} chars")
            return result
            
        except Exception as e:
            logger.error(f"HuggingFace translation error for {model_name}: {str(e)}")
            # Fall back to external API if HuggingFace fails
            logger.info("Falling back to external translation API")
            return translate_with_external_api(text, source_lang, target_lang)
            
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return None

@app.route('/api/translate', methods=['POST'])
def translate_api():
    """API endpoint for translation with enhanced logging and fallbacks"""
    start_time = time.time()
    
    try:
        data = request.json
        logger.info(f"📝 Received translation request: {data.get('sourceLanguage')} → {data.get('targetLanguage')}")
        
        text = data.get('text', '')
        source_language = data.get('sourceLanguage', 'en')
        target_language = data.get('targetLanguage', 'en')
        
        # Debug info
        logger.info(f"Text length: {len(text)} characters")
        logger.info(f"First 50 chars: {text[:50]}...")
        
        if not text:
            logger.warning("Empty text received for translation")
            return jsonify({"error": "Missing text to translate", "translatedText": ""}), 400
            
        # Always translate to the target language, regardless of input language
        logger.info(f"🔄 Starting translation from {source_language} to {target_language}")
        
        # IMPORTANT: Choose which translation function to use based on your resources
        # Option 1: External API (recommended for most deployments)
        #translated_text = translate_with_external_api(text, source_language, target_language)
        
        # Option 2: Mock translation (for testing)
        # translated_text = mock_translate(text, source_language, target_language)
        
        # Option 3: HuggingFace (if you have sufficient resources)
        translated_text = translate_with_huggingface(text, source_language, target_language)
        
        # If translation failed, use original text
        if translated_text is None:
            logger.warning("❌ Translation failed, using original text")
            translated_text = text
            
        elapsed_time = time.time() - start_time
        logger.info(f"✅ Translation completed in {elapsed_time:.2f} seconds")
        
        return jsonify({
            "translatedText": translated_text,
            "sourceLanguage": source_language,
            "targetLanguage": target_language,
            "processingTime": f"{elapsed_time:.2f}s"
        })
        
    except Exception as e:
        elapsed_time = time.time() - start_time
        error_message = f"❌ Translation error after {elapsed_time:.2f}s: {str(e)}"
        logger.error(error_message)
        
        # Always return something usable, even on error
        return jsonify({
            "error": error_message,
            "translatedText": data.get('text', '') if 'data' in locals() else "",
            "sourceLanguage": data.get('sourceLanguage', 'unknown') if 'data' in locals() else "unknown",
            "targetLanguage": data.get('targetLanguage', 'unknown') if 'data' in locals() else "unknown"
        }), 500
    
##########################################################################################################################################

# FEATURE EXTRACTION
########################################################################################

# Add this function to backend/app.py to classify queries with more detailed features
def extract_query_features(query):
    try:
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
        response = LLM.invoke(messages)
        
        # Extract JSON from response
        content = response.content.strip()
        
        # Log raw response for debugging
        logger.info(f"Raw feature extraction: {content}")
        
        # Try to find JSON in the response
        import re
        import json
        
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            json_str = json_match.group(0)
            features = json.loads(json_str)
            
            # Log extracted features
            logger.info(f"Extracted features: {features}")
            
            return features
        else:
            logger.warning("No JSON found in LLM response")
            return {
                "queryType": "general",
                "zipCode": None,
                "propertyFeatures": {},
                "locationFeatures": {},
                "actionRequested": None,
                "filters": {},
                "sortBy": None
            }
            
    except Exception as e:
        logger.error(f"Feature extraction error: {str(e)}")
        # Fallback to basic classification
        return {
            "queryType": classify_query(query),
            "zipCode": None,
            "propertyFeatures": {},
            "locationFeatures": {},
            "actionRequested": None,
            "filters": {},
            "sortBy": None
        }

##########################################################################################################################################

# R2 Storage Service
##########################################################################################################################################

import json
import datetime
import boto3
from botocore.config import Config
import logging

# R2 Storage Service
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
    # Use your hardcoded values
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

# Add a route to save chat history
@app.route('/api/save_chat', methods=['POST'])
def save_chat():
    try:
        data = request.json
        logger.info(f"Save chat request received: {len(data.get('messages', []))} messages")
        
        session_id = data.get('session_id', 'unknown')
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        file_key = f"chat_{session_id}_{timestamp}.json"
        
        # Create the chat history object
        chat_data = {
            "session_id": session_id,
            "timestamp": timestamp,
            "messages": data.get('messages', []),
            "zipCodes": data.get('zipCodes', [])
        }
        
        # Upload to R2
        try:
            s3_service = new_r2_service()
            s3_service.upload_json_to_r2(file_key, chat_data)
            logger.info(f"Chat data uploaded to R2 successfully: {file_key}")
            r2_upload_success = True
        except Exception as e:
            logger.error(f"R2 upload failed: {str(e)}")
            r2_upload_success = False
        
        return jsonify({
            "success": True, 
            "r2_upload": r2_upload_success,
            "file_key": file_key,
            "timestamp": timestamp
        })
        
    except Exception as e:
        logger.error(f"Failed to save chat: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

##########################################################################################################################################

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
        
        # Extract classification from response
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
    
# Add to backend/app.py
@app.route('/api/extract_features', methods=['POST'])
def extract_features():
    try:
        data = request.json
        logger.info(f"Feature extraction request: {data}")
        
        query = data.get('message', '')
        
        # Extract features from the query
        features = extract_query_features(query)
        
        return jsonify({
            "features": features,
            "success": True
        })
    except Exception as e:
        logger.error(f"Feature extraction error: {str(e)}")
        return jsonify({
            "features": None,
            "success": False,
            "error": str(e)
        }), 500


# Modify in backend/app.py
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        logger.info(f"Received chat request: {data}")
        
        message = data.get('message', '')
        session_id = data.get('session_id')
        location_context = data.get('location_context', '')
        feature_context = data.get('feature_context', '')
        is_system_query = data.get('is_system_query', False)
        
        # Create a new session if none exists
        if not session_id or session_id not in chat_histories:
            session_id = str(uuid.uuid4())
            chat_histories[session_id] = []
            logger.info(f"Created new session: {session_id}")
        
        # For system queries, process differently
        if is_system_query:
            logger.info("Processing system query")
            
            # Direct call to LLM for system queries
            try:
                messages = [
                    {"role": "system", "content": "You are a system processing component for real estate queries."},
                    {"role": "user", "content": message}
                ]
                
                logger.info(f"Sending system query to LLM")
                response_obj = LLM.invoke(messages)
                response = response_obj.content
                logger.info("Received system response from LLM")
                
                # Do not update chat history for system queries
                return jsonify({
                    "session_id": session_id,
                    "response": response
                })
            except Exception as e:
                logger.error(f"Error in system query: {str(e)}")
                return jsonify({
                    "error": str(e),
                    "session_id": session_id,
                    "response": f"Error: {str(e)}"
                }), 500
        
        # Extract features (even for normal queries)
        try:
            extracted_features = extract_query_features(message)
            logger.info(f"Extracted features: {extracted_features}")
            query_type = extracted_features.get('queryType', 'general')
        except Exception as e:
            logger.error(f"Feature extraction failed: {str(e)}")
            extracted_features = {}
            query_type = data.get('query_type', 'general')
        
        # Process normal user query
        if LLM:
            try:
                # Enhanced system message with context
                system_content = f"You are an expert real estate assistant named REbot. You are handling a {query_type} question."
                
                # Add feature context if available
                if feature_context:
                    system_content += f"\n\nExtracted features: {feature_context}"
                
                # Add location context if available
                if location_context:
                    system_content += f"\n\nLocation context: {location_context}"
                
                messages = [
                    {"role": "system", "content": system_content},
                ]
                
                # Add chat history
                chat_history = chat_histories[session_id]
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
        else:
            response = "I'm sorry, but I'm currently unable to connect to the AI service. Please try again later."
            logger.error("LLM not initialized, returning error message")
        
        # Update chat history
        chat_histories[session_id].append((message, response))
        
        result = {
            "session_id": session_id,
            "response": response,
            "extracted_features": extracted_features
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