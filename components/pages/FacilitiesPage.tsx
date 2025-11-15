'use client';

import { languageManager } from '@/lib/language/manager';

export default function FacilitiesPage() {
  const t = languageManager.getText.bind(languageManager);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🏥 {t('health_facilities')}
        </h2>
        <p className="text-gray-600">
          Health facility finder feature will be implemented here.
        </p>
      </div>
    </div>
  );
}

