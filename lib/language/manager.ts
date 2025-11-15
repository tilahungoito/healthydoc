import { LanguageCode, LanguageTranslations } from '@/types';

class LanguageManager {
  private currentLanguage: LanguageCode = 'en';
  private translations: Record<LanguageCode, LanguageTranslations>;

  constructor() {
    this.translations = this.loadTranslations();
  }

  private loadTranslations(): Record<LanguageCode, LanguageTranslations> {
    return {
      en: {
        app_title: 'AI Health Assistant',
        welcome_message: 'Welcome to your AI-powered health assistant!',
        health_analysis: 'Health Analysis',
        body_scanner: 'Body Scanner',
        health_facilities: 'Health Facilities',
        voice_interface: 'Voice Interface',
        settings: 'Settings',
        describe_symptoms: 'Describe your symptoms or health concern:',
        analyze_button: '🔍 Analyze Symptoms',
        analyzing: 'Analyzing symptoms...',
        analysis_results: 'Analysis Results',
        possible_conditions: 'Possible Conditions',
        recommended_actions: 'Recommended Actions',
        urgency_level: 'Urgency Level',
        general_advice: 'General Advice',
        disclaimer: 'This analysis is for informational purposes only. Please consult a healthcare professional for proper diagnosis.',
        upload_image: 'Upload an image of a body part for AI analysis.',
        select_scan_type: 'Select scan type:',
        analyze_image: '🔍 Analyze Image',
        scan_analysis: 'Scan Analysis',
        ai_enhanced: '🤖 AI-Enhanced Analysis Complete!',
        ai_insights: '🧠 AI Insights',
        ai_observations: 'AI Observations',
        ai_concerns: 'AI Concerns',
        ai_recommendations: 'AI Recommendations',
        computer_vision: '📊 Computer Vision Analysis',
        technical_observations: 'Technical Observations',
        language_settings: 'Language Settings',
        select_language: 'Select Language:',
        save_settings: '💾 Save Settings',
        settings_saved: 'Settings saved successfully!',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Information',
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        ok: 'OK',
        describe_health_concern: 'Describe Your Health Concern',
        additional_information: 'Additional Information',
        age: 'Age',
        gender: 'Gender',
        male: 'Male',
        female: 'Female',
        other: 'Other',
        prefer_not_say: 'Prefer not to say',
        existing_conditions: 'Existing Health Conditions',
        diabetes: 'Diabetes',
        hypertension: 'Hypertension',
        heart_disease: 'Heart Disease',
        asthma: 'Asthma',
        none: 'None',
        navigation: 'Navigation',
        about: 'About',
        location_weather: 'Location & Weather',
        get_location: 'Get Current Location',
        quick_actions: 'Quick Actions',
        test_voice: 'Test Voice',
        find_emergency: 'Find Emergency',
        please_describe_symptoms: 'Please describe your symptoms or health concern.',
      },
      am: {
        app_title: 'የአርቴፊሻል ኢንተለጀንስ የጤና ረዳት',
        welcome_message: 'ወደ የአርቴፊሻል ኢንተለጀንስ የሚመራው የጤና ረዳትዎ እንኳን በደህና መጡ!',
        health_analysis: 'የጤና ትንተና',
        body_scanner: 'የሰውነት አስከሬን',
        health_facilities: 'የጤና ተቋማት',
        voice_interface: 'የድምፅ በይነገጽ',
        settings: 'ቅንብሮች',
        describe_symptoms: 'የጤና ችግሮችዎን ወይም የጤና ስጋትዎን ይግለጹ:',
        analyze_button: '🔍 የጤና ችግሮችን ትንተና',
        analyzing: 'የጤና ችግሮችን በመተንተን ላይ...',
        analysis_results: 'የትንተና ውጤቶች',
        possible_conditions: 'ሊሆኑ የሚችሉ ሁኔታዎች',
        recommended_actions: 'የሚመከሩ ተግባሮች',
        urgency_level: 'የአስቸኳይነት ደረጃ',
        general_advice: 'አጠቃላይ ምክር',
        disclaimer: 'ይህ ትንተና ለመረጃ ዓላማዎች ብቻ ነው። ትክክለኛ የጤና ምርመራ ለማግኘት እባክዎ የጤና ባለሙያ ያነጋግሩ።',
        upload_image: 'የሰውነት ክፍል ምስል ለአርቴፊሻል ኢንተለጀንስ ትንተና ይጭኑ።',
        select_scan_type: 'የትንተና አይነት ይምረጡ:',
        analyze_image: '🔍 ምስልን ትንተና',
        scan_analysis: 'የትንተና ትንተና',
        ai_enhanced: '🤖 በአርቴፊሻል ኢንተለጀንስ የተሻለ ትንተና ተጠናቋል!',
        ai_insights: '🧠 የአርቴፊሻል ኢንተለጀንስ ግንዛቤዎች',
        ai_observations: 'የአርቴፊሻል ኢንተለጀንስ ምልከቶች',
        ai_concerns: 'የአርቴፊሻል ኢንተለጀንስ ስጋቶች',
        ai_recommendations: 'የአርቴፊሻል ኢንተለጀንስ ምክሮች',
        computer_vision: '📊 የኮምፒዩተር ራይ ትንተና',
        technical_observations: 'የቴክኒክ ምልከቶች',
        language_settings: 'የቋንቋ ቅንብሮች',
        select_language: 'ቋንቋ ይምረጡ:',
        save_settings: '💾 ቅንብሮችን አስቀምጥ',
        settings_saved: 'ቅንብሮች በተሳካ ሁኔታ ተስቀምጠዋል!',
        error: 'ስህተት',
        success: 'ዓወት',
        warning: 'ማስጠንቀቂያ',
        info: 'መረጃ',
        loading: 'በመጫን ላይ...',
        save: 'አስቀምጥ',
        cancel: 'ሰርዝ',
        ok: 'እሺ',
        describe_health_concern: 'የጤና ስጋትዎን ይግለጹ',
        additional_information: 'ተጨማሪ መረጃ',
        age: 'እድሜ',
        gender: 'ጾታ',
        male: 'ወንድ',
        female: 'ሴት',
        other: 'ሌላ',
        prefer_not_say: 'መናገር አልፈልግም',
        existing_conditions: 'ያሉ የጤና ሁኔታዎች',
        diabetes: 'የስኳር በሽታ',
        hypertension: 'የደም ግፊት',
        heart_disease: 'የልብ በሽታ',
        asthma: 'አስም',
        none: 'የለም',
        navigation: 'አሰሳ',
        about: 'ስለ',
        location_weather: 'አካባቢ እና የአየር ሁኔታ',
        get_location: 'አሁኑን አካባቢ ያግኙ',
        quick_actions: 'ፈጣን እርምጃዎች',
        test_voice: 'ድምፅ ሙከራ',
        find_emergency: 'ድንገተኛ አገልግሎት ያግኙ',
        please_describe_symptoms: 'እባክዎ የጤና ችግሮችዎን ወይም የጤና ስጋትዎን ይግለጹ።',
      },
      ti: {
        app_title: 'ዓርተፊሻል ኢንተለጀንስ ሓገዝ ጥዕና',
        welcome_message: 'ናብ ናይ አርተፊሻል ኢንተለጀንስ ዝመርሕ ሓገዝ ጥዕናኹም እንቋዕ ብደሓን መጻእኩም!',
        health_analysis: 'ትንተና ጥዕና',
        body_scanner: 'ስካነር ኣካላት',
        health_facilities: 'ተቋማት ጥዕና',
        voice_interface: 'ኣዘራርባ ድምፂ',
        settings: 'ምርጫታት',
        describe_symptoms: 'ናይ ጥዕና ጸገማትኹም ወይ ናይ ጥዕና ስጋትኹም ግለጹ:',
        analyze_button: '🔍 ናይ ጥዕና ጸገማት ትንተና',
        analyzing: 'ናይ ጥዕና ጸገማት ትንተና...',
        analysis_results: 'ናይ ትንተና ውጽኢታት',
        possible_conditions: 'ክሳድ ዝኾኑ ኩነታት',
        recommended_actions: 'ዝምከሩ ተግባራት',
        urgency_level: 'ደረጃ ሓደጋ',
        general_advice: 'ናይ ሓፈሻ ምክር',
        disclaimer: 'እዚ ትንተና ንመረጃ ዕላማታት ጥራይ እዩ። ትክክለኛ ናይ ጥዕና ምርመራ ንምርካብ እባክኹም ናይ ጥዕና ባለሙያ ምሕታት።',
        upload_image: 'ናይ ኣካላት ክፋል ምስሊ ንአርተፊሻል ኢንተለጀንስ ትንተና ኣምጽኡ።',
        select_scan_type: 'ናይ ትንተና ዓይነት ምረጽ:',
        analyze_image: '🔍 ምስሊ ትንተና',
        scan_analysis: 'ናይ ትንተና ትንተና',
        ai_enhanced: '🤖 ብአርተፊሻል ኢንተለጀንስ ዝተሻለ ትንተና ተወዲኡ!',
        ai_insights: '🧠 ናይ አርተፊሻል ኢንተለጀንስ ርእይቶታት',
        ai_observations: 'ናይ አርተፊሻል ኢንተለጀንስ ምልከታት',
        ai_concerns: 'ናይ አርተፊሻል ኢንተለጀንስ ስጋታት',
        ai_recommendations: 'ናይ አርተፊሻል ኢንተለጀንስ ምክራት',
        computer_vision: '📊 ናይ ኮምፒዩተር ራይ ትንተና',
        technical_observations: 'ናይ ቴክኒክ ምልከታት',
        language_settings: 'ናይ ቋንቋ ምርጫታት',
        select_language: 'ቋንቋ ምረጽ:',
        save_settings: '💾 ምርጫታት ኣስቀምጥ',
        settings_saved: 'ምርጫታት ብዓወት ተሰቒሞም!',
        error: 'ጌጋ',
        success: 'ዓወት',
        warning: 'ማስጠንቀቂያ',
        info: 'መረጃ',
        loading: 'ብምጽዓን...',
        save: 'ኣስቀምጥ',
        cancel: 'ሰርዝ',
        ok: 'እሺ',
        describe_health_concern: 'ናይ ጥዕና ስጋትኹም ግለጹ',
        additional_information: 'ተወሳኺ መረጃ',
        age: 'ዕድመ',
        gender: 'ጾታ',
        male: 'ተባዕታይ',
        female: 'ኣንስተይቲ',
        other: 'ካልእ',
        prefer_not_say: 'ክገልጽ ዘይደልይ',
        existing_conditions: 'ዘሎ ናይ ጥዕና ኩነታት',
        diabetes: 'ሽኮርያ',
        hypertension: 'ልዕሊ ደም',
        heart_disease: 'ናይ ልቢ ሕማም',
        asthma: 'ሳዕሪ',
        none: 'የለን',
        navigation: 'ምንቅስቓስ',
        about: 'ብዛዕባ',
        location_weather: 'ቦታ እና ኩነታት ኣየር',
        get_location: 'ሐዚ ዘሎ ቦታ ርኸብ',
        quick_actions: 'ቅልጡፍ ተግባራት',
        test_voice: 'ድምጺ ፈተነ',
        find_emergency: 'ህጹጽ ኣገልግሎት ርኸብ',
        please_describe_symptoms: 'እባክኹም ናይ ጥዕና ጸገማትኹም ወይ ናይ ጥዕና ስጋትኹም ግለጹ።',
      },
    };
  }

  getText(key: string): string {
    return this.translations[this.currentLanguage]?.[key] || key;
  }

  setLanguage(languageCode: LanguageCode): boolean {
    if (languageCode in this.translations) {
      this.currentLanguage = languageCode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', languageCode);
      }
      return true;
    }
    return false;
  }

  getCurrentLanguage(): LanguageCode {
    return this.currentLanguage;
  }

  getSupportedLanguages(): Record<LanguageCode, string> {
    return {
      en: 'English',
      am: 'አማርኛ',
      ti: 'ትግርኛ',
    };
  }

  getLanguageName(languageCode: LanguageCode): string {
    return this.getSupportedLanguages()[languageCode] || languageCode;
  }

  initialize(): void {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as LanguageCode;
      if (savedLanguage && savedLanguage in this.translations) {
        this.currentLanguage = savedLanguage;
      }
    }
  }
}

export const languageManager = new LanguageManager();
languageManager.initialize();

