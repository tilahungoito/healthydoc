'use client';

import { useState } from 'react';
import { languageManager } from '@/lib/language/manager';
import { HealthAnalysis, UserProfile } from '@/types';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import VoiceInput from '@/components/voice/VoiceInput';

export default function HealthAnalysisPage()
{
  const t = languageManager.getText.bind(languageManager);
  const [userInput, setUserInput] = useState('');
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState('Prefer not to say');
  const [conditions, setConditions] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<HealthAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () =>
  {
    if (!userInput.trim())
    {
      setError(t('please_describe_symptoms'));
      return;
    }

    setLoading(true);
    setError(null);

    try
    {
      const additionalContext: UserProfile = {
        age,
        gender,
        conditions,
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          additionalContext,
          language: languageManager.getCurrentLanguage(),
        }),
      });

      if (!response.ok)
      {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err)
    {
      setError(t('error') + ': ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally
    {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) =>
  {
    switch (urgency)
    {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) =>
  {
    switch (urgency)
    {
      case 'high':
        return <AlertCircle className="w-5 h-5" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5" />;
      case 'low':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const availableConditions = [
    { value: 'diabetes', label: t('diabetes') },
    { value: 'hypertension', label: t('hypertension') },
    { value: 'heart_disease', label: t('heart_disease') },
    { value: 'asthma', label: t('asthma') },
    { value: 'arthritis', label: 'Arthritis' },
    { value: 'copd', label: 'COPD' },
    { value: 'kidney_disease', label: 'Kidney Disease' },
    { value: 'liver_disease', label: 'Liver Disease' },
  ];

  const handleAddCondition = (condition: string) =>
  {
    if (condition && !conditions.includes(condition))
    {
      setConditions([...conditions, condition]);
    }
  };

  const handleRemoveCondition = (conditionToRemove: string) =>
  {
    setConditions(conditions.filter(c => c !== conditionToRemove));
  };

  return (
    <div className="h-full p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🤖 {t('health_analysis')}
        </h1>

        <div className="space-y-6">
          {/* Symptoms Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('describe_symptoms')}
              </label>
              <VoiceInput
                onTranscript={(text) =>
                {
                  setUserInput((prev) => prev ? `${prev} ${text}` : text);
                  setError(null);
                }}
                disabled={loading}
                className="ml-2"
              />
            </div>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Example: I have been experiencing headaches and fatigue for the past few days... (or use voice input)"
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white"
            />
            <p className="mt-1 text-xs text-gray-900">
              💡 {t('voice_input_hint') || 'Click the microphone icon to describe your symptoms using voice'}
            </p>
          </div>

          {/* Patient Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {t('age')}
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                min={1}
                max={120}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('gender')}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option>{t('male')}</option>
                <option>{t('female')}</option>
                <option>{t('other')}</option>
                <option>{t('prefer_not_say')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {t('existing_conditions')}
              </label>
              <select
                value=""
                onChange={(e) =>
                {
                  if (e.target.value)
                  {
                    handleAddCondition(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select a condition...</option>
                {availableConditions.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>

              {/* Dismissible Tags */}
              {conditions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {conditions.map((condition) =>
                  {
                    const condLabel = availableConditions.find(c => c.value === condition)?.label || condition;
                    return (
                      <span
                        key={condition}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                      >
                        {condLabel}
                        <button
                          onClick={() => handleRemoveCondition(condition)}
                          className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                          aria-label={`Remove ${condLabel}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analyze Button */}
        <div className="mt-6">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? t('analyzing') : t('analyze_button')}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {analysis && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🔍 {t('analysis_results')}
            </h2>

            <div
              className={`p-4 rounded-lg border-2 flex items-center gap-3 ${getUrgencyColor(
                analysis.urgency_level
              )}`}
            >
              {getUrgencyIcon(analysis.urgency_level)}
              <div>
                <p className="font-medium">{t('urgency_level')}</p>
                <p className="text-lg font-bold uppercase">
                  {analysis.urgency_level}
                </p>
              </div>
            </div>

            {analysis.possible_conditions && analysis.possible_conditions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  {t('possible_conditions')}
                </h4>
                <ul className="space-y-2">
                  {analysis.possible_conditions.slice(0, 5).map((condition, idx) => (
                    <li
                      key={idx}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      {typeof condition === 'object' ? (
                        <div>
                          <span className="font-medium text-gray-900">{condition.name}</span>
                          {condition.confidence && (
                            <span className="ml-2 text-sm text-gray-600">
                              (Confidence: {(condition.confidence * 100).toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-900">{condition}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.recommended_actions && analysis.recommended_actions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  {t('recommended_actions')}
                </h4>
                <ul className="space-y-2">
                  {analysis.recommended_actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.general_advice && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  {t('general_advice')}
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {analysis.general_advice}
                </p>
              </div>
            )}

            {analysis.medical_context && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  Medical Context
                </h4>
                <p className="text-gray-900 leading-relaxed">
                  {analysis.medical_context}
                </p>
              </div>
            )}

            {analysis.home_care && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  Home Care Recommendations
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {analysis.home_care}
                </p>
              </div>
            )}

            {analysis.when_to_seek_care && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  When to Seek Medical Care
                </h4>
                <p className="text-yellow-700 leading-relaxed">
                  {analysis.when_to_seek_care}
                </p>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ⚠️ {analysis.disclaimer || t('disclaimer')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

