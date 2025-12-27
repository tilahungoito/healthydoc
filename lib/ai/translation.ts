import axios from 'axios';
import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';
import { Config } from '@/config';

type Lang = 'en' | 'am' | 'ti' | string;

const normalizeLang = (lang: Lang) => {
  if (!lang) return 'en';
  const lower = lang.toLowerCase();
  if (['en', 'am', 'ti'].includes(lower)) return lower;
  return lower;
};

// Map language codes to i18now.ai format
const mapLangToI18Now = (lang: string): string => {
  const langMap: Record<string, string> = {
    'en': 'en',
    'am': 'am', // Amharic
    'ti': 'ti', // Tigrinya
  };
  return langMap[lang.toLowerCase()] || lang.toLowerCase();
};

// Translate text using i18now.ai
const translateWithI18Now = async (text: string, from: string, to: string) => {
  // Try with API key first, then without if no key is provided
  const apiKey = Config.I18NOW_API_KEY;
  const apiUrl = Config.I18NOW_API_URL || 'https://api.i18now.ai';
  const fromLang = mapLangToI18Now(from);
  const toLang = mapLangToI18Now(to);
  
  try {
    // Try different API endpoint patterns
    const endpoints = [
      `${apiUrl}/translate`,
      `${apiUrl}/v1/translate`,
      `${apiUrl}/api/translate`,
      `https://www.i18now.ai/api/translate`, // Try the main website API
    ];
    
    for (const endpoint of endpoints) {
      try {
        // Build headers - include API key if available
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        
        // Pattern 1: Standard REST API POST
        const response = await axios.post(
          endpoint,
          {
            text: text,
            from: fromLang,
            to: toLang,
          },
          { headers }
        );
        
        const translated = response.data?.translatedText || 
                          response.data?.translation || 
                          response.data?.text ||
                          response.data?.result ||
                          response.data?.data?.translatedText;
        
        if (translated && typeof translated === 'string' && translated.trim().length > 0) {
          console.log('[Translation] i18now.ai success');
          return translated.trim();
        }
      } catch (err: any) {
        // Try next endpoint pattern
        if (Config.DEBUG) {
          console.log(`[Translation] i18now.ai endpoint ${endpoint} failed:`, err?.message);
        }
        continue;
      }
    }
    
    // Pattern 2: Query parameter style GET (no auth required)
    try {
      const queryUrl = `${apiUrl}/translate?text=${encodeURIComponent(text)}&from=${fromLang}&to=${toLang}`;
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      const response = await axios.get(queryUrl, { headers });
      
      const translated = response.data?.translatedText || 
                        response.data?.translation || 
                        response.data?.text ||
                        response.data?.result;
      
      if (translated && typeof translated === 'string' && translated.trim().length > 0) {
        console.log('[Translation] i18now.ai success (GET)');
        return translated.trim();
      }
    } catch (err: any) {
      if (Config.DEBUG) {
        console.log('[Translation] i18now.ai GET method failed:', err?.message);
      }
    }
    
  } catch (err: any) {
    if (Config.DEBUG) {
      console.warn('[Translation] i18now.ai failed:', err?.message || err);
    }
  }
  
  // If no API key and all methods failed, log helpful message
  if (!apiKey && Config.DEBUG) {
    console.log('[Translation] i18now.ai: No API key configured. Set I18NOW_API_KEY in .env.local if you have one.');
  }
  
  return null;
};

