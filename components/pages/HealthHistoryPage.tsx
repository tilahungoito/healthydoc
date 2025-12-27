'use client';

import { useState, useEffect } from 'react';
import { languageManager } from '@/lib/language/manager';
import {
  History,
  TrendingUp,
  Calendar,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileText,
  Sparkles,
  Search,
  Filter,
  X,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';

interface HealthRecord {
  id: string;
  symptoms: string;
  userInput: string;
  createdAt: string;
  aiResult: any;
}

interface Pattern {
  type: string;
  description: string;
  examples: string[];
}

interface Timeline {
  period: string;
  events: string;
  symptoms: string[];
}

interface Insight {
  title: string;
  description: string;
  evidence: string;
}

interface Recommendation {
  category: string;
  priority: string;
  recommendation: string;
  reasoning: string;
}

interface Analysis {
  summary: string;
  patterns: Pattern[];
  timeline: Timeline[];
  insights: Insight[];
  recommendations: Recommendation[];
}

interface HealthHistoryData {
  records: HealthRecord[];
  analysis: Analysis;
  stats: {
    totalRecords: number;
    oldestRecord: string;
    newestRecord: string;
  };
}

export default function HealthHistoryPage() {
  const t = languageManager.getText.bind(languageManager);
  const [data, setData] = useState<HealthHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);

  const fetchHealthHistory = async () => {
    try {
      setError(null);
      // Build query string with filters
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString();
      const url = `/api/health-history${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view your health history.');
        }
        throw new Error('Failed to load health history');
      }

      const healthData = await response.json();
      setData(healthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthHistory();
  }, []);

  const handleApplyFilters = () => {
    setLoading(true);
    fetchHealthHistory();
  };

  const handleClearFilters = () => {
    setKeyword('');
    setStartDate('');
    setEndDate('');
    setLoading(true);
    fetchHealthHistory();
  };

  const hasActiveFilters = keyword || startDate || endDate;

  const handleRefresh = () => {
    setRefreshing(true);
    setSelectedRecords(new Set());
    fetchHealthHistory();
  };

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(records.map((r) => r.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRecords.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedRecords.size} record(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/health-history/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordIds: Array.from(selectedRecords),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete records');
      }

      // Clear selection and refresh data
      setSelectedRecords(new Set());
      await fetchHealthHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete records');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingle = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/health-history/${recordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      // Remove from selection if selected and refresh data
      setSelectedRecords((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
      await fetchHealthHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-orange-500 bg-orange-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'monitoring':
        return <Clock className="w-4 h-4" />;
      case 'prevention':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'lifestyle':
        return <TrendingUp className="w-4 h-4" />;
      case 'medical_attention':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your health history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Error Loading History</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.records.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="text-center py-16">
          <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Health History Yet</h2>
          <p className="text-gray-600 mb-6">
            Start tracking your health by analyzing your symptoms. Your health history will appear here.
          </p>
        </div>
      </div>
    );
  }

  const { records, analysis, stats } = data;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <History className="w-8 h-8 text-indigo-600" />
            Health History Analysis
          </h1>
          <p className="text-gray-600 mt-1">
            {stats.totalRecords} record{stats.totalRecords !== 1 ? 's' : ''} analyzed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-indigo-600 text-white rounded-full">
                {[keyword, startDate, endDate].filter(Boolean).length}
              </span>
            )}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              Filter Records
            </h3>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Keyword Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Keyword
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search symptoms or notes..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyFilters();
                    }
                  }}
                />
              </div>
            </div>
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleApplyFilters}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6 mb-6">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Analysis Summary</h2>
            <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {analysis.timeline && analysis.timeline.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Timeline
          </h2>
          <div className="space-y-4">
            {analysis.timeline.map((timeline, index) => (
              <div
                key={index}
                className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{timeline.period}</p>
                  <p className="text-gray-600 text-sm mt-1">{timeline.events}</p>
                  {timeline.symptoms && timeline.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {timeline.symptoms.map((symptom, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patterns */}
      {analysis.patterns && analysis.patterns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Patterns Detected
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {analysis.patterns.map((pattern, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <p className="font-medium text-gray-900 mb-2">{pattern.description}</p>
                {pattern.examples && pattern.examples.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pattern.examples.map((example, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-md bg-white text-gray-700 text-xs border border-gray-200"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {analysis.insights && analysis.insights.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-indigo-600" />
            Insights
          </h2>
          <div className="space-y-4">
            {analysis.insights.map((insight, index) => (
              <div
                key={index}
                className="rounded-lg border-l-4 border-indigo-500 bg-indigo-50 p-4"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
                <p className="text-gray-700 text-sm mb-2">{insight.description}</p>
                {insight.evidence && (
                  <p className="text-xs text-gray-600 italic">Evidence: {insight.evidence}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Recommendations
          </h2>
          <div className="space-y-3">
            {analysis.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`rounded-lg border-l-4 p-4 ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getCategoryIcon(rec.category)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {rec.category}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-white/50">
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 mb-1">{rec.recommendation}</p>
                    <p className="text-sm text-gray-700">{rec.reasoning}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Records with Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Health Records</h2>
          <div className="flex items-center gap-2">
            {selectedRecords.size > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedRecords.size} selected
                </span>
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete Selected'}
                </button>
              </>
            )}
            {records.length > 5 && (
              <button
                onClick={() => setShowAllRecords(!showAllRecords)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {showAllRecords ? 'Show Less' : `Show All (${records.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Select All Checkbox */}
        {records.length > 0 && (
          <div className="mb-3 pb-3 border-b border-gray-200">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              {selectedRecords.size === records.length ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              <span>Select All</span>
            </button>
          </div>
        )}

        <div className="space-y-3">
          {(showAllRecords ? records : records.slice(0, 5)).map((record) => (
            <div
              key={record.id}
              className={`rounded-lg border p-4 transition-colors ${
                selectedRecords.has(record.id)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleSelectRecord(record.id)}
                  className="mt-1 flex-shrink-0"
                >
                  {selectedRecords.has(record.id) ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">
                        {new Date(record.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="font-medium text-gray-900 mb-1">{record.symptoms}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{record.userInput}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteSingle(record.id)}
                      disabled={isDeleting}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Delete this record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!showAllRecords && records.length > 5 && (
            <p className="text-sm text-gray-500 text-center pt-2">
              Showing 5 of {records.length} records
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

