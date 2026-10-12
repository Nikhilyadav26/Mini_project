import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { complaintApi, ensureArray } from '../api';
import { Icon } from '../components/Sidebar';

export default function ComplaintsPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const toast = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionText, setResolutionText] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'academic',
  });

  async function loadComplaints() {
    setLoading(true);
    try {
      const data = await complaintApi.list();
      setComplaints(ensureArray(data));
    } catch (err) {
      toast.error(err.message || 'Failed to load complaints');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadComplaints();
  }, [user]);

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await complaintApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
      });
      toast.success('Complaint submitted successfully');
      setForm({ title: '', description: '', category: 'academic' });
      loadComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(id) {
    if (!resolutionText.trim()) {
      toast.error('Please enter resolution remarks');
      return;
    }
    try {
      await complaintApi.resolve(id, resolutionText.trim());
      toast.success('Complaint marked as resolved');
      setResolvingId(null);
      setResolutionText('');
      loadComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to resolve complaint');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Campus Complaints & Grievances</h1>
          <p>
            {isTeacher
              ? 'Review and resolve student grievances transparently'
              : 'Submit issues and track real-time resolution status'}
          </p>
        </div>
      </div>

      {!isTeacher && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-primary)' }}>
            📝 Submit a Grievance
          </h3>
          <form className="form" onSubmit={handleCreate}>
            <div className="form-group">
              <label>Title</label>
              <input
                id="complaint-title"
                className="form-control"
                placeholder="Brief summary of the issue"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  id="complaint-category"
                  className="form-control"
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                >
                  <option value="academic">Academic / Coursework</option>
                  <option value="facilities">Facilities / Infrastructure</option>
                  <option value="administration">Administration / Office</option>
                  <option value="other">Other Campus Issue</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Detailed Description</label>
              <textarea
                id="complaint-desc"
                className="form-control"
                rows={3}
                placeholder="Describe your issue with context..."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                required
              />
            </div>
            <button
              id="submit-complaint-btn"
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ alignSelf: 'flex-start' }}
            >
              {submitting ? <><span className="spinner" /> Submitting...</> : 'Submit Grievance'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : complaints.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛡️</div>
          <h3>No grievances reported</h3>
          <p>Everything is running smoothly on campus!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {complaints.map(c => {
            const isResolved = c.status === 'resolved';
            return (
              <div
                key={c._id}
                className="card"
                style={{
                  borderLeft: isResolved ? '4px solid var(--accent-emerald)' : '4px solid var(--accent-amber)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{c.title}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      <span className={`badge ${isResolved ? 'badge-resolved' : 'badge-in_progress'}`}>
                        {c.status || 'pending'}
                      </span>
                      {c.category && <span className="badge badge-draft">{c.category}</span>}
                      <span className="text-muted" style={{ fontSize: '12px' }}>
                        📅 {new Date(c.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {c.studentName && (
                    <span className="text-muted" style={{ fontSize: '12.5px' }}>
                      By: {c.studentName}
                    </span>
                  )}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: '12px 0' }}>
                  {c.description}
                </p>

                {(c.teacherResponse || c.resolution) && (
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginTop: '10px' }}>
                    <div style={{ color: 'var(--accent-emerald)', fontWeight: '700', fontSize: '12.5px', marginBottom: '4px' }}>
                      ✓ Official Teacher Remarks / Resolution
                    </div>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{c.teacherResponse || c.resolution}</p>
                  </div>
                )}

                {isTeacher && !isResolved && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    {resolvingId === c._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <textarea
                          id={`resolve-input-${c._id}`}
                          className="form-control"
                          rows={2}
                          placeholder="Provide explanation or action taken..."
                          value={resolutionText}
                          onChange={e => setResolutionText(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            id={`confirm-resolve-${c._id}`}
                            className="btn btn-sm btn-success"
                            onClick={() => handleResolve(c._id)}
                          >
                            Confirm Resolution
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => { setResolvingId(null); setResolutionText(''); }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        id={`resolve-btn-${c._id}`}
                        className="btn btn-sm btn-success"
                        onClick={() => { setResolvingId(c._id); setResolutionText(''); }}
                      >
                        ✓ Mark as Resolved
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
