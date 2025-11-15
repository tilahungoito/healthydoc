'use client';

import { useState } from 'react';
import { languageManager } from '@/lib/language/manager';
import { BodyScanResult } from '@/types';
import { Upload, AlertCircle } from 'lucide-react';

export default function BodyScannerPage() {
  const t = languageManager.getText.bind(languageManager);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanType, setScanType] = useState('general');
  const [analysis, setAnalysis] = useState<BodyScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanTypes = ['general', 'skin', 'face', 'eye', 'limb'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setAnalysis(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const scanDescription = `Image uploaded for ${scanType} analysis`;

        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scanDescription,
            scanType,
            imageData: base64String,
          }),
        });

        if (!response.ok) {
          throw new Error('Scan analysis failed');
        }

        const data = await response.json();
        setAnalysis(data);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setError(t('error') + ': ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🔍 {t('body_scanner')}
        </h2>

        <p className="text-gray-600 mb-6">{t('upload_image')}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('select_scan_type')}
            </label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {scanTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 inline-block"
              >
                Choose File
              </label>
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">{selectedFile.name}</p>
              )}
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="max-w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedFile}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('analyzing') : t('analyze_image')}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {analysis && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h3 className="text-xl font-bold text-gray-800">
            🔍 {t('scan_analysis')}
          </h3>

          {analysis.enhanced_analysis && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">✅ {t('ai_enhanced')}</p>
            </div>
          )}

          {analysis.ai_insights && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                🧠 {t('ai_insights')}
              </h4>

              {analysis.ai_insights.observations && analysis.ai_insights.observations.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">
                    {t('ai_observations')}
                  </h5>
                  <ul className="space-y-1">
                    {analysis.ai_insights.observations.map((obs, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-600 mt-1">•</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.ai_insights.concerns && analysis.ai_insights.concerns.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">
                    {t('ai_concerns')}
                  </h5>
                  <ul className="space-y-1">
                    {analysis.ai_insights.concerns.map((concern, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600 mt-1" />
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.ai_insights.recommendations && analysis.ai_insights.recommendations.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">
                    {t('ai_recommendations')}
                  </h5>
                  <ul className="space-y-1">
                    {analysis.ai_insights.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {analysis.disclaimer && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">⚠️ {analysis.disclaimer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