// Translate JSON object preserving structure using i18now.ai
export const translateJSONWithI18Now = async (
  jsonObj: any,
  fromLang: Lang,
  toLang: Lang
): Promise<any | null> => {
  // Try with or without API key - i18now.ai might be a public service
  const apiKey = Config.I18NOW_API_KEY;
  
  const from = normalizeLang(fromLang);
  const to = normalizeLang(toLang);
  if (from === to) return jsonObj;
  
  try {
    const apiUrl = Config.I18NOW_API_URL || 'https://api.i18now.ai';
    const fromLangCode = mapLangToI18Now(from);
    const toLangCode = mapLangToI18Now(to);
    
    // Try JSON translation endpoint
    const endpoints = [
      `${apiUrl}/translate/json`,
      `${apiUrl}/v1/translate/json`,
      `${apiUrl}/api/translate/json`,
      `https://www.i18now.ai/api/translate/json`, // Try main website
      `${apiUrl}/translate`,
    ];
    
    for (const endpoint of endpoints) {
      try {
        // Build headers - include API key if available
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        
        const response = await axios.post(
          endpoint,
          {
            json: jsonObj,
            from: fromLangCode,
            to: toLangCode,
            preserveStructure: true,
          },
          { headers }
        );
        
        const translated = response.data?.translated || 
                          response.data?.result || 
                          response.data?.json ||
                          response.data;
        
        if (translated && typeof translated === 'object') {
          console.log('[Translation] i18now.ai JSON success');
          return translated;
        }
      } catch (err: any) {
        // Try next endpoint
        continue;
      }
    }
    
    // Fallback: Translate individual fields
    console.log('[Translation] i18now.ai JSON endpoint not found, translating fields individually');
    const translated = { ...jsonObj };
    
    // Translate string fields
    const translateField = async (value: any): Promise<any> => {
      if (typeof value === 'string' && value.trim().length > 0) {
        const translatedText = await translateWithI18Now(value, from, to);
        return translatedText || value;
      } else if (Array.isArray(value)) {
        return Promise.all(value.map(item => translateField(item)));
      } else if (value && typeof value === 'object') {
        const result: any = {};
        for (const [key, val] of Object.entries(value)) {
          result[key] = await translateField(val);
        }
        return result;
      }
      return value;
    };
    
    // Translate specific fields that should be translated
    if (translated.response) {
      translated.response = await translateField(translated.response);
    }
    if (translated.summary) {
      translated.summary = await translateField(translated.summary);
    }
    if (translated.recommendations) {
      translated.recommendations = await translateField(translated.recommendations);
    }
    if (translated.prescriptions) {
      translated.prescriptions = await translateField(translated.prescriptions);
    }
    
    return translated;
  } catch (err: any) {
    if (Config.DEBUG) {
      console.warn('[Translation] i18now.ai JSON failed:', err?.message || err);
    }
    
    // If no API key, provide helpful message
    if (!apiKey && Config.DEBUG) {
      console.log('[Translation] i18now.ai: No API key configured. The system will fall back to other translation providers.');
      console.log('[Translation] To use i18now.ai, add I18NOW_API_KEY to your .env.local file.');
      console.log('[Translation] If i18now.ai doesn\'t require an API key, leave it empty and the system will try without authentication.');
    }
    
    return null;
  }
};

const translateWithGoogle = async (text: string, from: string, to: string) => {
  if (!Config.GOOGLE_TRANSLATE_API_KEY) return null;
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${Config.GOOGLE_TRANSLATE_API_KEY}`;
    const response = await axios.post(url, {
      q: text,
      source: from,
      target: to,
      format: 'text',
    });
    const translated = response.data?.data?.translations?.[0]?.translatedText;
    if (translated) {
      console.log('[Translation] Google success');
      return translated;
    }
  } catch (err: any) {
    console.warn('[Translation] Google failed:', err?.message || err);
  }
  return null;
};

const translateWithAzure = async (text: string, from: string, to: string) => {
  if (!Config.AZURE_TRANSLATOR_KEY || !Config.AZURE_TRANSLATOR_REGION) return null;
  try {
    const endpoint = Config.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
    const url = `${endpoint}/translate?api-version=3.0&from=${from}&to=${to}`;
    const response = await axios.post(
      url,
      [{ Text: text }],
      {
        headers: {
          'Ocp-Apim-Subscription-Key': Config.AZURE_TRANSLATOR_KEY,
          'Ocp-Apim-Subscription-Region': Config.AZURE_TRANSLATOR_REGION,
          'Content-Type': 'application/json',
        },
      }
    );
    const translated = response.data?.[0]?.translations?.[0]?.text;
    if (translated) {
      console.log('[Translation] Azure success');
      return translated;
    }
  } catch (err: any) {
    console.warn('[Translation] Azure failed:', err?.message || err);
  }
  return null;
};

const translateWithAmazon = async (text: string, from: string, to: string) => {
  if (!Config.AWS_REGION || !Config.AWS_ACCESS_KEY_ID || !Config.AWS_SECRET_ACCESS_KEY) return null;
  try {
    const client = new TranslateClient({
      region: Config.AWS_REGION,
      credentials: {
        accessKeyId: Config.AWS_ACCESS_KEY_ID,
        secretAccessKey: Config.AWS_SECRET_ACCESS_KEY,
      },
    });
    const command = new TranslateTextCommand({
      Text: text,
      SourceLanguageCode: from,
      TargetLanguageCode: to,
    });
    const response = await client.send(command);
    const translated = response.TranslatedText;
    if (translated) {
      console.log('[Translation] Amazon success');
      return translated;
    }
  } catch (err: any) {
    console.warn('[Translation] Amazon failed:', err?.message || err);
  }
  return null;
};

export const translateTextMulti = async (
  text: string,
  fromLang: Lang,
  toLang: Lang
): Promise<string | null> => {
  const from = normalizeLang(fromLang);
  const to = normalizeLang(toLang);
  if (from === to) return text;
  if (!text || text.trim() === '') return text;

  // Prioritize i18now.ai as the primary translator
  const translators = [
    translateWithI18Now,
    translateWithGoogle,
    translateWithAzure,
    translateWithAmazon,
  ];

  for (const translate of translators) {
    const result = await translate(text, from, to);
    if (result && result.trim().length > 0) {
      return result.trim();
    }
  }

  console.warn('[Translation] All providers failed');
  return null;
};



