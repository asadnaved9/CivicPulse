import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MPSessionProvider } from './contexts/MPSessionContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import { CardSkeleton } from './components/Skeleton';
import { OnboardingModal } from './components/OnboardingModal';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

// Lazy loading Citizen Pages
const HomePage = React.lazy(() => import('./pages/HomePage'));
const MapPage = React.lazy(() => import('./pages/MapPage'));
const ReportPage = React.lazy(() => import('./pages/ReportPage'));
const DevelopmentPage = React.lazy(() => import('./pages/DevelopmentPage'));
const IssueDetailPage = React.lazy(() => import('./pages/IssueDetailPage'));
const RecommendationsPage = React.lazy(() => import('./pages/RecommendationsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ProposalDetailPage = React.lazy(() => import('./pages/ProposalDetailPage'));
const CommunityPage = React.lazy(() => import('./pages/CommunityPage'));

// Lazy loading Unified Admin Portal Pages
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const AdminLoginPage = React.lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminComplaintsPage = React.lazy(() => import('./pages/admin/AdminComplaintsPage'));
const AdminAssetsPage = React.lazy(() => import('./pages/admin/AdminAssetsPage'));
const AdminMapPage = React.lazy(() => import('./pages/admin/AdminMapPage'));
const AdminRecommendationsPage = React.lazy(() => import('./pages/admin/AdminRecommendationsPage'));
const AdminDevelopmentPage = React.lazy(() => import('./pages/admin/AdminDevelopmentPage'));
const AdminProposalDetailPage = React.lazy(() => import('./pages/admin/AdminProposalDetailPage'));
const AdminDepartmentsPage = React.lazy(() => import('./pages/admin/AdminDepartmentsPage'));
const AdminDependenciesPage = React.lazy(() => import('./pages/admin/AdminDependenciesPage'));
const AdminWorkersPage = React.lazy(() => import('./pages/admin/AdminWorkersPage'));
const AdminAssignmentsPage = React.lazy(() => import('./pages/admin/AdminAssignmentsPage'));
const AdminInspectorPage = React.lazy(() => import('./pages/admin/AdminInspectorPage'));
const AdminAnalyticsPage = React.lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminNotificationsPage = React.lazy(() => import('./pages/admin/AdminNotificationsPage'));
const AdminSettingsPage = React.lazy(() => import('./pages/admin/AdminSettingsPage'));

// Generic suspense loading wrapper
const PageLoader: React.FC = () => (
  <div 
    style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '24px', 
      maxWidth: '1200px', 
      margin: '40px auto', 
      padding: '0 24px' 
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="shimmer" style={{ width: '200px', height: '32px' }} />
      <div className="shimmer" style={{ width: '400px', height: '16px' }} />
    </div>
    <div className="grid-cols-2">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

function AppContent() {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';
  const isAdminZone = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';
  const { t } = useLanguage();

  // Backward compatibility: seamlessly redirect legacy /mp/* links to /admin/*
  if (location.pathname.startsWith('/mp')) {
    const newPath = location.pathname.replace('/mp', '/admin');
    return <Navigate to={newPath} replace />;
  }

  // Unified Admin Portal Shell
  if (isAdminZone) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
            <Route path="/admin/assets" element={<AdminAssetsPage />} />
            <Route path="/admin/map" element={<AdminMapPage />} />
            <Route path="/admin/recommendations" element={<AdminRecommendationsPage />} />
            <Route path="/admin/development" element={<AdminDevelopmentPage />} />
            <Route path="/admin/proposals/:id" element={<AdminProposalDetailPage />} />
            <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
            <Route path="/admin/dependencies" element={<AdminDependenciesPage />} />
            <Route path="/admin/workers" element={<AdminWorkersPage />} />
            <Route path="/admin/assignments" element={<AdminAssignmentsPage />} />
            <Route path="/admin/inspector" element={<AdminInspectorPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

  // Citizen Portal + /admin/login gateway (renders standard layout with Navbar)
  return (
    <div className="app-container">
      <Navbar />
      <OnboardingModal />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Citizen Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/development" element={<DevelopmentPage />} />
            <Route path="/issue/:id" element={<IssueDetailPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/proposal/:id" element={<ProposalDetailPage />} />
            <Route path="/community" element={<CommunityPage />} />

            {/* Admin Login Gateway */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Responsive footer - Hidden on Map Page and Admin Login */}
      {!isMapPage && location.pathname !== '/admin/login' && (
        <footer className="app-footer" style={{ justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5px', alignItems: 'center', textAlign: 'center' }}>
            <span className="text-mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '0.05em' }}>
              CIVICPULSE
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              © {new Date().getFullYear()} {t('footerText')}
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <MPSessionProvider>
            <BrowserRouter>
              <AppContent />
              <Toaster 
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: 'var(--surface-2)',
                    color: 'var(--text-1)',
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    borderRadius: '6px'
                  },
                  success: {
                    iconTheme: {
                      primary: 'var(--success)',
                      secondary: '#FFFFFF'
                    }
                  },
                  error: {
                    iconTheme: {
                      primary: 'var(--danger)',
                      secondary: '#FFFFFF'
                    }
                  }
                }}
              />
            </BrowserRouter>
          </MPSessionProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
