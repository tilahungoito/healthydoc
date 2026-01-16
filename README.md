# AI Health Assistant - Next.js 16

A comprehensive, production-ready AI-powered health assistant application built with Next.js 16, featuring intelligent health analysis, medical image detection (Malaria & Pneumonia), AI doctor consultations, multi-language support, and secure authentication.

## 🚀 Features

### Core Health Features
- **🤖 AI Health Analysis**: Intelligent symptom analysis powered by Groq AI (Llama 3.1) with structured health assessments
- **👨‍⚕️ AI Doctor Consultation**: Interactive chat-based consultations with AI doctor for detailed health discussions
- **🔬 Medical Image Detection**: 
  - **Malaria Detection**: Deep learning model for detecting malaria parasites in blood cell images
  - **Pneumonia Detection**: CNN-based model for detecting pneumonia in chest X-ray images
- **🔍 Body Scanner**: AI-powered analysis of body parts and symptoms with visual body map interface
- **📊 Health History**: Secure storage and retrieval of health records with user feedback system
- **🏥 Health Facility Finder**: Interactive map-based search for nearby medical facilities using Leaflet
- **🎤 Voice Input**: Speech-to-text integration for hands-free symptom input using Google Speech-to-Text API

### User Experience
- **🌍 Multi-language Support**: Full support for English, Amharic, and Tigrinya with persistent preferences
- **🔐 Secure Authentication**: 
  - Better Auth integration with email/password and Google OAuth
  - Firebase Admin SDK support for mobile app authentication
  - Guest mode for anonymous usage
- **💾 Database Integration**: PostgreSQL database with Prisma ORM for health records, user settings, and sessions
- **📱 Responsive Design**: Modern, mobile-first UI built with Tailwind CSS
- **⚡ TypeScript**: Full type safety throughout the application

## 📸 Screenshots

### Welcome Page
![Welcome Page](./public/screenshots/welcome-page.png)
*Landing page with authentication options and guest mode*

### Dashboard
![Dashboard](./public/screenshots/dashboard.png)
*Main dashboard with sidebar navigation*

### Health Analysis
![Health Analysis](./public/screenshots/health-analysis.png)
*AI-powered symptom analysis interface*

### AI Doctor Consultation
![AI Doctor](./public/screenshots/ai-doctor.png)
*Interactive chat-based AI doctor consultation*

### Malaria Detection
![Malaria Detection](./public/screenshots/malaria-detection.png)
*Malaria parasite detection from blood cell images*

### Pneumonia Detection
![Pneumonia Detection](./public/screenshots/pneumonia-detection.png)
*Pneumonia detection from chest X-ray images*

### Body Scanner
![Body Scanner](./public/screenshots/body-scanner.png)
*Visual body map for symptom analysis*

### Health History
![Health History](./public/screenshots/health-history.png)
*View and manage health records*

### Facilities Finder
![Facilities Finder](./public/screenshots/facilities-finder.png)
*Interactive map for finding nearby medical facilities*

### Settings
![Settings](./public/screenshots/settings.png)
*User preferences and account settings*

### 📝 How to Add Your Screenshots

1. **Start your application**:
   ```bash
   npm run dev
   ```

2. **Take screenshots** of each page/feature:
   - **Windows**: Press `Win + Shift + S` to open Snipping Tool
   - **Mac**: Press `Cmd + Shift + 4` for screenshot
   - **Browser DevTools**: Right-click → Inspect → Toggle device toolbar → Screenshot

3. **Save screenshots** to `public/screenshots/` directory with these filenames:
   - `welcome-page.png` - Landing/welcome page
   - `dashboard.png` - Main dashboard
   - `health-analysis.png` - Health analysis page
   - `ai-doctor.png` - AI doctor consultation
   - `malaria-detection.png` - Malaria detection interface
   - `pneumonia-detection.png` - Pneumonia detection interface
   - `body-scanner.png` - Body scanner page
   - `health-history.png` - Health history page
   - `facilities-finder.png` - Facilities finder map
   - `settings.png` - Settings page

