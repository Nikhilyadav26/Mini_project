import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { noticeApi, eventApi, opportunityApi, assignmentApi, ensureArray } from '../api';

const COLOR_MAP = {
  indigo:  { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8',  border: 'rgba(99,102,241,0.25)' },
  emerald: { bg: 'rgba(16,185,129,0.12)',  color: '#34d399',  border: 'rgba(16,185,129,0.25)' },
  amber:   { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24',  border: 'rgba(245,158,11,0.25)' },
  rose:    { bg: 'rgba(244,63,94,0.12)',   color: '#fb7185',  border: 'rgba(244,63,94,0.25)' },
  cyan:    { bg: 'rgba(6,182,212,0.12)',   color: '#22d3ee',  border: 'rgba(6,182,212,0.25)' },
};

function StatCard({ icon, label, value, color = 'indigo' }) {
  const c = COLOR_MAP[color] || COLOR_MAP.indigo;
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
        <span style={{ fontSize: '22px' }}>{icon}</span>
      </div>
      <div className="stat-info">
        <h3 style={{ color: c.color }}>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [stats, setStats] = useState({ notices: 0, events: 0, opportunities: 0, assignments: 0 });
  const [recentNotices, setRecentNotices] = useState([]);
  const [recentEvents, setRecentEvents]   = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [n, e, o, a] = await Promise.allSettled([
          noticeApi.list(),
          eventApi.list(),
          opportunityApi.list(),
          assignmentApi.list(),
        ]);
        const notices      = n.status === 'fulfilled' ? ensureArray(n.value) : [];
        const events       = e.status === 'fulfilled' ? ensureArray(e.value) : [];
        const opps         = o.status === 'fulfilled' ? ensureArray(o.value) : [];
        const assignments  = a.status === 'fulfilled' ? ensureArray(a.value) : [];
        setStats({ notices: notices.length, events: events.length, opportunities: opps.length, assignments: assignments.length });
        setRecentNotices(notices.slice(0, 3));
        setRecentEvents(events.slice(0, 3));
      } catch (_) {}
    }
    load();
  }, []);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <p className="dashboard-greeting">{greeting}! 👋</p>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            {isTeacher ? 'Manage your classes and track student progress' : 'Stay updated with campus activities and academics'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          {user?.department && <span className="badge badge-draft">{user.department}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="📢" label="Total Notices" value={stats.notices} color="indigo" />
        <StatCard icon="🗓️" label="Upcoming Events" value={stats.events} color="emerald" />
        <StatCard icon="💼" label="Opportunities" value={stats.opportunities} color="amber" />
        <StatCard icon="📝" label="Assignments" value={stats.assignments} color="rose" />
      </div>

      {/* AI Features Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08), rgba(6,182,212,0.06))',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>✦</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              AI-Powered Features
            </span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {isTeacher
              ? 'Generate adaptive teaching roadmaps, rewrite notices with AI, and review AI-assisted assignment feedback.'
              : 'Get AI-powered placement prep, quiz questions from job descriptions, and assignment feedback before submitting.'
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', padding: '8px 14px', fontSize: '12.5px', color: '#a78bfa', fontWeight: '600' }}>
            📚 Roadmap Generator
          </div>
          <div style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '8px', padding: '8px 14px', fontSize: '12.5px', color: '#22d3ee', fontWeight: '600' }}>
            💼 Placement Prep
          </div>
          <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '8px 14px', fontSize: '12.5px', color: '#34d399', fontWeight: '600' }}>
            📝 Assignment AI
          </div>
        </div>
      </div>

      {/* Recent sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <div className="recent-section">
            <h2>Recent Notices</h2>
          </div>
          {recentNotices.length === 0 ? (
            <div className="card"><p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No notices yet.</p></div>
          ) : recentNotices.map(n => (
            <div key={n._id} className="notice-item" style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>{n.title}</div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {new Date(n.createdAt || Date.now()).toLocaleDateString()} · <span className={`badge badge-${n.status || 'published'}`}>{n.status || 'published'}</span>
              </p>
            </div>
          ))}
        </div>

        <div>
          <div className="recent-section">
            <h2>Upcoming Events</h2>
          </div>
          {recentEvents.length === 0 ? (
            <div className="card"><p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No events yet.</p></div>
          ) : recentEvents.map(ev => (
            <div key={ev._id} className="notice-item" style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>{ev.title}</div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                📅 {ev.date ? new Date(ev.date).toLocaleDateString() : 'TBD'} · 📍 {ev.venue || ev.location || 'TBD'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
