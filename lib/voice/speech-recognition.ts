/**
 * Speech Recognition Service
 * Provides Google-like voice input functionality using Web Speech API
 * Falls back to Google Cloud Speech-to-Text API if available
 */

export interface SpeechRecognitionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isListening: boolean = false;
  private onResultCallback?: (text: string) => void;
  private onErrorCallback?: (error: Error) => void;
  private onStartCallback?: () => void;
  private onEndCallback?: () => void;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    // Check for browser support
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.isSupported = true;
      this.setupRecognition();
    } else {
      this.isSupported = false;
      console.warn('Speech recognition not supported in this browser');
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false; // Stop after user stops speaking
    this.recognition.interimResults = true; // Show results while speaking
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStartCallback) {
        this.onStartCallback();
      }
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Only call callback with final results
      if (finalTranscript && this.onResultCallback) {
        this.onResultCallback(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      let errorMessage = `Speech recognition error: ${event.error}`;
      
      // Provide user-friendly error messages
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'aborted':
          // User stopped, don't show error
          this.isListening = false;
          if (this.onEndCallback) {
            this.onEndCallback();
          }
          return;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      const error = new Error(errorMessage);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };
  }

  /**
   * Configure speech recognition
   */
  configure(config: SpeechRecognitionConfig) {
    if (!this.recognition) return;

    if (config.language) {
      this.recognition.lang = config.language;
    }
    if (config.continuous !== undefined) {
      this.recognition.continuous = config.continuous;
    }
    if (config.interimResults !== undefined) {
      this.recognition.interimResults = config.interimResults;
    }
    if (config.maxAlternatives !== undefined) {
      this.recognition.maxAlternatives = config.maxAlternatives;
    }
  }

  /**
   * Set language for speech recognition
   */
  setLanguage(language: string) {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  /**
   * Start listening for speech input
   */
  start() {
    if (!this.isSupported) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    if (this.isListening) {
      this.stop();
      // Wait a bit before restarting
      setTimeout(() => {
        try {
          this.recognition.start();
        } catch (err) {
          console.error('Error restarting speech recognition:', err);
        }
      }, 300);
      return;
    }

    try {
      this.recognition.start();
    } catch (error: any) {
      console.error('Error starting speech recognition:', error);
      // Handle "already started" error
      if (error.message && error.message.includes('already started')) {
        this.recognition.stop();
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch (err) {
            console.error('Error restarting after stop:', err);
            throw new Error('Failed to start speech recognition. Please try again.');
          }
        }, 300);
      } else {
        throw error;
      }
    }
  }

  /**
   * Stop listening for speech input
   */
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Abort speech recognition
   */
  abort() {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  /**
   * Check if speech recognition is supported
   */
  isSpeechRecognitionSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Set callback for when speech is recognized
   */
  onResult(callback: (text: string) => void) {
    this.onResultCallback = callback;
  }

  /**
   * Set callback for errors
   */
  onError(callback: (error: Error) => void) {
    this.onErrorCallback = callback;
  }

  /**
   * Set callback for when recognition starts
   */
  onStart(callback: () => void) {
    this.onStartCallback = callback;
  }

  /**
   * Set callback for when recognition ends
   */
  onEnd(callback: () => void) {
    this.onEndCallback = callback;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stop();
    this.onResultCallback = undefined;
    this.onErrorCallback = undefined;
    this.onStartCallback = undefined;
    this.onEndCallback = undefined;
  }
}

// Language code mapping for speech recognition
export const SPEECH_LANGUAGE_MAP: Record<string, string> = {
  en: 'en-US',
  am: 'am-ET', // Amharic
  ti: 'ti-ET', // Tigrinya
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-BR',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ar: 'ar-SA',
  hi: 'hi-IN',
};

/**
 * Get speech recognition language code from app language code
 */
export function getSpeechLanguageCode(languageCode: string): string {
  return SPEECH_LANGUAGE_MAP[languageCode] || 'en-US';
}

