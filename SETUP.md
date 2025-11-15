# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   cd nextjs-app
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
nextjs-app/
├── app/                    # Next.js App Router (no src folder)
│   ├── api/               # API routes
│   │   ├── analyze/       # Health analysis endpoint
│   │   └── scan/         # Body scan endpoint
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
│
├── components/            # React components
│   ├── layout/          # Layout components (Sidebar)
│   └── pages/          # Page components
│       ├── HealthAnalysisPage.tsx
│       ├── BodyScannerPage.tsx
│       ├── FacilitiesPage.tsx
│       ├── SettingsPage.tsx
│       └── AboutPage.tsx
│
├── lib/                  # Core libraries
│   ├── ai/             # AI services
│   │   ├── client.ts   # Groq AI client
│   │   └── health-analyzer.ts
│   ├── data/          # Data loaders
│   │   └── loader.ts
│   ├── language/      # Language management
│   │   └── manager.ts
│   └── utils.ts      # Utilities
│
├── types/              # TypeScript type definitions
│   └── index.ts
│
├── config/            # Configuration
│   └── index.ts
│
└── data/             # JSON data files
    ├── symptoms_db.json
    └── medical_facilities.json
```

## Key Features

✅ **Clean Architecture**
- No `src` folder (Next.js best practice)
- Flow-based structure
- Type-safe with TypeScript
- Modular design

✅ **AI Integration**
- Groq AI for health analysis
- Structured JSON responses
- Error handling and fallbacks

✅ **Multi-language Support**
- English, Amharic, Tigrinya
- Persistent language preferences
- Client-side language switching

✅ **Modern UI**
- Tailwind CSS styling
- Responsive design
- Clean, intuitive interface

## API Endpoints

### POST /api/analyze
Analyze health symptoms

**Request:**
```json
{
  "userInput": "I have a headache and feel dizzy",
  "additionalContext": {
    "age": 30,
    "gender": "Male",
    "conditions": []
  },
  "language": "en"
}
```

**Response:**
```json
{
  "urgency_level": "medium",
  "possible_conditions": [...],
  "recommended_actions": [...],
  "general_advice": "...",
  "disclaimer": "..."
}
```

### POST /api/scan
Analyze body scan image

**Request:**
```json
{
  "scanDescription": "Image uploaded for skin analysis",
  "scanType": "skin",
  "imageData": "base64_string"
}
```

## Development

- **Type Checking**: `npm run type-check`
- **Linting**: `npm run lint`
- **Build**: `npm run build`
- **Start Production**: `npm start`

## Notes

- All AI processing happens server-side via API routes
- Language preferences are stored in localStorage
- Data files are loaded server-side only
- Environment variables are required for AI functionality

