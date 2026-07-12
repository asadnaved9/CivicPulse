import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import { CardSkeleton } from './components/Skeleton';
import { OnboardingModal } from './components/OnboardingModal';
import RequireRole from './components/shared/RequireRole';

// ── Citizen pages (lazy) ──────────────────────────────────────────────────────
const HomePage        = React.lazy(() => import('./pages/HomePage'));
const MapPage         = React.lazy(() => import('./pages/MapPage'));
const ReportPage      = React.lazy(() => import('./pages/ReportPage'));
const DashboardPage   = React.lazy(() => import('./pages/DashboardPage'));
const IssueDetailPage = React.lazy(() => import('./pages/IssueDetailPage'));
const InsightsPage    = React.lazy(() => import('./pages/InsightsPage'));
const ProfilePage     = React.lazy(() => import('./pages/ProfilePage'));
const CommunityPage   = React.lazy(() => import('./pages/CommunityPage'));

// ── Auth pages (lazy) ─────────────────────────────────────────────────────────
const AdminLoginPage      = React.lazy(() => import('./pages/AdminLoginPage'));
const SuperAdminLoginPage = React.lazy(() => import('./pages/SuperAdminLoginPage'));

// ── Admin portal (lazy) ───────────────────────────────────────────────────────
const AdminLayout        = React.lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminComplaintsPage = React.lazy(() => import('./pages/admin/AdminComplaintsPage'));
const AdminAssignmentsPage = React.lazy(() => import('./pages/admin/AdminAssignmentsPage'));
const AdminMapPage = React.lazy(() => import('./pages/admin/AdminMapPage'));
const AdminAnalyticsPage = React.lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminNotificationsPage = React.lazy(() => import('./pages/admin/AdminNotificationsPage'));
const AdminSettingsPage = React.lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminDepartmentsPage = React.lazy(() => import('./pages/admin/AdminDepartmentsPage'));
const AdminDependenciesPage = React.lazy(() => import('./pages/admin/AdminDependenciesPage'));
const AdminWorkersPage = React.lazy(() => import('./pages/admin/AdminWorkersPage'));
const AdminInspectorPage = React.lazy(() => import('./pages/admin/AdminInspectorPage'));

// ── Super Admin portal (lazy) ─────────────────────────────────────────────────
const SuperAdminLayout        = React.lazy(() => import('./pages/super-admin/SuperAdminLayout'));
const SuperAdminDashboardPage = React.lazy(() => import('./pages/super-admin/SuperAdminDashboardPage'));
const MunicipalitiesPage      = React.lazy(() => import('./pages/super-admin/MunicipalitiesPage'));
const DepartmentsPage         = React.lazy(() => import('./pages/super-admin/DepartmentsPage'));
const NationalMapPage         = React.lazy(() => import('./pages/super-admin/NationalMapPage'));
const AdminsPage              = React.lazy(() => import('./pages/super-admin/AdminsPage'));
const AllUsersPage            = React.lazy(() => import('./pages/super-admin/AllUsersPage'));
const RolesPage               = React.lazy(() => import('./pages/super-admin/RolesPage'));
const AnalyticsPage           = React.lazy(() => import('./pages/super-admin/AnalyticsPage'));
const AIMonitoringPage        = React.lazy(() => import('./pages/super-admin/AIMonitoringPage'));
const SystemLogsPage          = React.lazy(() => import('./pages/super-admin/SystemLogsPage'));
const AuditReportsPage        = React.lazy(() => import('./pages/super-admin/AuditReportsPage'));
const ConfigurationPage       = React.lazy(() => import('./pages/super-admin/ConfigurationPage'));
const SettingsPage            = React.lazy(() => import('./pages/super-admin/SettingsPage'));
const IntegrationsPage        = React.lazy(() => import('./pages/super-admin/IntegrationsPage'));

// Generic suspense loading wrapper
const PageLoader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '1200px',
      margin: '40px auto',
      padding: '0 24px',
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

/**
 * Citizen-facing shell — includes Navbar, footer, and OnboardingModal.
 * Hidden entirely on /admin/* and /super-admin/* paths.
 */
function CitizenShell() {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';

  return (
    <div className="app-container">
      <Navbar />
      <OnboardingModal />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"          element={<HomePage />} />
            <Route path="/map"       element={<MapPage />} />
            <Route path="/report"    element={<ReportPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/issue/:id" element={<IssueDetailPage />} />
            <Route path="/insights"  element={<InsightsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile"   element={<ProfilePage />} />

            {/* Admin auth — URL-only, not linked from citizen UI */}
            <Route path="/login/admin"       element={<AdminLoginPage />} />
            <Route path="/login/super-admin" element={<SuperAdminLoginPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Swiss minimalist footer — hidden on Map and portal routes */}
      {!isMapPage && (
        <footer className="app-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5px' }}>
            <span className="text-mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '0.05em' }}>
              CIVICPULSE
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              © {new Date().getFullYear()} Municipal Ward Infrastructure Ledger.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/map"       className="text-muted" style={{ textDecoration: 'none' }}>Map</Link>
            <Link to="/dashboard" className="text-muted" style={{ textDecoration: 'none' }}>Dashboard</Link>
            <Link to="/insights"  className="text-muted" style={{ textDecoration: 'none' }}>Insights Analyst</Link>
            <Link to="/community" className="text-muted" style={{ textDecoration: 'none' }}>Community Feed</Link>
            <Link to="/report"    className="text-muted" style={{ textDecoration: 'none' }}>Report Hazard</Link>
          </div>
        </footer>
      )}
    </div>
  );
}

/**
 * Top-level router.
 * /admin/*       → RequireRole(['admin'])  → AdminLayout (no citizen chrome)
 * /super-admin/* → RequireRole(['super_admin']) → SuperAdminLayout (no citizen chrome)
 * /*             → CitizenShell (public + citizen routes)
 */
function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Admin portal ─────────────────────────────────────────────── */}
        <Route
          path="/admin/*"
          element={
            <RequireRole allowedRoles={['admin']}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="complaints" element={<AdminComplaintsPage />} />
          <Route path="assignments" element={<AdminAssignmentsPage />} />
          <Route path="map" element={<AdminMapPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="departments" element={<AdminDepartmentsPage />} />
          <Route path="dependencies" element={<AdminDependenciesPage />} />
          <Route path="workers" element={<AdminWorkersPage />} />
          <Route path="inspector" element={<AdminInspectorPage />} />
        </Route>

        {/* ── Super Admin portal ───────────────────────────────────────── */}
        <Route
          path="/super-admin/*"
          element={
            <RequireRole allowedRoles={['super_admin']}>
              <SuperAdminLayout />
            </RequireRole>
          }
        >
          <Route path="dashboard" element={<SuperAdminDashboardPage />} />
          <Route path="municipalities" element={<MunicipalitiesPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="map" element={<NationalMapPage />} />
          <Route path="admins" element={<AdminsPage />} />
          <Route path="users" element={<AllUsersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="ai" element={<AIMonitoringPage />} />
          <Route path="logs" element={<SystemLogsPage />} />
          <Route path="audit" element={<AuditReportsPage />} />
          <Route path="config" element={<ConfigurationPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
        </Route>

        {/* ── Citizen shell (all other routes) ─────────────────────────── */}
        <Route path="/*" element={<CitizenShell />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRouter />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'var(--surface-2)',
                  color: 'var(--text-1)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  borderRadius: '6px',
                },
                success: { iconTheme: { primary: 'var(--success)', secondary: '#FFFFFF' } },
                error:   { iconTheme: { primary: 'var(--danger)',  secondary: '#FFFFFF' } },
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
