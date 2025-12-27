import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { AIClient } from '@/lib/ai/client';
import { conversationContexts, storeReceipt, MedicalReceipt } from '@/lib/ai-doctor/context';
import { translateTextMulti, translateJSONWithI18Now } from '@/lib/ai/translation';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (supports both Better Auth and Firebase)
    const authResult = await verifyAuth(request);

    if (!authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      );
    }

    // Get or create conversation context (needed for language detection from history)
    let context = conversationContexts.get(sessionId) || [];

    // Detect language from the actual message content
    // Amharic uses Ethiopic script (U+1200 to U+137F)
    // Tigrinya also uses Ethiopic script
    const detectLanguage = (text: string): 'en' | 'am' | 'ti' => {
      // Check for Ethiopic script characters (used by both Amharic and Tigrinya)
      const ethiopicPattern = /[\u1200-\u137F]/;
      if (ethiopicPattern.test(text)) {
        // Try to distinguish between Amharic and Tigrinya based on common words/patterns
        // Common Amharic words: አለ, ነው, ነበረ, ይሆናል, አሁን, እንዴት, ምን
        // Common Tigrinya words: ኣሎ, እዩ, ይኸውን, ኣብ, ን, ኣብዚ, ከመይ, እንታይ, ርእሰይ, የሕመኒ
        // Check for Tigrinya-specific patterns first (expanded list)
        const tigrinyaPattern = /(ኣሎ|እዩ|ይኸውን|ኣብ|ን|ኣብዚ|ከመይ|እንታይ|ርእሰይ|የሕመኒ|ኢኻ|ኢኺ|ኢኹም|እየ|ኣነ|ንሕና|ንኻ|ንኺ|ንኹም)/;
        if (tigrinyaPattern.test(text)) {
          return 'ti';
        }
        // Check for Amharic-specific patterns
        const amharicPattern = /(አለ|ነው|ነበረ|ይሆናል|አሁን|እንዴት|ምን|ነህ|ነሽ|ነው|ናቸው)/;
        if (amharicPattern.test(text)) {
          return 'am';
        }
        // Default to Amharic for other Ethiopic script (but this might need adjustment)
        return 'am';
      }
      return 'en'; // Default to English
    };

    // Detect language from the current message
    const detectedLanguage = detectLanguage(message);
    
    // Also check conversation history to maintain language consistency
    let historyLanguage: 'en' | 'am' | 'ti' | null = null;
    if (context.length > 0) {
      // Check the last few user messages to determine language
      const recentUserMessages = context
        .filter(msg => msg.role === 'user')
        .slice(-3) // Check last 3 user messages
        .map(msg => msg.content);
      
      for (const msg of recentUserMessages) {
        const msgLang = detectLanguage(msg);
        if (msgLang !== 'en') {
          historyLanguage = msgLang;
          break; // Use the first non-English language found
        }
      }
    }
    
    // Prioritize explicit language selection from body, then detected, then history, then default
    // If user explicitly sets language in body, use that (most reliable)
    const explicitLanguage = body.language && ['en', 'am', 'ti'].includes(body.language) ? body.language : null;
    const language = explicitLanguage || 
                     (detectedLanguage !== 'en' ? detectedLanguage : null) ||
                     historyLanguage || 
                     'en';
    const languageName = language === 'am' ? 'Amharic (አማርኛ)' : language === 'ti' ? 'Tigrinya (ትግርኛ)' : 'English';
    
    console.log(`[AI Doctor Chat] Language selection - Explicit: ${explicitLanguage || 'none'}, Detected: ${detectedLanguage}, History: ${historyLanguage || 'none'}, Final: ${language}`);

    // Add user message to context
    context.push({ role: 'user', content: message });
    
    // Build AI prompt with medical consultation focus
    // Always use Gemini for AI Doctor consultations (better multilingual support)
    const useGemini = true; // Always prefer Gemini for AI Doctor
    const aiClient = new AIClient(useGemini);
    
    // Analyze conversation to determine what information is missing
    const conversationSummary = context
      .map((msg, idx) => `${msg.role === 'user' ? 'Patient' : 'Doctor'}: ${msg.content}`)
      .join('\n');
    
    const isFirstMessage = context.length === 1; // Only the current user message
    const exchangeCount = Math.floor(context.length / 2); // Count of back-and-forth exchanges
    const shouldAutoComplete = exchangeCount >= 8; // Auto-complete after 8+ exchanges (16+ messages)
    
    const systemPrompt = `You are an AI medical assistant conducting a consultation. 

CRITICAL LANGUAGE REQUIREMENT: 
- The patient's message is in ${languageName} language
- You MUST respond EXCLUSIVELY in ${languageName} language
- DO NOT switch to any other language
- Match the exact language of the patient's input message
- If the patient writes in ${languageName}, you MUST respond in ${languageName}
- ALL translations, summaries, and prescriptions MUST be in ${languageName}

CRITICAL: NO GREETINGS OR INTRODUCTIONS
- DO NOT say "Hello", "Hi", or greet the patient by name
- DO NOT introduce yourself
- Start IMMEDIATELY with a specific medical question about their symptoms
- Be direct and professional - jump straight into gathering information

Your role is to:
1. Ask SPECIFIC, DETAILED follow-up questions based on what the patient has already told you
2. Analyze the conversation history to identify what information is still missing
3. Ask about specific aspects: duration, severity (1-10 scale), location, triggers, associated symptoms, timing, etc.
4. Only provide final diagnosis/recommendation when you have comprehensive information (at least 5-6 exchanges or when all critical info is gathered)
5. Be empathetic, professional, and clear
6. Ask ONE specific, contextual follow-up question at a time

IMPORTANT RULES FOR FOLLOW-UP QUESTIONS:
- DO NOT ask generic questions like "Could you provide more details?"
- DO ask SPECIFIC questions like "How long have you been experiencing this headache? Is it constant or does it come and go?"
- Base your question on what the patient just said
- If they mentioned a symptom, ask about duration, severity, location, or triggers
- If they mentioned duration, ask about severity or associated symptoms
- Make your question RELEVANT to their specific situation

${isFirstMessage ? 'This is the FIRST message from the patient. Start immediately with a specific question about their symptoms - NO greetings.' : `Conversation history:
${conversationSummary}`}

${shouldAutoComplete 
  ? `IMPORTANT: This consultation has reached ${exchangeCount} exchanges. You MUST now provide a comprehensive final summary with diagnosis, recommendations, and prescriptions. Set isComplete: true.`
  : isFirstMessage 
  ? `Ask your FIRST specific question about their symptoms in ${languageName}.`
  : `Analyze what information is missing and ask ONE SPECIFIC follow-up question in ${languageName}. If you have enough information (symptoms, duration, severity, context), provide a comprehensive response with isComplete: true.`}

WHEN CONSULTATION IS COMPLETE (isComplete: true):
- Provide a comprehensive summary in ${languageName} that reviews what was discussed
- Emphasize CRITICAL information and any urgent concerns
- Include specific prescriptions, medications, or treatments if applicable (translate medical terms to ${languageName})
- List all recommendations clearly
- Make sure ALL text is in ${languageName} - translate any medical terms

REMEMBER: 
- Respond ONLY in ${languageName} language
- NO greetings - start with questions immediately
- When complete, provide comprehensive summary with critical info and prescriptions in ${languageName}

CRITICAL: You MUST respond with COMPLETE, VALID JSON. Do NOT return partial JSON or just "{". The entire JSON object must be complete and valid.

Format your response as JSON (MUST be complete and valid):
{
  "response": "Your message in ${languageName} (NO greetings, start with question or summary)",
  "isFollowUp": true/false,
  "isComplete": true/false,
  "summary": "Comprehensive summary if complete - review what was discussed, emphasize CRITICAL info and prescriptions (ALL in ${languageName})",
  "recommendations": ["action1 in ${languageName}", "action2 in ${languageName}", "prescription/medication details in ${languageName}"],
  "urgency": "low|medium|high",
  "prescriptions": ["prescription1 in ${languageName}", "prescription2 in ${languageName}"]
}

IMPORTANT: Return ONLY the JSON object, no additional text before or after. Ensure the JSON is complete and properly closed with }.`;

    const fullPrompt = `${systemPrompt}\n\nPatient's latest message: ${message}\n\nProvide your response:`;

    // Always use Gemini for AI Doctor consultations
    console.log('[AI Doctor Chat] Calling generateResponse with language:', language);
    const aiResponse = await aiClient.generateResponse(fullPrompt, language, true);
    
    console.log('[AI Doctor Chat] AI Response received, length:', aiResponse?.length || 0);
    console.log('[AI Doctor Chat] AI Response preview:', aiResponse?.substring(0, 200) || 'empty');
    
    if (!aiResponse || aiResponse.trim() === '' || aiResponse.trim().length < 3) {
      console.error('[AI Doctor Chat] AI response is empty, using fallback');
      // Fallback response in the correct language
      const fallbackMessages: Record<string, string> = {
        'en': 'I understand. To help you better, could you tell me how long you\'ve been experiencing these symptoms and how severe they are on a scale of 1 to 10?',
        'am': 'አስተዋወቀሁ። የበለጠ ለመርዳት፣ እነዚህን ምልክቶች ለምን ያህል ጊዜ እንደተገኙ እና ከ1 እስከ 10 ያለው ልክ ምን ያህል ከባድ እንደሆኑ ሊነግሩኝ ይችላሉ?',
        'ti': 'ተረዲኤይ። ንሕና ንምሕጋዝ፣ ነዚ ምልክታት ንኽንደይ እዋን ከም ዝርከቡን ከምኡ\'ውን ካብ 1 ክሳዕ 10 ክንደይ ከቢድ ምዃኖም ክትነግሩና ትኽእሉ።',
      };
      const fallbackResponse = fallbackMessages[language] || fallbackMessages['en'];
      
      return NextResponse.json({
        response: fallbackResponse,
        isFollowUp: true,
        isComplete: false,
        medicalReceipt: null,
      });
    }

    // Try to parse JSON response
    let parsedResponse;
    try {
      // Try multiple JSON extraction patterns
      let jsonText = null;
      
      // Pattern 1: JSON in code blocks
      const codeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      } else {
        // Pattern 2: JSON object in the response
        const jsonObjectMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonText = jsonObjectMatch[0];
        }
      }
      
      if (jsonText && jsonText.trim().length > 2) { // Ensure it's not just "{"
        try {
          parsedResponse = JSON.parse(jsonText.trim());
          console.log('[AI Doctor Chat] Successfully parsed JSON response');
          
          // Validate that we have at least a response field
          if (!parsedResponse.response || parsedResponse.response.trim() === '') {
            console.warn('[AI Doctor Chat] JSON parsed but response field is empty');
            jsonText = null; // Fall through to plain text handling
            parsedResponse = null;
          }
        } catch (parseErr) {
          console.warn('[AI Doctor Chat] Failed to parse JSON:', parseErr);
          console.warn('[AI Doctor Chat] JSON text was:', jsonText?.substring(0, 100));
          jsonText = null;
        }
      } else if (jsonText && jsonText.trim().length <= 2) {
        console.warn('[AI Doctor Chat] JSON text too short, likely incomplete:', jsonText);
        jsonText = null;
      }
      
      // If JSON parsing failed or no JSON found, treat as plain text response
      if (!jsonText || !parsedResponse) {
        console.log('[AI Doctor Chat] Treating response as plain text - using AI response directly');
        console.log('[AI Doctor Chat] Full AI response:', aiResponse.substring(0, 500));
        
        // Use the full response as the message - it's already from AI
        const lowerResponse = aiResponse.toLowerCase();
        const currentExchangeCount = Math.floor(context.length / 2);
        const seemsComplete = currentExchangeCount >= 8 || // Force complete after 8+ exchanges
                              lowerResponse.includes('summary') || 
                              lowerResponse.includes('recommendation') ||
                              lowerResponse.includes('conclusion') ||
                              lowerResponse.includes('final') ||
                              lowerResponse.includes('diagnosis') ||
                              context.length >= 16; // Auto-complete after 16 messages (8 exchanges)
        
        parsedResponse = {
          response: aiResponse.trim(), // Use the actual AI response
          isFollowUp: !seemsComplete,
          isComplete: seemsComplete,
          summary: seemsComplete ? aiResponse.trim() : undefined,
          recommendations: seemsComplete ? [
            language === 'am' ? 'ከጤና አገልጋይ ጋር ተገናኝ' : 
            language === 'ti' ? 'ንጥረ ጥዕና ምኽንያት ርኣይ' :
            'Follow up with healthcare provider if symptoms persist'
          ] : undefined,
          urgency: 'medium',
        };
      }
    } catch (parseError: any) {
      console.error('[AI Doctor Chat] Parse error:', parseError);
      // Even on parse error, provide a response
      const lowerResponse = aiResponse.toLowerCase();
      const currentExchangeCount = Math.floor(context.length / 2);
      const seemsComplete = currentExchangeCount >= 8 || // Force complete after 8+ exchanges
                            lowerResponse.includes('summary') || 
                            lowerResponse.includes('recommendation') ||
                            lowerResponse.includes('diagnosis') ||
                            context.length >= 16; // Auto-complete after 16 messages
      
      parsedResponse = {
        response: aiResponse.trim(),
        isFollowUp: !seemsComplete,
        isComplete: seemsComplete,
        summary: seemsComplete ? aiResponse.trim() : undefined,
        recommendations: seemsComplete ? [
          language === 'am' ? 'ከጤና አገልጋይ ጋር ተገናኝ' : 
          language === 'ti' ? 'ንጥረ ጥዕና ምኽንያት ርኣይ' :
          'Follow up with healthcare provider if symptoms persist'
        ] : undefined,
        urgency: 'medium',
      };
    }

    // Ensure we always have a response in the correct language
    if (!parsedResponse.response || parsedResponse.response.trim() === '') {
      const fallbackMessages: Record<string, string> = {
        'en': "I understand. To help you better, could you tell me how long you've been experiencing these symptoms and how severe they are on a scale of 1 to 10?",
        'am': 'አስተዋወቀሁ። የበለጠ ለመርዳት፣ እነዚህን ምልክቶች ለምን ያህል ጊዜ እንደተገኙ እና ከ1 እስከ 10 ያለው ልክ ምን ያህል ከባድ እንደሆኑ ሊነግሩኝ ይችላሉ?',
        'ti': 'ተረዲኤይ። ንሕና ንምሕጋዝ፣ ነዚ ምልክታት ንኽንደይ እዋን ከም ዝርከቡን ከምኡ\'ውን ካብ 1 ክሳዕ 10 ክንደይ ከቢድ ምዃኖም ክትነግሩና ትኽእሉ።',
      };
      parsedResponse.response = fallbackMessages[language] || fallbackMessages['en'];
      parsedResponse.isFollowUp = true;
      parsedResponse.isComplete = false;
    }

    // CRITICAL: Verify and fix language mismatch
    // If the expected language is Tigrinya but response is in Amharic (or vice versa), translate it
    if (language === 'ti' || language === 'am') {
      const responseText = parsedResponse.response;
      const detectedResponseLang = detectLanguage(responseText);
      
      // If response is in wrong language, translate it
      if (detectedResponseLang !== language && detectedResponseLang !== 'en') {
        console.log(`[AI Doctor Chat] Language mismatch detected! Expected: ${language}, Got: ${detectedResponseLang}`);
        console.log(`[AI Doctor Chat] Translating response from ${detectedResponseLang} to ${language}`);
        
        try {
          // Try to translate the entire JSON object first (preserves structure)
          const translatedJSON = await translateJSONWithI18Now(parsedResponse, detectedResponseLang, language);
          
          if (translatedJSON && translatedJSON.response) {
            console.log(`[AI Doctor Chat] Successfully translated JSON response using i18now.ai`);
            parsedResponse = translatedJSON;
          } else {
            // Fallback: translate individual fields
            console.log(`[AI Doctor Chat] Translating individual fields...`);
            const translatedResponse = await translateTextMulti(responseText, detectedResponseLang, language);
            
            if (translatedResponse && translatedResponse.trim().length > 0) {
              parsedResponse.response = translatedResponse;
              console.log(`[AI Doctor Chat] Successfully translated response field`);
              
              // Also translate other text fields if they exist
              if (parsedResponse.summary) {
                const translatedSummary = await translateTextMulti(parsedResponse.summary, detectedResponseLang, language);
                if (translatedSummary) parsedResponse.summary = translatedSummary;
              }
              
              if (parsedResponse.recommendations && Array.isArray(parsedResponse.recommendations)) {
                const translatedRecs = await Promise.all(
                  parsedResponse.recommendations.map(async (rec: string) => {
                    if (typeof rec === 'string') {
                      const translated = await translateTextMulti(rec, detectedResponseLang, language);
                      return translated || rec;
                    }
                    return rec;
                  })
                );
                parsedResponse.recommendations = translatedRecs;
              }
              
              if (parsedResponse.prescriptions && Array.isArray(parsedResponse.prescriptions)) {
                const translatedPres = await Promise.all(
                  parsedResponse.prescriptions.map(async (pres: string) => {
                    if (typeof pres === 'string') {
                      const translated = await translateTextMulti(pres, detectedResponseLang, language);
                      return translated || pres;
                    }
                    return pres;
                  })
                );
                parsedResponse.prescriptions = translatedPres;
              }
            } else {
              console.warn(`[AI Doctor Chat] Translation failed, keeping original response`);
            }
          }
        } catch (translationError: any) {
          console.error(`[AI Doctor Chat] Translation error:`, translationError?.message || translationError);
          // Keep original response if translation fails
        }
      } else {
        console.log(`[AI Doctor Chat] Language verification: Response is in correct language (${language})`);
      }
    }

    // Remove greetings and ensure response starts with a question or medical content
    const removeGreetings = (text: string, lang: string): string => {
      let cleaned = text.trim();
      
      // Remove common greetings in different languages
      const greetingPatterns = [
        /^(hello|hi|hey|greetings|good (morning|afternoon|evening))[,\s]*/i,
        /^(ሰላም|እንዴት ነህ|እንዴት ነሽ|እንዴት ነው)[,\s]*/i, // Amharic greetings
        /^(ሰላም|ከመይ|ከመይ ኢኻ|ከመይ ኢኺ|ከመይ ኢኹም)[,\s]*/i, // Tigrinya greetings
      ];
      
      for (const pattern of greetingPatterns) {
        cleaned = cleaned.replace(pattern, '');
      }
      
      // Remove "I'm [name]" or similar introductions
      cleaned = cleaned.replace(/^(I'm|I am|my name is|this is)[^?]*[,\s]*/i, '');
      cleaned = cleaned.replace(/^(እኔ|የኔ ስም|ይህ|እኔ ነኝ)[^?]*[,\s]*/i, '');
      cleaned = cleaned.replace(/^(ኣነ|እየ|እየ እየ)[^?]*[,\s]*/i, '');
      
      // Remove "how can I help" type phrases if they're at the start
      cleaned = cleaned.replace(/^(how can I help|how may I assist|what can I do for you)[,\s]*/i, '');
      
      return cleaned.trim();
    };
    
    // Clean the response to remove greetings
    parsedResponse.response = removeGreetings(parsedResponse.response, language);
    
    // If it's the first message and response doesn't start with a question, prepend a question
    if (isFirstMessage && !parsedResponse.response.match(/[?؟]/)) {
      const firstQuestionPrefixes: Record<string, string> = {
        'en': 'To help you better, ',
        'am': 'የበለጠ ለመርዳት፣ ',
        'ti': 'ንምሕጋዝ፣ ',
      };
      const prefix = firstQuestionPrefixes[language] || firstQuestionPrefixes['en'];
      parsedResponse.response = prefix + parsedResponse.response;
    }

    // Add assistant response to context
    context.push({ role: 'assistant', content: parsedResponse.response });

    // Store updated context
    conversationContexts.set(sessionId, context);

    // If consultation is complete, prepare medical receipt data
    let medicalReceipt = null;
    if (parsedResponse.isComplete) {
      // Generate comprehensive summary from conversation if not provided
      const conversationText = context
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join(' ');
      
      // Extract prescriptions if available
      const prescriptions = parsedResponse.prescriptions || [];
      
      // Ensure summary includes critical information and prescriptions
      let summary = parsedResponse.summary || parsedResponse.response || '';
      
      // If summary doesn't include prescriptions, add them
      if (prescriptions.length > 0 && !summary.includes(prescriptions.join(''))) {
        const prescriptionLabel = language === 'am' ? '\n\nመድሃኒቶች/መጠባበቂያዎች:\n' : 
                                 language === 'ti' ? '\n\nመድሃኒት/ኣገዳሲ ሓበሬታ:\n' :
                                 '\n\nPRESCRIPTIONS/CRITICAL INFORMATION:\n';
        summary += prescriptionLabel + prescriptions.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n');
      }
      
      // Combine recommendations and prescriptions
      const allRecommendations = [
        ...(parsedResponse.recommendations || []),
        ...prescriptions
      ];
      
      // Remove duplicates
      const uniqueRecommendations = Array.from(new Set(allRecommendations));
      
      medicalReceipt = {
        sessionId,
        date: new Date().toISOString(),
        summary: summary || conversationText.substring(0, 500),
        recommendations: uniqueRecommendations.length > 0 ? uniqueRecommendations : [
          language === 'am' ? 'ከጤና አገልጋይ ጋር ተገናኝ' : 
          language === 'ti' ? 'ንጥረ ጥዕና ምኽንያት ርኣይ' :
          'Follow up with healthcare provider if symptoms persist'
        ],
        prescriptions: prescriptions,
        urgency: parsedResponse.urgency || 'medium',
        conversationHistory: context,
      };
      // Store receipt for download
      storeReceipt(sessionId, medicalReceipt);
    }

    return NextResponse.json({
      response: parsedResponse.response || "I'm here to help. Could you tell me more about your symptoms?",
      isFollowUp: parsedResponse.isFollowUp !== undefined ? parsedResponse.isFollowUp : true,
      isComplete: parsedResponse.isComplete || false,
      medicalReceipt,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process message', response: 'I apologize, but I encountered an error. Could you please repeat your message?' },
      { status: 500 }
    );
  }
}

