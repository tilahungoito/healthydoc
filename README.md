# AI Health Assistant - Next.js

A modern, TypeScript-based AI Health Assistant built with Next.js 14, featuring AI-powered health analysis, multi-language support, and a clean, structured architecture.

## Features

- 🤖 **AI Health Analysis**: Powered by Groq AI for intelligent health assessments
- 📍 **Location & Weather Integration**: Automatic atmospheric data collection
- 🔍 **Body Scanning**: AI-powered analysis of body parts and symptoms
- 🏥 **Health Facility Finder**: Locate nearby medical facilities
- 🌍 **Multi-language Support**: English, Amharic, and Tigrinya
- 🎨 **Modern UI**: Beautiful, responsive interface with Tailwind CSS
- ⚡ **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Groq SDK
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```env
GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
nextjs-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── layout/           # Layout components
│   └── pages/            # Page components
├── lib/                   # Core libraries
│   ├── ai/               # AI services
│   ├── language/         # Language management
│   └── utils.ts          # Utilities
├── types/                # TypeScript types
├── config/               # Configuration
└── data/                 # Data files (JSON)
```

## Key Features

### Clean Architecture

- **No `src` folder**: Following Next.js best practices
- **Flow-based structure**: Organized by feature/domain
- **Type-safe**: Full TypeScript coverage
- **Modular**: Separated concerns with clear boundaries

### AI Integration

- Groq AI for health analysis
- Structured JSON responses
- Multi-language support
- Fallback mechanisms

### Language Support

- English (en)
- Amharic (am)
- Tigrinya (ti)
- Persistent language preferences

## API Routes

- `POST /api/analyze` - Analyze health symptoms
- `POST /api/scan` - Analyze body scan images

## Environment Variables

```env
# Required
GROQ_API_KEY=your_groq_api_key

# Optional
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
NEXT_PUBLIC_AI_PROVIDER=groq
NEXT_PUBLIC_CURRENT_LANGUAGE=en
```

## Building for Production

```bash
npm run build
npm start
```

## Disclaimer

This application is for educational and informational purposes only. It should not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns.

## License

MIT License

