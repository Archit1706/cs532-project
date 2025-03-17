# RealEstateAI

A conversational AI platform for real estate inquiries, property searches, and market insights.

## Features

- AI chat assistant for real estate questions
- Property listings by zip code
- Nearby restaurants and transit information
- Market trend analysis
- Interactive property details

## Directory Structure

```
cs532-project/
├── backend/
│   ├── app.py                 # Flask API 
│   ├── property_retriever.py  # Property search functionality
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables (create this)
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts       # Chat API endpoint
│   │   ├── health/
│   │   │   └── route.ts       # Health check endpoint
│   │   ├── location/
│   │   │   └── route.ts       # Location search endpoint
│   │   └── properties/
│   │       └── route.ts       # Property listings endpoint
│   ├── chat/
│   │   └── page.tsx           # Main chat interface
│   ├── find_homes/
│   │   └── page.tsx           # Property search page
│   ├── legal/
│   │   └── page.tsx           # Legal information page
│   ├── market-trends/
│   │   └── page.tsx           # Market trends page
│   ├── preferences/
│   │   └── page.tsx           # User preferences page
│   ├── onboarding/
│   │   └── page.tsx           # User onboarding page
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # App layout
│   └── page.tsx               # Homepage
├── public/                    # Static assets
├── .env.local                 # Frontend environment variables
├── next.config.js             # Next.js configuration
├── package.json               # Node dependencies
└── README.md                  # Project documentation
```

## Requirements

- Node.js 18+
- Python 3.8+
- API keys:
  - Azure OpenAI
  - SerpAPI
  - Zillow (RapidAPI)
  - Cloudflare R2 (optional)

## Setup

### Backend

1. Create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create `.env` file with API keys:
   ```
   AZURE_OPENAI_VARE_KEY=your_key_here
   AZURE_ENDPOINT=your_endpoint_here
   SERPAPI_KEY=your_key_here
   ZILLOW_KEY=your_key_here
   CLOUDFLARE_ACCOUNT=account_id
   CLOUDFLARE_KEY=access_key
   CLOUDFLARE_SECRET=secret_key
   ```

4. Start the Flask server:
   ```bash
   python app.py
   ```

### Frontend

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the application at http://localhost:3000

## Usage

1. Enter a 5-digit US zip code to view area information
2. Chat with the AI assistant about real estate topics
3. Click on properties to view detailed information
4. Explore nearby restaurants and transit options

## Technologies

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Flask, LangChain
- **AI**: Azure OpenAI
- **APIs**: SerpAPI (location data), Zillow/RapidAPI (property listings)
- **Storage**: Cloudflare R2 (chat history)

## Future Improvements

- Integration with Zillow or MLS APIs for real property data
- User authentication and personalized recommendations
- Property favoriting and comparison features
- Mortgage calculator integration
- Virtual property tour scheduling
