import Groq from 'groq-sdk';
import { Config } from '@/config';
import { HealthAnalysis, BodyScanResult, UserProfile, WeatherData } from '@/types';

export class AIClient {
  private client: Groq | null = null;
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = Config.GROQ_API_KEY;
    // Use medical AI model if configured, otherwise use default Groq model
    this.model = Config.MEDICAL_AI_MODEL || Config.GROQ_MODEL;

    if (this.apiKey) {
      try {
        this.client = new Groq({ apiKey: this.apiKey });
      } catch (error) {
        console.error('Failed to initialize Groq client:', error);
      }
    }
  }

  private async makeRequest(
    messages: Array<{ role: string; content: string }>,
    maxTokens: number = 2000
  ): Promise<string | null> {
    if (!this.client) {
      console.error('Groq client not initialized');
      return null;
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as any,
        max_tokens: maxTokens,
        temperature: 0.3, // Lower temperature for more consistent, factual responses
        top_p: 0.9,
      });

      const content = response.choices[0]?.message?.content?.trim() || null;
      if (content) {
        console.log('AI Response received:', content.substring(0, 200));
      }
      return content;
    } catch (error: any) {
      console.error('Groq API request failed:', error);
      if (error.message) {
        console.error('Error details:', error.message);
      }
      return null;
    }
  }

  async analyzeSymptoms(
    symptoms: string[],
    additionalInfo: string = '',
    language: string = 'en'
  ): Promise<HealthAnalysis> {
    const systemPrompt = `You are a professional AI medical diagnostic assistant with access to worldwide medical data and evidence-based information. Your role is to provide detailed, helpful preliminary health assessments.

CRITICAL INSTRUCTIONS:
1. ALWAYS provide detailed analysis - never just say "consult a professional" without giving useful information
2. Analyze symptoms thoroughly and provide specific possible conditions
3. Give actionable advice and recommendations
4. Consider symptom duration, severity, and context
5. Provide differential diagnoses (multiple possibilities)
6. Include home care suggestions when appropriate
7. Specify when professional care is needed and why

Analyze symptoms using:
- Evidence-based medical knowledge
- Worldwide health data and disease prevalence
- Standard medical terminology
- Patient demographics and context
- Symptom patterns and duration

You MUST respond in valid JSON format with this exact structure:
{
  "possible_conditions": [
    {"name": "condition name", "confidence": 0.7, "description": "brief description", "common_symptoms": ["symptom1", "symptom2"]}
  ],
  "recommended_actions": [
    "Specific action 1",
    "Specific action 2",
    "When to seek medical care"
  ],
  "urgency_level": "low/medium/high/emergency",
  "general_advice": "Detailed, helpful advice paragraph explaining what the symptoms might mean, what to watch for, and what steps to take",
  "medical_context": "Relevant medical information about the symptoms and possible causes",
  "home_care": "Specific home care recommendations if applicable",
  "when_to_seek_care": "Clear guidance on when professional medical attention is needed",
  "disclaimer": "This is a preliminary assessment. Consult healthcare professionals for proper diagnosis."
}`;

    const prompt = `Patient Symptoms: ${symptoms.length > 0 ? symptoms.join(', ') : 'No specific symptoms extracted'}
Patient Description: ${additionalInfo || 'No additional information provided'}

Please provide a DETAILED health analysis. Be specific and helpful. Do NOT just say "consult a professional" - provide actual analysis, possible conditions, and actionable advice.

Respond ONLY with valid JSON, no additional text.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    const response = await this.makeRequest(messages, 2500);

    if (response) {
      try {
        // Try to extract JSON from response (in case there's extra text)
        let jsonStr = response.trim();
        
        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '').trim();
        }
        
        // Try to find JSON object in the response
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        
        const analysis = JSON.parse(jsonStr);
        
        // Ensure we have meaningful content
        if (!analysis.general_advice || analysis.general_advice.trim().length < 20) {
          // If AI didn't provide good advice, use the raw response
          analysis.general_advice = response.substring(0, 500);
        }
        
        return {
          urgency_level: analysis.urgency_level || 'medium',
          possible_conditions: analysis.possible_conditions || [],
          recommended_actions: analysis.recommended_actions || [],
          general_advice: analysis.general_advice || analysis.medical_context || '',
          medical_context: analysis.medical_context || '',
          home_care: analysis.home_care || '',
          when_to_seek_care: analysis.when_to_seek_care || '',
          disclaimer: analysis.disclaimer || 'This is a preliminary assessment. Consult healthcare professionals for proper diagnosis.',
          timestamp: new Date().toISOString(),
          user_input: additionalInfo,
          extracted_symptoms: symptoms,
        };
      } catch (error) {
        console.error('Error parsing AI response:', error);
        console.log('Raw response:', response);
        
        // If JSON parsing fails, try to extract useful information from the response
        const fallbackAdvice = response.length > 50 
          ? response.substring(0, 500)
          : 'Unable to parse AI response. Please try again or consult a healthcare professional.';
        
        return {
          urgency_level: 'medium',
          possible_conditions: [],
          recommended_actions: [
            'Monitor your symptoms closely',
            'Rest and stay hydrated',
            'Seek medical attention if symptoms worsen or persist'
          ],
          general_advice: fallbackAdvice,
          disclaimer: 'This is a preliminary assessment. Consult healthcare professionals for proper diagnosis.',
          timestamp: new Date().toISOString(),
          user_input: additionalInfo,
          extracted_symptoms: symptoms,
        };
      }
    }

    return {
      urgency_level: 'medium',
      possible_conditions: [],
      recommended_actions: ['Consult a healthcare professional'],
      general_advice: '',
      disclaimer: 'Please consult a healthcare professional for proper diagnosis',
      timestamp: new Date().toISOString(),
      user_input: additionalInfo,
      extracted_symptoms: symptoms,
    };
  }

  async analyzeBodyScan(scanDescription: string, scanType: string): Promise<BodyScanResult> {
    const systemPrompt = `You are an AI assistant specialized in analyzing medical scans and images.
Provide detailed analysis including:
1. Visual observations
2. Potential concerns
3. Recommendations for further evaluation
4. When to seek medical attention

Always emphasize the need for professional medical interpretation.

Respond in JSON format with the following structure:
{
  "observations": ["observation1", "observation2"],
  "concerns": ["concern1", "concern2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "urgency": "low/medium/high",
  "disclaimer": "disclaimer text"
}`;

    const prompt = `Scan Type: ${scanType}
Scan Description: ${scanDescription}

Please provide a structured analysis in JSON format.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    const response = await this.makeRequest(messages);

    if (response) {
      try {
        const analysis = JSON.parse(response);
        return {
          type: scanType,
          ai_insights: {
            observations: analysis.observations || [],
            concerns: analysis.concerns || [],
            recommendations: analysis.recommendations || [],
            urgency: analysis.urgency || 'medium',
          },
          enhanced_analysis: true,
          disclaimer: analysis.disclaimer || '',
        };
      } catch (error) {
        return {
          type: scanType,
          ai_insights: {
            observations: [],
            concerns: [],
            recommendations: ['Consult a healthcare professional for proper interpretation'],
            urgency: 'medium',
          },
          enhanced_analysis: true,
          disclaimer: 'This analysis should be interpreted by qualified medical professionals',
        };
      }
    }

    return {
      type: scanType,
      error: 'Unable to analyze scan',
      disclaimer: 'Please consult a healthcare professional for proper scan interpretation',
    };
  }

  async generateHealthAdvice(
    userProfile: UserProfile,
    weatherData: WeatherData
  ): Promise<string> {
    const systemPrompt = `You are a health assistant providing personalized advice based on user profile and environmental conditions.
Consider factors like weather, air quality, user age, and health conditions.
Provide practical, actionable advice.`;

    const prompt = `User Profile: ${JSON.stringify(userProfile, null, 2)}
Weather Data: ${JSON.stringify(weatherData, null, 2)}

Provide personalized health advice considering the environmental conditions and user profile.
Include recommendations for:
- Daily activities
- Precautions based on weather
- General wellness tips`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    const response = await this.makeRequest(messages);
    return response || 'Unable to generate health advice at this time.';
  }

  isAvailable(): boolean {
    return this.client !== null && this.apiKey !== '';
  }

  getModelInfo() {
    return {
      model: this.model,
      apiKeyConfigured: !!this.apiKey,
      isAvailable: this.isAvailable(),
    };
  }
}

