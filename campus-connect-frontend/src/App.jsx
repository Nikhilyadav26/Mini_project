import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Sidebar, Icon } from './components/Sidebar';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NoticesPage from './pages/NoticesPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import EventsPage from './pages/EventsPage';
import ComplaintsPage from './pages/ComplaintsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import RoadmapPage from './pages/RoadmapPage';
import OpportunitiesPage from './pages/OpportunitiesPage';

function MainLayout() {
  const { user, loading, logout, switchDemoRole } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSwitchRole() {
    try {
      await switchDemoRole();
    } catch (_) {}
  }

  if (loading) {
    return (
      <div className="login-page">
        <div className="loading-center">
          <div className="spinner spinner-lg" />
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Connecting to Campus Connect...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  function renderPage() {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'notices':
        return <NoticesPage />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'events':
        return <EventsPage />;
      case 'complaints':
        return <ComplaintsPage />;
      case 'assignments':
        return <AssignmentsPage />;
      case 'roadmap':
        return <RoadmapPage />;
      case 'opportunities':
        return <OpportunitiesPage />;
      default:
        return <DashboardPage />;
    }
  }

  return (
    <div className="app-layout">
      {/* Mobile Top Bar */}
      <div style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        alignItems: 'center',
        padding: '0 16px',
        zIndex: 99,
        justifyContent: 'space-between',
      }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: 'var(--text-primary)', padding: '6px' }}
          >
            <Icon.Menu />
          </button>
          <span style={{ fontWeight: '800', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Campus Connect
          </span>
        </div>
      </div>

      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          setMobileMenuOpen(false);
          window.scrollTo(0, 0);
        }}
      />

      <main className="main-content" id="main-content-view">
        {/* Top Navbar with quick role switch & logout */}
        <header className="top-navbar" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Logged in as:</span>
            <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{user?.name}</strong>
            <span className={`badge badge-${user?.role}`} style={{ textTransform: 'capitalize', fontSize: '11px', padding: '2px 8px' }}>
              {user?.role === 'teacher' ? '👩‍🏫 Teacher' : '👨‍🎓 Student'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              id="top-switch-role-btn"
              className="btn btn-sm btn-secondary"
              onClick={handleSwitchRole}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
              title="Click to switch between Teacher and Student accounts"
            >
              <span>⇄</span> Switch to {user?.role === 'teacher' ? 'Student View' : 'Teacher View'}
            </button>
            <button
              id="top-logout-btn"
              className="btn btn-sm btn-danger"
              onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
              title="Sign Out"
            >
              <Icon.LogOut /> Logout
            </button>
          </div>
        </header>

        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ToastProvider>
  );
}
