'use client';

import { languageManager } from '@/lib/language/manager';

export default function AboutPage() {
  const t = languageManager.getText.bind(languageManager);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          ℹ️ {t('about')}
        </h2>

        <div className="space-y-6 text-gray-700">
          <div>
            <h3 className="text-lg font-semibold mb-3">Features</h3>
            <ul className="space-y-2 list-disc list-inside">
              <li>🤖 AI-powered health analysis using Groq AI</li>
              <li>📍 Location and weather data integration</li>
              <li>🔍 Body scanning and analysis</li>
              <li>🏥 Nearby health facility finder</li>
              <li>🗣️ Voice interface (speech-to-text & text-to-speech)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Disclaimer</h3>
            <p className="text-sm leading-relaxed">
              This application is for educational and informational purposes only.
              It should not replace professional medical advice, diagnosis, or treatment.
              Always consult with qualified healthcare professionals for medical concerns.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Version:</strong> 1.0.0
            </p>
            <p className="text-sm text-gray-600">
              <strong>Last Updated:</strong>{' '}
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

