import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Config } from '@/config';
import { translateTextMulti, translateJSONWithI18Now } from '@/lib/ai/translation';
import { HealthAnalysis, BodyScanResult, UserProfile, WeatherData } from '@/types';

export class AIClient {
  private groqClient: Groq | null = null;
  private geminiClient: GoogleGenerativeAI | null = null;
  private groqApiKey: string;
  private geminiApiKey: string;
  private model: string;
  private useGemini: boolean;

  constructor(useGeminiForMultilingual: boolean = false) {
    this.groqApiKey = Config.GROQ_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.model = Config.MEDICAL_AI_MODEL || Config.GROQ_MODEL;
    this.useGemini = useGeminiForMultilingual && !!this.geminiApiKey;

    // Initialize Groq
    if (this.groqApiKey && this.groqApiKey.trim() !== '') {
      try {
        this.groqClient = new Groq({ apiKey: this.groqApiKey });
        if (Config.DEBUG) {
          console.log('Groq client initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize Groq client:', error);
      }
    }

    // Initialize Gemini
    if (this.geminiApiKey && this.geminiApiKey.trim() !== '') {
      try {
        this.geminiClient = new GoogleGenerativeAI(this.geminiApiKey);
        if (Config.DEBUG) {
          console.log('Gemini client initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize Gemini client:', error);
      }
    } else {
      if (Config.DEBUG) {
        console.warn('Gemini API key not found. Please set GEMINI_API_KEY in your .env.local file.');
      }
    }
  }

  private async makeRequest(
    messages: Array<{ role: string; content: string }>,
    maxTokens: number = 2000,
    useGemini: boolean = false
  ): Promise<string | null> {
    // Use Gemini for multilingual support if available
    if (useGemini && this.geminiClient) {
      try {
        console.log('[AIClient] Calling Gemini API...');
        console.log('[AIClient] useGemini:', useGemini, 'geminiClient:', this.geminiClient ? 'available' : 'null');
        // Try gemini-1.5-pro first, fallback to gemini-pro
        let model;
        try {
          model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-pro' });
          console.log('[AIClient] Using gemini-1.5-pro');
        } catch (e) {
          console.log('[AIClient] gemini-1.5-pro not available, using gemini-pro');
          model = this.geminiClient.getGenerativeModel({ model: 'gemini-pro' });
        }
        
        // Convert messages to Gemini format - combine system and user messages properly
        let fullPrompt = '';
        
        // Extract system message
        const systemMsg = messages.find(m => m.role === 'system');
        if (systemMsg) {
          fullPrompt += systemMsg.content + '\n\n';
        }
        
        // Add conversation history
        const conversationMessages = messages.filter(m => m.role !== 'system');
        const conversationText = conversationMessages
          .map((msg) => {
            if (msg.role === 'user') return `Patient: ${msg.content}`;
            if (msg.role === 'assistant') return `Doctor: ${msg.content}`;
            return msg.content;
          })
          .join('\n\n');
        
        fullPrompt += conversationText;

        console.log('[AIClient] Sending prompt to Gemini (length:', fullPrompt.length, ')');
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const content = response.text().trim();
        
        if (content && content.length > 2) {
          console.log('[AIClient] Gemini Response received, length:', content.length);
          console.log('[AIClient] Gemini Response preview:', content.substring(0, 200));
          return content;
        } else {
          console.warn('[AIClient] Gemini returned empty or too short response, length:', content?.length || 0);
          return null;
        }
      } catch (error: any) {
        console.error('[AIClient] Gemini API request failed:', error);
        console.error('[AIClient] Error details:', error.message || JSON.stringify(error));
        // Don't fallback here, let the caller handle it
        return null;
      }
    }

    // Use Groq as default if Gemini not requested
    console.log('[AIClient] Using Groq - useGemini:', useGemini, 'geminiClient:', this.geminiClient ? 'available' : 'null');
    return this.makeRequestWithGroq(messages, maxTokens);
  }

  private async makeRequestWithGroq(
    messages: Array<{ role: string; content: string }>,
    maxTokens: number = 2000
  ): Promise<string | null> {
    if (!this.groqClient) {
      if (Config.DEBUG) {
        console.error('Groq client not initialized. Please check that GROQ_API_KEY is set in your .env.local file.');
      }
      return null;
    }

    // Ensure minimum tokens and increase for JSON responses
    console.log(`[AIClient] makeRequestWithGroq called with maxTokens: ${maxTokens}`);
    const baseTokens = Math.max(maxTokens || 2000, 2000); // Minimum 2000 tokens, default 2000
    const maxTokensInt = Math.min(Math.floor(baseTokens * 1.5), 4000); // Increase by 50%, cap at 4000
    console.log(`[AIClient] Calculated baseTokens: ${baseTokens}, maxTokensInt: ${maxTokensInt}`);
    
    // Retry logic for incomplete responses
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const attemptTokens = attempt === 0 ? maxTokensInt : Math.min(maxTokensInt * 2, 8000);
        console.log(`[AIClient] Groq attempt ${attempt + 1}/2, calculated max_tokens: ${attemptTokens} (from maxTokensInt: ${maxTokensInt})`);
        
        // Safety check - ensure minimum
        const finalTokens = Math.max(attemptTokens, 2000);
        if (finalTokens !== attemptTokens) {
          console.warn(`[AIClient] Adjusted tokens from ${attemptTokens} to ${finalTokens} (minimum)`);
        }
        
        // Build request - DON'T use response_format as it causes token issues
        const requestParams: any = {
          model: this.model,
          messages: messages as any,
          max_tokens: finalTokens,
          temperature: 0.3, // Slightly higher for better responses
          top_p: 0.9,
        };
        
        console.log(`[AIClient] Sending Groq request with max_tokens: ${finalTokens}`);
        
        const response = await this.groqClient.chat.completions.create(requestParams);

        const content = response.choices[0]?.message?.content?.trim() || null;
        if (content) {
          console.log('[AIClient] Groq Response received, length:', content.length);
          console.log('[AIClient] Groq Response preview:', content.substring(0, 300));
          
          // Check if response is incomplete JSON
          if (content.trim() === '{' || content.trim().length < 10) {
            console.warn(`[AIClient] Groq returned incomplete JSON (attempt ${attempt + 1}):`, content);
            if (attempt === 0) {
              // Retry with even more tokens
              continue;
            }
            return null;
          }
          
          // Check if JSON is complete (has closing brace)
          if (!content.includes('}') || content.split('{').length !== content.split('}').length) {
            console.warn(`[AIClient] Groq returned incomplete JSON structure (attempt ${attempt + 1})`);
            if (attempt === 0) {
              continue;
            }
            return null;
          }
          
          return content;
        } else {
          console.warn(`[AIClient] Groq returned null or empty content (attempt ${attempt + 1})`);
          if (attempt === 0) continue;
        }
      } catch (error: any) {
        console.error(`[AIClient] Groq API request failed (attempt ${attempt + 1}):`, error?.message || error);
        if (attempt === 0) continue;
        return null;
      }
    }
    
    return null;
  }

