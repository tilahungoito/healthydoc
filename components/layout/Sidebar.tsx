'use client';

import { useState } from 'react';
import { languageManager } from '@/lib/language/manager';
import {
  Home,
  Scan,
  Building2,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Brain,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  UserRound,
  History,
  Stethoscope,
  Activity,
} from 'lucide-react';
import ProfileMenu from './ProfileMenu';
import Image from 'next/image';
type Page = 'health' | 'health-history' | 'scanner' | 'facilities' | 'settings' | 'about' | 'malaria-model' | 'pneumonia-model' | 'ai-doctor';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  width: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onTogglePosition: () => void;
  guestMode?: boolean;
}

export default function Sidebar({
  currentPage,
  onPageChange,
  width,
  isCollapsed,
  onToggleCollapse,
  onTogglePosition,
  guestMode = false,
}: SidebarProps) {
  const t = languageManager.getText.bind(languageManager);
  const [isModelsOpen, setIsModelsOpen] = useState(false);

  const models = [
    { id: 'malaria-model' as Page, label: 'Malaria Detection', icon: Brain },
    { id: 'pneumonia-model' as Page, label: 'Pneumonia Detection', icon: Activity },
  ];

  const menuItems = [
    { id: 'health' as Page, label: t('health_analysis'), icon: Home },
    ...(guestMode ? [] : [{ id: 'health-history' as Page, label: 'Health History', icon: History }]),
    { id: 'ai-doctor' as Page, label: 'AI Doctor', icon: Stethoscope },
    { id: 'scanner' as Page, label: t('body_scanner'), icon: Scan },
    { id: 'facilities' as Page, label: t('health_facilities'), icon: Building2 },
    { id: 'settings' as Page, label: t('settings'), icon: Settings },
    { id: 'about' as Page, label: t('about'), icon: Info },
  ];

  if (isCollapsed) {
    return (
      <div className="flex h-full flex-col items-center border-r border-gray-200 bg-white py-4">
        <button
          onClick={onToggleCollapse}
          className="mb-4 rounded-lg p-2 transition-colors hover:bg-gray-100"
          title="Expand sidebar"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
        <div className="mb-4 flex flex-col items-center gap-1">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${
              guestMode ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
            }`}
          >
            <UserRound className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            {guestMode ? 'Guest' : 'Profile'}
          </p>
        </div>
        <button
          onClick={() => setIsModelsOpen(!isModelsOpen)}
          className={`mb-2 rounded-lg p-3 transition-colors ${
            models.some((m) => currentPage === m.id) ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
          }`}
          title="AI Models"
        >
          <Brain className="h-5 w-5" />
        </button>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`mb-2 rounded-lg p-3 transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <aside 
      className="bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-200"
      style={{ width: `${width}px`, minWidth: `${width}px` }}
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <Image src="/image.png" alt="TG" width={50} height={50} />
            {t('app_title')}
          </h1>
          <div className="flex gap-1">
            <button
              onClick={onTogglePosition}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Move sidebar to other side"
            >
              <ArrowLeftRight className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-600">{t('welcome_message')}</p>
        {guestMode && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Guest mode</span>
          </div>
        )}
        <div className="mt-4">
          <ProfileMenu guestMode={guestMode} />
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Models Dropdown Section */}
        <div className="mb-4">
          <button
            onClick={() => setIsModelsOpen(!isModelsOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 mb-2 rounded-lg transition-colors ${
              models.some(m => currentPage === m.id)
                ? 'bg-indigo-50 text-indigo-600 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5" />
              <span className="text-sm font-semibold">AI Models</span>
            </div>
            {isModelsOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {isModelsOpen && (
            <div className="ml-4 space-y-1">
              {models.map((model) => {
                const Icon = model.icon;
                const isActive = currentPage === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => onPageChange(model.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{model.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        {/* Regular Menu Items */}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Version 1.0.0
        </p>
      </div>
    </aside>
  );
}

