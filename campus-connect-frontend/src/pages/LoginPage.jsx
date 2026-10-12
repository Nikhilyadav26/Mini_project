import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authApi } from '../api';
import { Icon } from '../components/Sidebar';

export default function LoginPage() {
  const { login, register } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student', department: '', year: ''
  });

  function update(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        const body = { name: form.name, email: form.email, password: form.password, role: form.role };
        if (form.department) body.department = form.department;
        if (form.role === 'student' && form.year) body.year = Number(form.year);
        await register(body);
        toast.success('Account created! Welcome to Campus Connect.');
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  async function instantLogin(role) {
    const email = role === 'teacher' ? 'teacher@example.com' : 'student@example.com';
    const password = role === 'teacher' ? 'Teacher@123' : 'Student@123';
    setLoading(true);
    try {
      await login(email, password);
      toast.success(`Welcome to Campus Connect (${role})!`);
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role) {
    if (role === 'teacher') {
      setForm(p => ({ ...p, email: 'teacher@example.com', password: 'Teacher@123' }));
    } else {
      setForm(p => ({ ...p, email: 'student@example.com', password: 'Student@123' }));
    }
    setMode('login');
  }

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">CC</div>
          <h1>Campus Connect</h1>
          <p>Your intelligent college platform</p>
        </div>

        {/* 1-Click Instant Demo Login (Prominent at top) */}
        <div style={{
          marginBottom: '22px',
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
        }}>
          <p style={{ textAlign: 'center', marginBottom: '10px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ 1-Click Instant Demo Login
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              id="instant-teacher-btn"
              type="button"
              className="btn btn-secondary"
              onClick={() => instantLogin('teacher')}
              disabled={loading}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8',
                gap: '3px',
                fontSize: '12px',
                fontWeight: '700'
              }}
            >
              <span style={{ fontSize: '20px' }}>👩‍🏫</span>
              <span>Teacher Mode</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '400' }}>teacher@example.com</span>
            </button>

            <button
              id="instant-student-btn"
              type="button"
              className="btn btn-secondary"
              onClick={() => instantLogin('student')}
              disabled={loading}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#34d399',
                gap: '3px',
                fontSize: '12px',
                fontWeight: '700'
              }}
            >
              <span style={{ fontSize: '20px' }}>👨‍🎓</span>
              <span>Student Mode</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '400' }}>student@example.com</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: '20px' }}>
          <button
            id="tab-login"
            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Sign In
          </button>
          <button
            id="tab-register"
            className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Create Account
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit} id="auth-form">
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input id="input-name" className="form-control" name="name" placeholder="John Doe" value={form.name} onChange={update} required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select id="input-role" className="form-control" name="role" value={form.role} onChange={update}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              {form.role === 'student' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <input id="input-dept" className="form-control" name="department" placeholder="Computer Science" value={form.department} onChange={update} />
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <select id="input-year" className="form-control" name="year" value={form.year} onChange={update}>
                      <option value="">Select year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input id="input-email" type="email" className="form-control" name="email" placeholder="you@college.edu" value={form.email} onChange={update} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input id="input-password" type="password" className="form-control" name="password" placeholder="••••••••" value={form.password} onChange={update} required />
          </div>

          <button
            id="submit-auth"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 18px',
              fontSize: '14px',
              fontWeight: '600',
              justifyContent: 'center',
              marginTop: '6px'
            }}
          >
            {loading ? (
              <><span className="spinner" /> Processing...</>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Demo credentials autofill */}
        <div className="login-demo" style={{ marginTop: '16px' }}>
          <p>Autofill Demo Form</p>
          <div className="demo-creds">
            <div className="demo-cred">
              <span>👩‍🏫 Teacher:</span>
              <strong>teacher@example.com</strong>
              <button type="button" className="btn btn-sm btn-secondary" style={{ padding: '3px 10px', fontSize: '11px' }} onClick={() => fillDemo('teacher')}>Fill</button>
            </div>
            <div className="demo-cred">
              <span>👨‍🎓 Student:</span>
              <strong>student@example.com</strong>
              <button type="button" className="btn btn-sm btn-secondary" style={{ padding: '3px 10px', fontSize: '11px' }} onClick={() => fillDemo('student')}>Fill</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
