# Real Estate Chat Assistant

This application integrates a real estate chatbot powered by Azure OpenAI into a Next.js frontend.

## Features

- Intelligent AI chatbot for real estate queries
- Property search functionality
- Market trend analysis
- Location-based searches
- Session persistence for continuous conversations

## Architecture

The application consists of two main components:

1. **Frontend**: Next.js React application
2. **Backend**: Flask API with LLM integration

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- Azure OpenAI API access
- SerpAPI key (for location searches)

### Backend Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install flask langchain geopy python-dotenv azure-openai google-search-results
   ```

3. Create a `.env` file in the backend directory with your API keys (see `.env.example`).

4. Start the Flask server:
   ```bash
   flask run
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`.

## Project Structure

```
├── backend/
│   ├── app.py                 # Flask application
│   ├── property_retriever.py  # Property search functionality
│   └── requirements.txt       # Python dependencies
│
├── frontend/
│   ├── components/            # React components
│   ├── pages/                 # Next.js pages
│   │   ├── index.tsx          # Home page
│   │   ├── chat.tsx           # Chat interface
│   │   └── api/               # API routes
│   ├── public/                # Static assets
│   └── package.json           # Node.js dependencies
│
└── README.md                  # Project documentation
```

## Integration Details

### LLM Integration

The application uses Azure OpenAI's GPT models to provide intelligent responses to user queries. The integration happens through LangChain, which provides a framework for connecting with the Azure OpenAI API.

### API Flows

1. User sends a message from the frontend
2. The message is sent to the Next.js API route
3. The API route forwards the request to the Flask backend
4. The Flask backend processes the message:
   - For property searches, it uses the PropertyRetriever
   - For location queries, it uses SerpAPI
   - For general questions, it uses the Azure OpenAI LLM
5. The response is sent back to the frontend
6. The frontend displays the response to the user

## Future Improvements

- Integration with Zillow or MLS APIs for real property data
- User authentication and personalized recommendations
- Property favoriting and comparison features
- Mortgage calculator integration
- Virtual property tour scheduling