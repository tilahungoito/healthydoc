'use client';

import { useState, useEffect } from 'react';
import { languageManager } from '@/lib/language/manager';
import { LanguageCode } from '@/types';

export default function SettingsPage() {
  const t = languageManager.getText.bind(languageManager);
  const [currentLang, setCurrentLang] = useState<LanguageCode>(
    languageManager.getCurrentLanguage()
  );
  const [saved, setSaved] = useState(false);

  const supportedLangs = languageManager.getSupportedLanguages();

  const handleLanguageChange = (langCode: LanguageCode) => {
    setCurrentLang(langCode);
  };

  const handleSave = () => {
    languageManager.setLanguage(currentLang);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          ⚙️ {t('settings')}
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              {t('language_settings')}
            </h3>
            <div className="space-y-3">
              {Object.entries(supportedLangs).map(([code, name]) => (
                <label
                  key={code}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="language"
                    value={code}
                    checked={currentLang === code}
                    onChange={() => handleLanguageChange(code as LanguageCode)}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-gray-700">{name}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            {t('save_settings')}
          </button>

          {saved && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              ✅ {t('settings_saved')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