4. **Image specifications**:
   - **Format**: PNG (preferred) or JPG
   - **Width**: 1200-1920px (optimal for GitHub display)
   - **File Size**: Keep under 1MB (compress if needed using [TinyPNG](https://tinypng.com/))
   - **Aspect Ratio**: 16:9 or 4:3

5. **The screenshots will automatically appear** in the README once you save them with the correct filenames!

> **Tip**: If you use different filenames, update the image paths in the README above. The format is: `![Alt Text](./public/screenshots/your-filename.png)`

## 🛠️ Tech Stack

### Frontend & Framework
- **Next.js 16.1.1** (App Router) - React framework with server-side rendering
- **React 19.2.3** - UI library
- **TypeScript 5.3.3** - Type-safe development
- **Tailwind CSS 3.3.6** - Utility-first CSS framework
- **Lucide React** - Icon library

### Backend & APIs
- **Better Auth 1.4.2** - Authentication system with OAuth support
- **Prisma 6.19.0** - Database ORM
- **PostgreSQL** - Relational database
- **Firebase Admin SDK** - Mobile authentication support

### AI & Machine Learning
- **Groq SDK 0.9.0** - Primary AI provider (Llama 3.1 models)
- **OpenAI SDK 4.20.1** - Fallback AI provider
- **TensorFlow.js 4.22.0** - Client-side ML models
- **Python Flask Service** - Server-side ML inference for medical models
  - Keras/TensorFlow for Malaria detection
  - TensorFlow.js to Keras conversion for Pneumonia detection

### Additional Services
- **Google Cloud Translation** - Multi-language translation
- **AWS Translate** - Alternative translation provider
- **Azure Translator** - Alternative translation provider
- **Google Maps API** - Location services
- **OpenWeather API** - Weather data integration
- **Google Speech-to-Text** - Voice input processing
- **Leaflet & React-Leaflet** - Interactive maps
- **jsPDF** - PDF generation for health reports

## 📋 Prerequisites

- **Node.js 18+** (recommended: Node.js 20+)
- **npm** or **yarn** package manager
- **PostgreSQL** database (local or cloud-hosted)
- **Python 3.8+** (for medical model service)
- **API Keys** for:
  - Groq AI (required)
  - Google OAuth (optional, for social login)
  - Google Maps (optional, for facility finder)
  - OpenWeather (optional, for weather data)
  - Google Speech-to-Text (optional, for voice input)
  - Translation services (optional, for multi-language)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd health-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

1. Create a PostgreSQL database
2. Update the `DATABASE_URL` in your `.env.local` file

### 4. Run Database Migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

### 5. Configure Environment Variables

Copy `env.template` to `.env.local` and fill in your API keys:

```bash
cp env.template .env.local
```

Edit `.env.local` with your actual values. See [Environment Variables](#environment-variables) section for details.

### 6. Set Up Python Medical Service (Optional but Recommended)

For Malaria and Pneumonia detection features:

```bash
cd python-service
pip install -r requirements.txt

# Convert Pneumonia model if needed
python convert_tfjs_to_keras.py

# Start the service
python app.py
```

The service will run on `http://localhost:5007`

### 7. Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
health-assistant/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── ai-doctor/          # AI doctor consultation endpoints
│   │   │   ├── start/          # Start consultation session
│   │   │   ├── chat/           # Chat messages
│   │   │   ├── end/            # End consultation
│   │   │   └── receipt/        # Generate consultation receipt
│   │   ├── analyze/            # Health symptom analysis
│   │   ├── auth/               # Authentication (Better Auth)
│   │   ├── health/             # Health data endpoints
│   │   ├── health-history/     # Health history CRUD operations
│   │   ├── malaria-predict/    # Malaria detection
│   │   ├── pneumonia-predict/  # Pneumonia detection
│   │   ├── scan/               # Body scanner analysis
│   │   └── speech-to-text/     # Voice input processing
│   ├── dashboard/              # Dashboard page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Welcome/landing page
│   └── globals.css              # Global styles
├── components/                  # React components
│   ├── auth/                   # Authentication components
│   │   ├── AuthPanel.tsx
│   │   ├── SignInForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── GoogleSignInButton.tsx
│   ├── dashboard/              # Dashboard shell
│   ├── layout/                 # Layout components
│   │   ├── Sidebar.tsx
│   │   └── ProfileMenu.tsx
│   ├── pages/                  # Page components
│   │   ├── AboutPage.tsx
│   │   ├── AIDoctorPage.tsx
│   │   ├── BodyScannerPage.tsx
│   │   ├── FacilitiesPage.tsx
│   │   ├── HealthAnalysisPage.tsx
│   │   ├── HealthHistoryPage.tsx
│   │   ├── MalariaModelPage.tsx
│   │   ├── PneumoniaModelPage.tsx
│   │   └── SettingsPage.tsx
│   └── voice/                  # Voice input component
├── config/                     # Configuration files
│   └── index.ts                # App configuration
├── data/                       # Static data files
│   ├── medical_facilities.json # Medical facility database
│   └── symptoms_db.json        # Symptoms database
├── lib/                        # Core libraries
│   ├── actions/                # Server actions
│   ├── ai/                     # AI services
│   │   ├── client.ts          # AI client wrapper
│   │   ├── health-analyzer.ts # Health analysis logic
│   │   ├── malaria-model.ts   # Malaria model integration
│   │   └── translation.ts     # Translation services
│   ├── ai-doctor/             # AI doctor logic
│   │   └── context.ts         # Consultation context
│   ├── auth/                  # Authentication utilities
│   │   ├── client.ts         # Auth client
│   │   ├── firebase.ts       # Firebase integration
│   │   └── verify.ts         # Auth verification
│   ├── data/                  # Data loaders
│   ├── generated/             # Generated Prisma client
│   ├── language/              # Language management
│   │   └── manager.ts        # Translation manager
│   ├── model/                 # ML model files
│   │   ├── malaria_model1.h5
│   │   ├── tfjs-malar-model/  # TensorFlow.js Malaria model
│   │   └── tfjspnumoniaDetectorModel/ # TensorFlow.js Pneumonia model
│   ├── voice/                 # Voice recognition
│   ├── auth.ts                # Better Auth configuration
│   └── utils.ts               # Utility functions
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma          # Prisma schema
│   └── migrations/            # Database migrations
├── python-service/             # Python Flask service
│   ├── app.py                 # Flask application
│   ├── convert_tfjs_to_keras.py # Model conversion script
│   ├── requirements.txt       # Python dependencies
│   └── README.md              # Python service documentation
├── types/                      # TypeScript type definitions
├── public/                     # Static assets
├── middleware.ts              # Next.js middleware
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Node.js dependencies
└── env.template               # Environment variables template
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/sign-in` - Sign in with email/password
- `POST /api/auth/sign-up` - Create new account
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/callback/google` - Google OAuth callback

### Health Analysis
- `POST /api/analyze` - Analyze health symptoms
  - Body: `{ symptoms: string[], userInput: string, location?: { lat, lng } }`
  - Returns: AI-generated health analysis with recommendations

- `POST /api/scan` - Analyze body scan images
  - Body: FormData with image file
  - Returns: Body part analysis and symptom suggestions

### AI Doctor Consultation
- `POST /api/ai-doctor/start` - Start a new consultation session
  - Returns: `{ sessionId, initialMessage, timestamp }`

- `POST /api/ai-doctor/chat` - Send message in consultation
  - Body: `{ sessionId: string, message: string }`
  - Returns: AI doctor response

- `POST /api/ai-doctor/end/[sessionId]` - End consultation session
  - Returns: Session summary

- `GET /api/ai-doctor/receipt/[sessionId]` - Get consultation receipt (PDF)

### Medical Image Detection
- `POST /api/malaria-predict` - Detect malaria in blood cell images
  - Body: FormData with image file
  - Returns: `{ prediction: 'Parasitized' | 'Uninfected', confidence: number, message: string, recommendations: string[] }`

- `POST /api/pneumonia-predict` - Detect pneumonia in chest X-ray images
  - Body: FormData with image file
  - Returns: `{ prediction: 'Pneumonia' | 'Normal', confidence: number, message: string, recommendations: string[] }`

- `GET /api/malaria-predict` - Check malaria service status
- `GET /api/pneumonia-predict` - Check pneumonia service status

### Health History
- `GET /api/health-history` - Get user's health history
  - Query params: `page`, `limit`
  - Returns: Paginated health records

- `GET /api/health-history/[id]` - Get specific health record
  - Returns: Health record details

- `DELETE /api/health-history/[id]` - Delete health record
- `POST /api/health-history/bulk-delete` - Delete multiple records
  - Body: `{ ids: string[] }`

### Voice Input
- `POST /api/speech-to-text` - Convert speech to text
  - Body: Audio file (FormData)
  - Returns: `{ text: string }`

### Health Data
- `GET /api/health` - Get health statistics and data

## 🔐 Environment Variables

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/health_assistant

# Authentication
BETTER_AUTH_SECRET=your_long_random_secret_string_here

# AI Provider (at least one required)
GROQ_API_KEY=your_groq_api_key_here
# OR
OPENAI_API_KEY=your_openai_api_key_here
```

### Optional but Recommended

```env
# Google OAuth (for social login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000

# AI Configuration
GROQ_MODEL=llama-3.1-70b-versatile
OPENAI_MODEL=gpt-4
NEXT_PUBLIC_AI_PROVIDER=groq

# Language Settings
NEXT_PUBLIC_CURRENT_LANGUAGE=en
CURRENT_LANGUAGE=en

# Translation Services (for multi-language support)
GOOGLE_TRANSLATE_API_KEY=your_google_translate_key
# OR
AZURE_TRANSLATOR_KEY=your_azure_key
AZURE_TRANSLATOR_REGION=your_azure_region
# OR
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region

# Maps & Location
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Weather Data
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
OPENWEATHER_API_KEY=your_openweather_key

# Voice Input
NEXT_PUBLIC_GOOGLE_SPEECH_TO_TEXT_API_KEY=your_speech_key
GOOGLE_SPEECH_TO_TEXT_API_KEY=your_speech_key
NEXT_PUBLIC_ENABLE_VOICE_INPUT=true
ENABLE_VOICE_INPUT=true

# Firebase (for mobile app authentication)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Python Service (for medical models)
PYTHON_SERVICE_URL=http://localhost:5007

# Security & Privacy
ENCRYPT_HEALTH_DATA=true
HEALTH_DATA_RETENTION_DAYS=30

# Rate Limiting
MAX_ANALYSIS_PER_HOUR=10
AI_RESPONSE_TIMEOUT=30000
```

See `env.template` for the complete list of available environment variables.

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User**: User accounts with authentication details
- **HealthRecord**: Stored health analysis results
- **PersonalSettings**: User preferences (language, units, alerts)
- **ModelFeedback**: User feedback on AI predictions
- **Session**: Authentication sessions
- **Account**: OAuth account links
- **Verification**: Email verification tokens

Run `npx prisma studio` to view and manage your database visually.

## 🐍 Python Medical Service

The Python Flask service handles medical image detection models that require server-side processing.

### Setup

```bash
cd python-service
pip install -r requirements.txt
python app.py
```

### Endpoints

- `GET /health` - Service health check
- `POST /malaria-predict` - Malaria detection
- `POST /pneumonia-predict` - Pneumonia detection

### Model Files

- Malaria: `../lib/model/malaria_model1.h5`
- Pneumonia: `../lib/model/pneumonia_model.h5` (auto-converted from TFJS)

See `python-service/README.md` for detailed documentation.

## 🌍 Multi-language Support

The application supports three languages:
- **English (en)** - Default
- **Amharic (am)** - አማርኛ
- **Tigrinya (ti)** - ትግርኛ

Language preferences are stored per-user and persist across sessions. Translation services (Google Translate, Azure, or AWS) are used for dynamic content translation.

## 🔒 Authentication

The application uses **Better Auth** for authentication with support for:

- **Email/Password** authentication
- **Google OAuth** (optional)
- **Firebase Admin SDK** (for mobile app integration)
- **Guest Mode** - Anonymous usage without account

Session management includes:
- 30-day session expiration
- "Keep me signed in" option
- Secure cookie-based sessions
- CSRF protection

## 📱 Features Overview

### Health Analysis Page
- Symptom input with autocomplete
- Voice input support
- Location-based weather integration
- AI-powered health assessment
- Structured recommendations

### AI Doctor Page
- Interactive chat interface
- Session-based consultations
- Consultation history
- PDF receipt generation

### Body Scanner Page
- Visual body map interface
- Image upload for body part analysis
- Symptom correlation

### Medical Models
- **Malaria Detection**: Upload blood cell images for parasite detection
- **Pneumonia Detection**: Upload chest X-ray images for pneumonia detection
- Real-time confidence scores
- Medical recommendations

### Health History
- View past health records
- Filter and search
- Bulk delete
- Export capabilities

### Facilities Finder
- Interactive map (Leaflet)
- Search nearby medical facilities
- Filter by facility type
- Distance calculations

### Settings
- Language preferences
- Unit preferences (metric/imperial)
- Alert thresholds
- Account management

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Setup for Production

1. Set `NODE_ENV=production`
2. Use secure `BETTER_AUTH_SECRET` (generate with: `openssl rand -base64 32`)
3. Configure production database URL
4. Set up proper CORS and security headers
5. Ensure Python service is running and accessible
6. Configure all required API keys

### Docker Deployment (Optional)

You may want to containerize the Python service:

```dockerfile
# Example Dockerfile for python-service
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5007
CMD ["python", "app.py"]
```

## 🧪 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 📝 Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Next.js ESLint configuration
- **Prettier**: Code formatting (if configured)
- **Prisma**: Type-safe database queries

## ⚠️ Important Notes

### Medical Disclaimer

**This application is for educational and informational purposes only. It should not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns.**

### Security Considerations

- Never commit `.env.local` or API keys to version control
- Use strong `BETTER_AUTH_SECRET` in production
- Enable HTTPS in production
- Regularly update dependencies
- Review and configure rate limiting
- Implement proper error handling and logging

### Model Accuracy

- Medical models are trained on specific datasets and may have limitations
- Always verify critical medical decisions with healthcare professionals
- Model performance may vary based on image quality and conditions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Groq AI for providing fast inference capabilities
- TensorFlow.js team for browser-based ML
- Better Auth for secure authentication
- Prisma for excellent database tooling
- Next.js team for the amazing framework

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Built with ❤️ using Next.js 16**