  // Translate text using external providers with fallbacks
  private async translateText(text: string, fromLang: string, toLang: string): Promise<string | null> {
    if (fromLang === toLang) return text;
    if (!text || text.trim() === '') return text;

    // Primary / fallbacks: Google -> Azure -> Amazon -> Gemini
    const primary = await translateTextMulti(text, fromLang, toLang);
    if (primary && primary.trim().length > 0) return primary;

    // Gemini fallback (existing behavior)
    if (!this.geminiClient) return null;

    try {
      const langNames: Record<string, string> = {
        'en': 'English',
        'am': 'Amharic (አማርኛ)',
        'ti': 'Tigrinya (ትግርኛ)'
      };
      
      const prompt = `You are an expert medical translator fluent in both ${langNames[fromLang] || fromLang} and ${langNames[toLang] || toLang}.

TASK: Translate the following medical consultation text accurately.

TRANSLATION RULES:
1. Translate WORD-FOR-WORD meaning - preserve exact intent
2. Use proper medical terminology in ${langNames[toLang] || toLang}
3. Maintain natural, conversational tone
4. Keep ALL numbers, measurements, and dates identical
5. Preserve question marks, punctuation, and sentence structure
6. Do NOT add explanations, notes, or extra words
7. Do NOT change the meaning or add information
8. Return ONLY the pure translation

ORIGINAL TEXT (${langNames[fromLang] || fromLang}):
${text}

TRANSLATION (${langNames[toLang] || toLang}) - ONLY the translation:`;
      
      console.log(`[AIClient] Translation fallback (Gemini): ${fromLang} -> ${toLang}, length: ${text.length}`);
      const model = this.geminiClient.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
      });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.05,
          topP: 0.7,
          topK: 20,
        }
      });
      
      const response = await result.response;
      let translated = response.text().trim();
      
      const cleanupPatterns = [
        /^Translation[:\s]*/i,
        /^Translated text[:\s]*/i,
        /^(Amharic|Tigrinya|English|አማርኛ|ትግርኛ)[:\s]*/i,
        /^Here is the translation[:\s]*/i,
        /^The translation is[:\s]*/i,
        /\n.*translation.*$/i,
      ];
      
      for (const pattern of cleanupPatterns) {
        translated = translated.replace(pattern, '').trim();
      }
      
      if ((translated.startsWith('"') && translated.endsWith('"')) || 
          (translated.startsWith("'") && translated.endsWith("'"))) {
        translated = translated.slice(1, -1).trim();
      }
      
      translated = translated.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
      
      console.log(`[AIClient] Translation fallback result: ${translated.length} chars`);
      return translated;
    } catch (error: any) {
      console.error('[AIClient] Translation fallback (Gemini) failed:', error?.message || error);
      return null;
    }
  }

  // Get English response using Groq (works better for English), fallback to Gemini
  private async getEnglishResponse(prompt: string): Promise<string | null> {
    const messages = [
      {
        role: 'user',
        content: prompt,
      },
    ];
    
    // Try Groq first, but fallback to Gemini if it fails
    if (this.groqClient) {
      try {
        console.log('[AIClient] Getting English response from Groq');
        const response = await this.makeRequestWithGroq(messages, 3000);
        if (response && response.trim().length > 0) {
          return response;
        }
        console.log('[AIClient] Groq returned empty, falling back to Gemini');
      } catch (error: any) {
        console.warn('[AIClient] Groq failed, falling back to Gemini:', error?.message || error);
      }
    }
    
    // Fallback to Gemini if Groq not available or failed
    if (this.geminiClient) {
      console.log('[AIClient] Getting English response from Gemini');
      const response = await this.makeRequest(messages, 3000, true);
      return response;
    }
    
    return null;
  }

  // Public method for generating responses with language support
  async generateResponse(
    prompt: string,
    language: string = 'en',
    useGeminiForMultilingual: boolean = true
  ): Promise<string> {
    const geminiAvailable = !!this.geminiClient;
    const shouldUseGemini = useGeminiForMultilingual && geminiAvailable;
    
    console.log(`[AIClient] generateResponse START - language: ${language}, geminiAvailable: ${geminiAvailable}, useGeminiForMultilingual: ${useGeminiForMultilingual}`);
    
    // For non-English: FIRST try Gemini directly in target language (best approach)
    // Only use translation approach if direct method fails
    if (language !== 'en' && geminiAvailable) {
      console.log(`[AIClient] NON-ENGLISH DETECTED (${language}): Trying Gemini directly first`);
      
      // Try Gemini directly in target language first
      const languageName = language === 'am' ? 'Amharic (አማርኛ)' : language === 'ti' ? 'Tigrinya (ትግርኛ)' : 'English';
      const languageInstruction = `CRITICAL: You MUST respond EXCLUSIVELY in ${languageName} language. Match the language of the user's input message. DO NOT switch languages.\n\n`;
      
      const directMessages = [
        {
          role: 'user',
          content: languageInstruction + prompt,
        },
      ];
      
      try {
        const directResponse = await this.makeRequest(directMessages, 4000, true);
        if (directResponse && directResponse.trim().length > 10) {
          console.log(`[AIClient] Gemini direct response SUCCESS in ${language}, length: ${directResponse.length}`);
          return directResponse;
        }
        console.log(`[AIClient] Gemini direct response failed or too short, trying translation approach`);
      } catch (error: any) {
        console.warn(`[AIClient] Gemini direct method failed:`, error?.message || error);
      }
      
      // Fallback: translate to English → get response → translate back
      console.log(`[AIClient] NON-ENGLISH DETECTED: Using translation approach for ${language}`);
      try {
        console.log(`[AIClient] Step 1: Translating input from ${language} to English`);
        const englishPrompt = await this.translateText(prompt, language, 'en');
        console.log(`[AIClient] Translation result:`, englishPrompt ? `Success (${englishPrompt.length} chars)` : 'Failed');
        
        if (englishPrompt && englishPrompt.trim().length > 0) {
          console.log(`[AIClient] Step 2: Getting AI response in English`);
          // Get response in English - will fallback to Gemini if Groq fails
          const englishResponse = await this.getEnglishResponse(englishPrompt);
          console.log(`[AIClient] English response:`, englishResponse ? `Success (${englishResponse.length} chars)` : 'Failed');
          
          if (englishResponse && englishResponse.trim().length > 2) {
            // Try to preserve JSON structure: use i18now.ai for JSON translation
            try {
              const parsed = JSON.parse(englishResponse);
              
              // Use i18now.ai to translate the JSON object
              console.log(`[AIClient] Using i18now.ai for JSON translation to ${language}`);
              const translated = await translateJSONWithI18Now(parsed, 'en', language);
              
              if (translated && typeof translated === 'object') {
                // Ensure urgency and other enum fields remain unchanged
                if (parsed.urgency) {
                  translated.urgency = parsed.urgency;
                }
                if (parsed.isFollowUp !== undefined) {
                  translated.isFollowUp = parsed.isFollowUp;
                }
                if (parsed.isComplete !== undefined) {
                  translated.isComplete = parsed.isComplete;
                }
                
                const jsonResponse = JSON.stringify(translated);
                console.log(`[AIClient] i18now.ai JSON translation SUCCESS - returning in ${language}`);
                return jsonResponse;
              } else {
                // Fallback to manual translation if i18now.ai returns null
                console.log(`[AIClient] i18now.ai returned null, falling back to manual translation`);
                const translated = { ...parsed };
                
                // Helper to translate a single string field
                const translateField = async (value?: string) => {
                  if (!value || typeof value !== 'string') return value;
                  const result = await this.translateText(value, 'en', language);
                  return result && result.trim().length > 0 ? result : value;
                };
                
                // Helper to translate string arrays
                const translateArray = async (arr?: any[]) => {
                  if (!Array.isArray(arr)) return arr;
                  const translatedArr = [];
                  for (const item of arr) {
                    if (typeof item === 'string') {
                      translatedArr.push((await translateField(item)) as string);
                    } else {
                      translatedArr.push(item);
                    }
                  }
                  return translatedArr;
                };
                
                translated.response = await translateField(parsed.response);
                translated.summary = await translateField(parsed.summary);
                translated.recommendations = await translateArray(parsed.recommendations);
                translated.prescriptions = await translateArray(parsed.prescriptions);
                
                // Urgency should remain the enumerated value; don't translate to avoid breaking downstream logic
                const jsonResponse = JSON.stringify(translated);
                console.log(`[AIClient] Manual translation SUCCESS (JSON preserved) - returning in ${language}`);
                return jsonResponse;
              }
            } catch (jsonErr) {
              console.warn('[AIClient] English response not valid JSON, falling back to whole-text translation:', jsonErr);
            }
            
            console.log(`[AIClient] Step 3: Translating response back to ${language}`);
            const translatedResponse = await this.translateText(englishResponse, 'en', language);
            console.log(`[AIClient] Final translation:`, translatedResponse ? `Success (${translatedResponse.length} chars)` : 'Failed');
            
            if (translatedResponse && translatedResponse.trim().length > 2) {
              console.log(`[AIClient] Translation approach SUCCESS - returning in ${language}`);
              return translatedResponse;
            }
          }
        }
      } catch (error) {
        console.error(`[AIClient] Translation approach error:`, error);
      }
      console.log(`[AIClient] Translation approach failed, falling back to direct method`);
    }

    // Check if prompt already contains system instructions (common pattern)
    const hasSystemInstructions = prompt.includes('CRITICAL') || prompt.includes('You are') || prompt.includes('system');
    
    const languageName = language === 'am' ? 'Amharic (አማርኛ)' : language === 'ti' ? 'Tigrinya (ትግርኛ)' : 'English';
    
    // If prompt already has system instructions, don't add conflicting system message
    // Instead, prepend a strong language instruction to ensure consistency
    const languageInstruction = `CRITICAL: You MUST respond EXCLUSIVELY in ${languageName} language. Match the language of the user's input message. DO NOT switch languages.\n\n`;
    
    const messages = hasSystemInstructions
      ? [
          {
            role: 'user',
            content: languageInstruction + prompt,
          },
        ]
      : [
          {
            role: 'system',
            content: `You are a helpful AI assistant. CRITICAL: You MUST respond EXCLUSIVELY in ${languageName} language. Match the language of the user's input message. DO NOT switch to any other language.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ];

    // ALWAYS try Gemini first if available (it's better for multilingual)
    if (geminiAvailable) {
      console.log('[AIClient] FORCING Gemini usage (available)');
      const geminiResponse = await this.makeRequest(messages, 4000, true);
      if (geminiResponse && geminiResponse.trim() !== '' && geminiResponse.trim().length > 10) {
        console.log('[AIClient] Gemini response SUCCESS, length:', geminiResponse.length);
        return geminiResponse;
      }
      console.log('[AIClient] Gemini returned empty/incomplete, trying Groq');
      console.log('[AIClient] Gemini response preview:', geminiResponse?.substring(0, 100) || 'null/empty');
    }
    
    // Fallback to Groq with proper tokens
    if (this.groqClient) {
      console.log('[AIClient] Using Groq as fallback');
      const maxTokensForGroq = 4000; // Always use high tokens
      const groqResponse = await this.makeRequestWithGroq(messages, maxTokensForGroq);
      if (groqResponse && groqResponse.trim() !== '' && groqResponse.trim().length > 10) {
        console.log('[AIClient] Groq response SUCCESS, length:', groqResponse.length);
        return groqResponse;
      }
      console.warn('[AIClient] Groq returned empty/incomplete:', groqResponse?.substring(0, 100) || 'null/empty');
    }
    
    // Last resort - return error message
    console.error('[AIClient] ALL AI providers failed - returning error message');
    return 'I apologize, but I encountered an error processing your request.';
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

  async generateResponse(prompt: string, systemPrompt?: string, maxTokens: number = 2000): Promise<string> {
    const messages = systemPrompt
      ? [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ]
      : [{ role: 'user', content: prompt }];

    const response = await this.makeRequest(messages, maxTokens);
    return response || '';
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

