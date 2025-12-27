import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import {
  conversationContexts,
  getReceipt,
  storeReceipt,
  MedicalReceipt,
} from '@/lib/ai-doctor/context';
import { AIClient } from '@/lib/ai/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> | { sessionId: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  return handleReceiptRequest(request, resolvedParams);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> | { sessionId: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  return handleReceiptRequest(request, resolvedParams);
}

async function handleReceiptRequest(
  request: NextRequest,
  params: { sessionId: string }
) {
  try {
    // Verify authentication (supports both Better Auth and Firebase)
    const authResult = await verifyAuth(request);

    if (!authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = params;
    console.log(`[AI Doctor Receipt] Request for session: ${sessionId}`);

    // Get receipt data from store if already generated
    let receiptData = getReceipt(sessionId);
    console.log(`[AI Doctor Receipt] Stored receipt found: ${!!receiptData}`);

    if (!receiptData) {
      // Try to get context from server-side storage first
      let context = conversationContexts.get(sessionId);
      console.log(`[AI Doctor Receipt] Context found: ${!!context}, length: ${context?.length || 0}`);

      // If no server-side context, try to get from POST body (frontend fallback)
      if (!context || context.length === 0) {
        if (request.method === 'POST') {
          try {
            const body = await request.json().catch(() => null);
            if (body?.conversationMessages && Array.isArray(body.conversationMessages) && body.conversationMessages.length > 0) {
              console.log(`[AI Doctor Receipt] Using conversation from POST body, length: ${body.conversationMessages.length}`);
              context = body.conversationMessages.map((msg: any) => ({
                role: msg.role,
                content: msg.content,
              }));
              // Store it temporarily for this request (don't persist, just for generation)
            }
          } catch (e) {
            console.warn('[AI Doctor Receipt] Failed to parse POST body:', e);
          }
        }
      }

      if (!context || context.length === 0) {
        console.warn(`[AI Doctor Receipt] No context found for session ${sessionId}`);
        // Instead of 404, generate a minimal receipt from any available data
        // This handles cases where consultation ended before completion
        receiptData = {
          sessionId,
          date: new Date().toISOString(),
          summary: 'Consultation summary is being generated. Please try again in a moment, or contact support if this issue persists.',
          recommendations: [
            'Please consult with a qualified healthcare professional for a complete assessment.',
            'If you have urgent symptoms, seek immediate medical attention.',
          ],
          prescriptions: [],
          urgency: 'medium',
        };
        // Store it so subsequent requests work
        storeReceipt(sessionId, receiptData);
        const { conversationHistory, ...publicReceipt } = receiptData;
        return NextResponse.json(publicReceipt);
      }

      // Detect language roughly from recent user messages (default to English)
      const detectLanguage = (text: string): 'en' | 'am' | 'ti' => {
        const ethiopicPattern = /[\u1200-\u137F]/;
        if (ethiopicPattern.test(text)) {
          const tigrinyaPattern =
            /(ኣሎ|እዩ|ይኸውን|ኣብ|ን|ኣብዚ|ከመይ|እንታይ|ርእሰይ|የሕመኒ|ኢኻ|ኢኺ|ኢኹም|እየ|ኣነ|ንሕና|ንኻ|ንኺ|ንኹም)/;
          if (tigrinyaPattern.test(text)) {
            return 'ti';
          }
          const amharicPattern =
            /(አለ|ነው|ነበረ|ይሆናል|አሁን|እንዴት|ምን|ነህ|ነሽ|ናቸው)/;
          if (amharicPattern.test(text)) {
            return 'am';
          }
          return 'am';
        }
        return 'en';
      };

      let language: 'en' | 'am' | 'ti' = 'en';
      const recentUserMessages = context
        .filter((msg) => msg.role === 'user')
        .slice(-3)
        .map((msg) => msg.content);

      for (const msg of recentUserMessages) {
        const lang = detectLanguage(msg);
        if (lang !== 'en') {
          language = lang;
          break;
        }
      }

      const languageName =
        language === 'am'
          ? 'Amharic (አማርኛ)'
          : language === 'ti'
          ? 'Tigrinya (ትግርኛ)'
          : 'English';

      // Build a clean conversation transcript for the AI
      const conversationSummary = context
        .map((msg) =>
          msg.role === 'user'
            ? `Patient: ${msg.content}`
            : `Doctor: ${msg.content}`
        )
        .join('\n');

      // Enhanced prompt for comprehensive medical summary with proper structure
      const systemPrompt = `You are an expert medical AI doctor. Analyze the ENTIRE consultation conversation and create a comprehensive medical summary in ${languageName}.

CRITICAL: You MUST return ONLY valid JSON with this EXACT structure:

{
  "summary": "A detailed paragraph summarizing the patient's complaint, symptoms analyzed, and the most likely diagnosis with reasoning. Write in ${languageName} as a professional medical summary paragraph.",
  "diagnosis": "A clear paragraph stating the most likely diagnosis(es) based on the symptoms and conversation. Include differential diagnoses if applicable. Write in ${languageName}.",
  "recommendations": "A detailed paragraph with health tips, lifestyle recommendations, and next steps. Write in ${languageName} as a flowing paragraph.",
  "prescriptions": ["Specific medication name and dosage if needed (in ${languageName}), or empty array if none"],
  "urgency": "low|medium|high"
}

IMPORTANT:
- All text MUST be in ${languageName} language
- Write summary, diagnosis, and recommendations as proper paragraphs (not bullet points)
- Be specific and professional
- Include possible diagnosis based on symptoms discussed
- Provide actionable recommendations

Return ONLY the JSON object, no additional text before or after.`;

      const prompt = `Full consultation transcript:\n${conversationSummary}\n\nBased on this entire conversation, generate a comprehensive medical summary JSON with summary paragraph, diagnosis paragraph, recommendations paragraph, prescriptions (if any), and urgency level. All content must be in ${languageName}.`;

      // Use Promise.race to timeout after 15 seconds
      const aiClient = new AIClient(true);
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 15000); // 15 second timeout
      });

      console.log(`[AI Doctor Receipt] Generating AI summary for ${context.length} messages in ${language}`);
      const aiResponsePromise = aiClient.generateResponse(prompt, language, true);
      const aiResponse = await Promise.race([aiResponsePromise, timeoutPromise]);

      if (!aiResponse || aiResponse.trim().length < 3) {
        console.warn('[AI Doctor Receipt] AI generation failed or timed out, using fallback');
        // Use fallback instead of error
        const userSide = context
          .filter((m) => m.role === 'user')
          .map((m) => m.content)
          .join(' ');

        receiptData = {
          sessionId,
          date: new Date().toISOString(),
          summary: `Based on the consultation, the patient reported: ${userSide.slice(0, 300)}. Please consult with a healthcare professional for a complete assessment and diagnosis.`,
          recommendations: [
            language === 'am'
              ? 'እባክዎ በአግባቡ የሚመርመርዎ የጤና ባለሙያን ያግኙ።'
              : language === 'ti'
              ? 'እባክዎ ዝተመረመረ ባለሙያ ጥዕና ሓላፊ ርኣይ።'
              : 'Please see a qualified healthcare professional for a full assessment.',
          ],
          prescriptions: [],
          urgency: 'medium',
          conversationHistory: context,
        };
        storeReceipt(sessionId, receiptData);
        const { conversationHistory, ...publicReceipt } = receiptData;
        return NextResponse.json(publicReceipt);
      }

      // Extract and parse JSON from AI response
      let parsed: any = null;
      try {
        let jsonText: string | null = null;
        const codeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonText = codeBlockMatch[1];
        } else {
          const jsonObjectMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            jsonText = jsonObjectMatch[0];
          }
        }

        if (jsonText && jsonText.trim().length > 2) {
          parsed = JSON.parse(jsonText.trim());
        }
      } catch (e) {
        console.error(
          '[AI Doctor Receipt] Failed to parse AI summary JSON:',
          e
        );
      }

      if (!parsed || !parsed.summary) {
        // Fallback minimal summary if parsing failed
        const userSide = context
          .filter((m) => m.role === 'user')
          .map((m) => m.content)
          .join(' ');

        const fallbackSummary = language === 'am'
          ? `በዚህ የጤና ምክክር ላይ የታመመው ሰው የሚከተሉትን ምልክቶች አስታውቋል: ${userSide.slice(0, 300)}. ለሙሉ የጤና ግምገማ እባክዎ በአግባቡ የሚመርመርዎ የጤና ባለሙያን ያግኙ።`
          : language === 'ti'
          ? `ኣብዚ ምክክር ጥዕና፣ እቲ ሕሙም ነዚ ምልክታት ኣረኣኢዩ: ${userSide.slice(0, 300)}. ንምሉእ ግምገማ ጥዕና፣ እባክዎ ዝተመረመረ ባለሙያ ጥዕና ሓላፊ ርኣይ።`
          : `Based on this consultation, the patient reported the following symptoms: ${userSide.slice(0, 300)}. Please consult with a qualified healthcare professional for a complete assessment and proper diagnosis.`;

        receiptData = {
          sessionId,
          date: new Date().toISOString(),
          summary: fallbackSummary,
          diagnosis: language === 'am'
            ? 'ለትክክለኛ የጤና ምርመራ እና ምርመራ እባክዎ የጤና ባለሙያን ያግኙ።'
            : language === 'ti'
            ? 'ንቕኑዕ ምርመራ ጥዕና፣ እባክዎ ዝተመረመረ ባለሙያ ጥዕና ሓላፊ ርኣይ።'
            : 'Please see a qualified healthcare professional for proper diagnosis.',
          recommendations: language === 'am'
            ? 'እባክዎ ምልክቶችዎን በጥንቃቄ ይከታተሉ። ምልክቶች ከባድ ከሆኑ ወይም ካልተቋረጡ ወዲያውኑ የጤና እርዳታ ይፈልጉ።'
            : language === 'ti'
            ? 'እባክዎ ነዚ ምልክታት ብጥንቃቐ ርኣዩ። እንተ ከቢድ ወይ እንተ ዘይወጸኡ፣ ብኡሕ ንጥረ ጥዕና ምኽንያት ርኣይ።'
            : 'Please monitor your symptoms closely. If symptoms worsen or persist, seek immediate medical attention.',
          prescriptions: [],
          urgency: 'medium',
          conversationHistory: context,
        };
      } else {
        // Combine summary, diagnosis, and recommendations into a comprehensive summary paragraph
        const combinedSummary = [
          parsed.summary || '',
          parsed.diagnosis ? `\n\nDiagnosis: ${parsed.diagnosis}` : '',
          parsed.recommendations && typeof parsed.recommendations === 'string' 
            ? `\n\nRecommendations: ${parsed.recommendations}` 
            : '',
        ].filter(Boolean).join('');

        receiptData = {
          sessionId,
          date: new Date().toISOString(),
          summary: combinedSummary || parsed.summary || '',
          diagnosis: parsed.diagnosis || '',
          recommendations: typeof parsed.recommendations === 'string'
            ? [parsed.recommendations]
            : Array.isArray(parsed.recommendations)
            ? parsed.recommendations
            : [],
          prescriptions: Array.isArray(parsed.prescriptions)
            ? parsed.prescriptions
            : [],
          urgency:
            parsed.urgency === 'low' ||
            parsed.urgency === 'high' ||
            parsed.urgency === 'medium'
              ? parsed.urgency
              : 'medium',
          conversationHistory: context,
        } as MedicalReceipt;
      }

      // Store for subsequent access
      storeReceipt(sessionId, receiptData);
      console.log(`[AI Doctor Receipt] Receipt generated and stored for session ${sessionId}`);
    }

    // Return processed medical summary (no raw conversation)
    const { conversationHistory, ...publicReceipt } = receiptData;
    console.log(`[AI Doctor Receipt] Returning receipt for session ${sessionId}`);
    return NextResponse.json(publicReceipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}
