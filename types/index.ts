// Core types for AI Health Assistant

export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface Symptom {
  name: string;
  category: string;
  severity_levels: string[];
  description?: string;
}

export interface Condition {
  name: string;
  symptoms: string[];
  severity: string;
  confidence?: number;
  matching_symptoms?: string[];
}

export interface HealthAnalysis {
  urgency_level: UrgencyLevel | 'emergency';
  possible_conditions: Condition[];
  recommended_actions: string[];
  general_advice: string;
  analysis?: string;
  medical_context?: string;
  home_care?: string;
  when_to_seek_care?: string;
  disclaimer?: string;
  timestamp: string;
  user_input: string;
  extracted_symptoms: string[];
  additional_context?: UserProfile;
}

export interface UserProfile {
  age?: number;
  gender?: string;
  conditions?: string[];
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  country?: string;
}

export interface WeatherData {
  current: {
    temperature: number;
    weather_condition: string;
    humidity?: number;
    wind_speed?: number;
  };
  forecast?: any;
}

export interface MedicalFacility {
  name: string;
  address: string;
  distance_km: number;
  rating?: number;
  phone?: string;
  type?: string;
  latitude?: number;
  longitude?: number;
}

export interface BodyScanResult {
  type: string;
  analysis_type?: string;
  observations?: any;
  potential_issues?: string[];
  recommendations?: string[];
  ai_insights?: {
    observations: string[];
    concerns: string[];
    recommendations: string[];
    urgency: UrgencyLevel;
  };
  enhanced_analysis?: boolean;
  error?: string;
  disclaimer?: string;
}

export type LanguageCode = 'en' | 'am' | 'ti';

export interface LanguageTranslations {
  [key: string]: string;
}

export type AIProvider = 'groq' | 'openai' | 'rule_based';

export interface AIClientInfo {
  provider: AIProvider;
  model: string;
  available: boolean;
}


