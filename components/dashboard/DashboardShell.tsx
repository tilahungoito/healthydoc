'use client';

import { useEffect, useState } from 'react';
import HealthAnalysisPage from '@/components/pages/HealthAnalysisPage';
import HealthHistoryPage from '@/components/pages/HealthHistoryPage';
import BodyScannerPage from '@/components/pages/BodyScannerPage';
import FacilitiesPage from '@/components/pages/FacilitiesPage';
import SettingsPage from '@/components/pages/SettingsPage';
import AboutPage from '@/components/pages/AboutPage';
import MalariaModelPage from '@/components/pages/MalariaModelPage';
import PneumoniaModelPage from '@/components/pages/PneumoniaModelPage';
import AIDoctorPage from '@/components/pages/AIDoctorPage';
import Sidebar from '@/components/layout/Sidebar';

type Page = 'health' | 'health-history' | 'scanner' | 'facilities' | 'settings' | 'about' | 'malaria-model' | 'pneumonia-model' | 'ai-doctor';
type SidebarPosition = 'left' | 'right';

interface DashboardShellProps {
  guestMode?: boolean;
}

export default function DashboardShell({ guestMode }: DashboardShellProps) {
  const [currentPage, setCurrentPage] = useState<Page>('health');
  const [sidebarPosition, setSidebarPosition] = useState<SidebarPosition>('left');
  const [sidebarWidth, setSidebarWidth] = useState(256); // 64 * 4 = 256px (w-64)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const savedPosition = localStorage.getItem('sidebarPosition') as SidebarPosition;
    const savedWidth = localStorage.getItem('sidebarWidth');
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    
    if (savedPosition) setSidebarPosition(savedPosition);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth));
    if (savedCollapsed === 'true') setIsSidebarCollapsed(true);
  }, []);

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
      case 'health-history':
        return <HealthHistoryPage />;
      case 'ai-doctor':
        return <AIDoctorPage />;
      case 'scanner':
        return <BodyScannerPage />;
      case 'facilities':
        return <FacilitiesPage />;
      case 'settings':
        return <SettingsPage />;
      case 'about':
        return <AboutPage />;
      case 'malaria-model':
        return <MalariaModelPage />;
      case 'pneumonia-model':
        return <PneumoniaModelPage />;
      default:
        return <HealthAnalysisPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {sidebarPosition === 'left' && (
          <>
            <Sidebar
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              width={isSidebarCollapsed ? 0 : sidebarWidth}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onTogglePosition={toggleSidebarPosition}
              guestMode={guestMode}
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

        <main className="flex-1 overflow-y-auto bg-gray-50">
          {guestMode && (
            <div className="mx-auto max-w-5xl px-6 pt-6">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 text-amber-900 shadow-sm">
                <p className="text-sm font-semibold">You are exploring in guest mode.</p>
                <p className="text-sm mt-1">
                  Real-time analysis still works, but we will not store any history, personalized settings,
                  or longitudinal recommendations until you create an account.
                </p>
              </div>
            </div>
          )}
          <div className="h-full">{renderPage()}</div>
        </main>

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
              guestMode={guestMode}
            />
          </>
        )}
      </div>
    </div>
  );
}


