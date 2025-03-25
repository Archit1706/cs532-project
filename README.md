# RealEstateAI

A conversational AI platform for real estate inquiries, property searches, and market insights.

![Screenshot from the website](https://github.com/Archit1706/cs532-project/blob/b3c8f1ef0725064c2bb3f15fe939987865140497/screenshot.png)

---

## ✨ Features

-   💬 AI-powered chat assistant for real estate queries
-   🏠 Property listings filtered by zip code, beds, baths, price, etc.
-   📊 Market trend insights like price ranges, YOY change, and property types
-   🚇 Nearby restaurants and public transit via SerpAPI
-   🌐 Multilingual support with translation and language selector
-   🔎 LLM-based and regex-based query understanding (hybrid feature extraction)
-   🧠 Context-aware response generation using zip code, search filters, and location info
-   🧭 Tabs for Properties, Restaurants, Transit, Market Analysis
-   🧩 Modular code with reusable components and centralized state using React Context API

---

## 🧾 Directory Structure

```
cs532-project/
├── backend/
│   ├── app.py                     # Flask API
│   ├── property_retriever.py      # Property search functionality
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # Environment variables
│
├── app/
│   ├── api/
│   │   ├── chat/route.ts
│   │   ├── health/route.ts
│   │   ├── ectract_features/route.ts
│   │   ├── market_trends/route.ts
│   │   ├── location/route.ts
│   │   └── properties/route.ts
|
│   ├── chat/page.tsx               # Entry point (now mostly calls reusable components)
│   ├── find_homes/page.tsx
│   ├── legal/page.tsx
│   ├── market-trends/page.tsx
│   ├── preferences/page.tsx
│   ├── onboarding/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
|   ├── layout                   # container for chat UI
│   |   ├── ChatPanel.tsx
│   |   ├── InfoPanel.tsx
│   ├── ChatWindow.tsx
│   ├── MessageInput.tsx         # input box + send button
│   ├── MessageBubble.tsx        # render individual messages
│   ├── QuickQuestions.tsx       # the “Market trends?” buttons
│   ├── LanguageSelector.tsx     # dropdown + translation indicator
│   ├── PropertyDetailCard.tsx
│   ├── WelcomeCard.tsx
│   ├── TabsHeader.tsx
|   ├── Tabs/
│   |   ├── PropertyTab.tsx
│   |   ├── RestaurantTab.tsx
│   |   ├── TransitTab.tsx
│   |   └── MarketTab.tsx
|
├── context/ChatContext.tsx     # Centralized state management
├── hooks/useFeatureExtractor.ts # LLM + Regex-based feature extraction
├── types/chat.ts # Types and Interfaces defined
├── utils/
│   ├── extractRealEstateFeatures.ts   # regex-based
│   ├── llmFeatureExractor.ts          # LLM prompt + fallback
│   ├── locationUtils.ts               # fetchLocationData
│   └── translation.ts                 # translateText, languageOptions
│
├── public/                        # Static assets
├── .env.local                     # Frontend environment variables
├── next.config.js
├── package.json
└── README.md
```

---

## ⚙️ Requirements

-   Node.js 18+
-   Python 3.8+
-   API keys:
    -   Azure OpenAI
    -   SerpAPI
    -   Zillow (RapidAPI)
    -   Cloudflare R2 (optional)

---

## 🛠️ Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file:

```
# Azure OpenAI settings
AZURE_OPENAI_VARE_KEY=your_key_here
AZURE_ENDPOINT=your_endpoint_here
CLOUDFLARE_ACCOUNT=your_account_id
CLOUDFLARE_KEY=your_key_here
CLOUDFLARE_SECRET=54112572aa5f4602b3c32a2cf2cc887a02e2aabc4cd287f2b908263269629ec1

# SerpAPI key for location searches
SERPAPI_KEY=your_key_here

# Flask settings
FLASK_APP=app.py
FLASK_ENV=development

# Zillow API keys
ZILLOW_KEY=your_key_here
ZILLOW_RAPIDAPI_KEY=your_key_here
```

Start the server:

```bash
python app.py
```

---

### Frontend

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Run the dev server:

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🧑‍💻 Usage

-   Enter a 5-digit US zip code to explore the area
-   Use the chat to ask about trends, taxes, safety, etc.
-   Click properties for full details
-   Navigate tabs to see transit, restaurants, and market data
-   Use the language selector for multi-language conversations

---

## 🧰 Technologies Used

| Layer      | Stack                                          |
| ---------- | ---------------------------------------------- |
| Frontend   | Next.js, React, Tailwind CSS                   |
| Backend    | Flask, LangChain                               |
| LLM        | Azure OpenAI API                               |
| APIs       | SerpAPI, Zillow/RapidAPI, GreatSchools, others |
| Storage    | Cloudflare R2 (optional for chat history)      |
| State Mgmt | React Context API + Custom Hooks               |
| i18n       | Translation via `/api/translate` endpoint      |

---

## 🚀 Future Roadmap

-   ✅ Modularized frontend architecture
-   ✅ Feature extraction with LLM fallback
-   [ ] Virtual tours and scheduling
-   [ ] OAuth authentication
-   [ ] Personalized dashboard and saved searches
-   [ ] Mortgage calculators
-   [ ] Mobile-friendly layout
