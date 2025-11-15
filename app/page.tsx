'use client';

import { useState, useEffect } from 'react';
import { languageManager } from '@/lib/language/manager';
import HealthAnalysisPage from '@/components/pages/HealthAnalysisPage';
import BodyScannerPage from '@/components/pages/BodyScannerPage';
import FacilitiesPage from '@/components/pages/FacilitiesPage';
import SettingsPage from '@/components/pages/SettingsPage';
import AboutPage from '@/components/pages/AboutPage';
import Sidebar from '@/components/layout/Sidebar';

type Page = 'health' | 'scanner' | 'facilities' | 'settings' | 'about';
type SidebarPosition = 'left' | 'right';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>('health');
  const [sidebarPosition, setSidebarPosition] = useState<SidebarPosition>('left');
  const [sidebarWidth, setSidebarWidth] = useState(256); // 64 * 4 = 256px (w-64)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Load sidebar preferences from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('sidebarPosition') as SidebarPosition;
    const savedWidth = localStorage.getItem('sidebarWidth');
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    
    if (savedPosition) setSidebarPosition(savedPosition);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth));
    if (savedCollapsed === 'true') setIsSidebarCollapsed(true);
  }, []);

  // Save sidebar preferences
  useEffect(() => {
    localStorage.setItem('sidebarPosition', sidebarPosition);
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());
  }, [sidebarPosition, sidebarWidth, isSidebarCollapsed]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const minWidth = 200;
      const maxWidth = 500;
      
      if (sidebarPosition === 'left') {
        const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
        setSidebarWidth(newWidth);
      } else {
        const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, minWidth), maxWidth);
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarPosition]);

  const toggleSidebarPosition = () => {
    setSidebarPosition(sidebarPosition === 'left' ? 'right' : 'left');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'health':
        return <HealthAnalysisPage />;
      case 'scanner':
        return <BodyScannerPage />;
      case 'facilities':
        return <FacilitiesPage />;
      case 'settings':
        return <SettingsPage />;
      case 'about':
        return <AboutPage />;
      default:
        return <HealthAnalysisPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar on Left */}
        {sidebarPosition === 'left' && (
          <>
            <Sidebar
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              width={isSidebarCollapsed ? 0 : sidebarWidth}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onTogglePosition={toggleSidebarPosition}
            />
            {!isSidebarCollapsed && (
              <div
                className="w-1 bg-gray-300 hover:bg-indigo-500 cursor-col-resize transition-colors relative z-10"
                onMouseDown={handleMouseDown}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-8 bg-gray-400 rounded"></div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="h-full">{renderPage()}</div>
        </main>

        {/* Sidebar on Right */}
        {sidebarPosition === 'right' && (
          <>
            {!isSidebarCollapsed && (
              <div
                className="w-1 bg-gray-300 hover:bg-indigo-500 cursor-col-resize transition-colors relative z-10"
                onMouseDown={handleMouseDown}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-8 bg-gray-400 rounded"></div>
                </div>
              </div>
            )}
            <Sidebar
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              width={isSidebarCollapsed ? 0 : sidebarWidth}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onTogglePosition={toggleSidebarPosition}
            />
          </>
        )}
      </div>
    </div>
  );
}

