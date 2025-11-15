'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { SpeechRecognitionService, getSpeechLanguageCode } from '@/lib/voice/speech-recognition';
import { Config } from '@/config';
import { languageManager } from '@/lib/language/manager';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceInput({ onTranscript, disabled = false, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const speechServiceRef = useRef<SpeechRecognitionService | null>(null);
  const t = languageManager.getText.bind(languageManager);

  useEffect(() => {
    // Initialize speech recognition service (always try, even if not explicitly enabled)
    const service = new SpeechRecognitionService();
    speechServiceRef.current = service;

    // Check if supported
    const supported = service.isSpeechRecognitionSupported();
    setIsSupported(supported);

    if (!supported) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    // Get current language
    const currentLang = languageManager.getCurrentLanguage();
    const speechLang = getSpeechLanguageCode(currentLang);
    service.setLanguage(speechLang);

    // Set up callbacks
    service.onResult((text) => {
      if (text && text.trim()) {
        onTranscript(text);
      }
      setIsListening(false);
      setError(null);
    });

    service.onError((err) => {
      console.error('Speech recognition error:', err);
      // Handle specific errors
      if (err.message.includes('not-allowed')) {
        setError('Microphone permission denied. Please allow microphone access.');
      } else if (err.message.includes('no-speech')) {
        setError('No speech detected. Please try again.');
      } else if (err.message.includes('aborted')) {
        // User stopped, don't show error
        setError(null);
      } else {
        setError(err.message);
      }
      setIsListening(false);
    });

    service.onStart(() => {
      setIsListening(true);
      setError(null);
    });

    service.onEnd(() => {
      setIsListening(false);
    });

    // Cleanup
    return () => {
      service.destroy();
    };
  }, [onTranscript]);

  // Update language when it changes
  useEffect(() => {
    if (speechServiceRef.current) {
      const currentLang = languageManager.getCurrentLanguage();
      const speechLang = getSpeechLanguageCode(currentLang);
      speechServiceRef.current.setLanguage(speechLang);
    }
  }, [languageManager.getCurrentLanguage()]);

  const handleToggleListening = async () => {
    if (!speechServiceRef.current || disabled) return;

    try {
      if (isListening) {
        speechServiceRef.current.stop();
      } else {
        // Request microphone permission first
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permError) {
          setError('Microphone access is required for voice input. Please allow microphone access in your browser settings.');
          return;
        }
        
        speechServiceRef.current.start();
      }
    } catch (err) {
      console.error('Error toggling voice input:', err);
      setError(err instanceof Error ? err.message : 'Failed to start voice input. Please check your microphone permissions.');
    }
  };

  // Show button if supported (even if not explicitly enabled in config)
  // This allows users to try voice input if their browser supports it
  if (!isSupported) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleToggleListening}
        disabled={disabled}
        className={`
          flex items-center justify-center
          w-12 h-12 rounded-full
          transition-all duration-200
          ${isListening
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          shadow-lg hover:shadow-xl
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        `}
        title={isListening ? t('stop_listening') || 'Stop listening' : t('start_listening') || 'Start voice input'}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {isListening && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{t('listening') || 'Listening...'}</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

