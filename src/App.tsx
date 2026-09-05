import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MPSessionProvider } from './contexts/MPSessionContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { MPLayout } from './components/MPLayout';
import { Toaster } from 'react-hot-toast';
import { CardSkeleton } from './components/Skeleton';
import { OnboardingModal } from './components/OnboardingModal';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

// Lazy loading all pages for optimal bundle splitting and performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const MapPage = React.lazy(() => import('./pages/MapPage'));
const ReportPage = React.lazy(() => import('./pages/ReportPage'));
const DevelopmentPage = React.lazy(() => import('./pages/DevelopmentPage'));
const IssueDetailPage = React.lazy(() => import('./pages/IssueDetailPage'));
const RecommendationsPage = React.lazy(() => import('./pages/RecommendationsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ProposalDetailPage = React.lazy(() => import('./pages/ProposalDetailPage'));
const USSDSimulatorPage = React.lazy(() => import('./pages/USSDSimulatorPage'));

// MP Dedicated Pages
const MPLoginPage = React.lazy(() => import('./pages/mp/MPLoginPage'));
const MPDashboardPage = React.lazy(() => import('./pages/mp/MPDashboardPage'));
const MPRecommendationsPage = React.lazy(() => import('./pages/mp/MPRecommendationsPage'));
const MPDevelopmentPage = React.lazy(() => import('./pages/mp/MPDevelopmentPage'));
const MPProposalDetailPage = React.lazy(() => import('./pages/mp/MPProposalDetailPage'));
const MPSettingsPage = React.lazy(() => import('./pages/mp/MPSettingsPage'));

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
  const isMPZone = location.pathname.startsWith('/mp') && location.pathname !== '/mp/login';
  const { t } = useLanguage();

  // If inside the protected MP zone (e.g. /mp/dashboard, /mp/recommendations, /mp/proposals/:id)
  if (isMPZone) {
    return (
      <MPLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/mp/dashboard" element={<MPDashboardPage />} />
            <Route path="/mp/development" element={<MPDevelopmentPage />} />
            <Route path="/mp/recommendations" element={<MPRecommendationsPage />} />
            <Route path="/mp/proposals/:id" element={<MPProposalDetailPage />} />
            <Route path="/mp/settings" element={<MPSettingsPage />} />
          </Routes>
        </Suspense>
      </MPLayout>
    );
  }

  // Citizen view + /mp/login (renders standard layout with Navbar)
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
            <Route path="/ussd-demo" element={<USSDSimulatorPage />} />

            {/* MP Login Gate */}
            <Route path="/mp/login" element={<MPLoginPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Swiss minimalist design responsive footer - Hidden on Map Page and MP Login */}
      {!isMapPage && location.pathname !== '/mp/login' && (
        <footer className="app-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5px' }}>
            <span className="text-mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '0.05em' }}>
              CIVICPULSE
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              © {new Date().getFullYear()} {t('footerText')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/" className="text-muted" style={{ textDecoration: 'none' }}>{t('overview')}</Link>
            <Link to="/development" className="text-muted" style={{ textDecoration: 'none' }}>{t('development')}</Link>
            <Link to="/map" className="text-muted" style={{ textDecoration: 'none' }}>{t('map')}</Link>
            <Link to="/recommendations" className="text-muted" style={{ textDecoration: 'none' }}>{t('aiPlanning')}</Link>
            <Link to="/report" className="text-muted" style={{ textDecoration: 'none' }}>{t('suggest')}</Link>
            <Link to="/settings" className="text-muted" style={{ textDecoration: 'none' }}>{t('settings')}</Link>
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
