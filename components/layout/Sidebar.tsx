'use client';

import { languageManager } from '@/lib/language/manager';
import { Home, Scan, Building2, Settings, Info, ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';

type Page = 'health' | 'scanner' | 'facilities' | 'settings' | 'about';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  width: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onTogglePosition: () => void;
}

export default function Sidebar({ 
  currentPage, 
  onPageChange, 
  width, 
  isCollapsed, 
  onToggleCollapse,
  onTogglePosition 
}: SidebarProps) {
  const t = languageManager.getText.bind(languageManager);

  const menuItems = [
    { id: 'health' as Page, label: t('health_analysis'), icon: Home },
    { id: 'scanner' as Page, label: t('body_scanner'), icon: Scan },
    { id: 'facilities' as Page, label: t('health_facilities'), icon: Building2 },
    { id: 'settings' as Page, label: t('settings'), icon: Settings },
    { id: 'about' as Page, label: t('about'), icon: Info },
  ];

  if (isCollapsed) {
    return (
      <div className="bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors mb-4"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`p-3 mb-2 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
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
            <span>🎯</span>
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
      </div>

      <nav className="flex-1 px-4 py-4 overflow-y-auto">
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

