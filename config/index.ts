// Application configuration

export const Config = {
  // API Keys - loaded from environment variables
  OPENWEATHER_API_KEY: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '',
  GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  
  // Google Speech-to-Text API (Voice Input)
  GOOGLE_SPEECH_TO_TEXT_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_SPEECH_TO_TEXT_API_KEY || '',
  ENABLE_VOICE_INPUT: process.env.NEXT_PUBLIC_ENABLE_VOICE_INPUT === 'true' || process.env.ENABLE_VOICE_INPUT === 'true',
  SPEECH_LANGUAGE: process.env.SPEECH_LANGUAGE || process.env.NEXT_PUBLIC_CURRENT_LANGUAGE || 'en',
  SPEECH_SAMPLE_RATE: parseInt(process.env.SPEECH_SAMPLE_RATE || '16000', 10),
  
  // AI Provider Configuration
  AI_PROVIDER: (process.env.NEXT_PUBLIC_AI_PROVIDER || 'groq') as 'groq' | 'openai' | 'rule_based',
  
  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  
  // Groq AI Configuration
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  
  // Hugging Face Configuration
  HF_MODEL_NAME: process.env.HF_MODEL_NAME || 'gpt2',
  HF_USE_QUANTIZATION: process.env.HF_USE_QUANTIZATION === 'true',
  
  // Medical Database APIs (For Worldwide Data)
  PUBMED_API_KEY: process.env.PUBMED_API_KEY || '',
  WHO_API_KEY: process.env.WHO_API_KEY || '',
  ICD10_API_KEY: process.env.ICD10_API_KEY || '',
  SNOMED_CT_API_KEY: process.env.SNOMED_CT_API_KEY || '',

  // Translation Providers
  I18NOW_API_KEY: process.env.I18NOW_API_KEY || '',
  I18NOW_API_URL: process.env.I18NOW_API_URL || 'https://api.i18now.ai',
  GOOGLE_TRANSLATE_API_KEY: process.env.GOOGLE_TRANSLATE_API_KEY || '',
  AZURE_TRANSLATOR_KEY: process.env.AZURE_TRANSLATOR_KEY || '',
  AZURE_TRANSLATOR_REGION: process.env.AZURE_TRANSLATOR_REGION || '',
  AZURE_TRANSLATOR_ENDPOINT: process.env.AZURE_TRANSLATOR_ENDPOINT || '',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || '',
  
  // Medical AI Configuration
  MEDICAL_AI_MODEL: process.env.MEDICAL_AI_MODEL || process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  MEDICAL_KNOWLEDGE_BASE_URL: process.env.MEDICAL_KNOWLEDGE_BASE_URL || '',
  
  // Application Settings
  DEBUG: process.env.NODE_ENV === 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'INFO',
  
  // Language Settings
  CURRENT_LANGUAGE: process.env.NEXT_PUBLIC_CURRENT_LANGUAGE || 'en',
  
  // File Paths
  DATA_DIR: process.env.DATA_DIR || 'data',
  MODELS_DIR: process.env.MODELS_DIR || 'data/models',
  SYMPTOMS_DB: 'data/symptoms_db.json',
  FACILITIES_DB: 'data/medical_facilities.json',
  
  // UI Settings
  APP_TITLE: 'AI Health Assistant',
  APP_ICON: 'image.png',
  
  // Health Analysis Settings
  MAX_SYMPTOMS: 10,
  CONFIDENCE_THRESHOLD: 0.7,
  
  // Location Settings
  DEFAULT_LATITUDE: 40.7128,
  DEFAULT_LONGITUDE: -74.0060,
  SEARCH_RADIUS: 50, // kilometers
  
  // Security & Privacy
  ENCRYPT_HEALTH_DATA: process.env.ENCRYPT_HEALTH_DATA === 'true',
  HEALTH_DATA_RETENTION_DAYS: parseInt(process.env.HEALTH_DATA_RETENTION_DAYS || '30', 10),
  
  // Rate Limiting
  MAX_ANALYSIS_PER_HOUR: parseInt(process.env.MAX_ANALYSIS_PER_HOUR || '10', 10),
  AI_RESPONSE_TIMEOUT: parseInt(process.env.AI_RESPONSE_TIMEOUT || '30000', 10),
} as const;


