import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { announcementApi } from '../api';
import { Icon } from '../components/Sidebar';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const toast = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', message: '', targetAudience: 'all' });
  const [posting, setPosting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await announcementApi.list();
      setAnnouncements(data.announcements || data || []);
    } catch (_) { setAnnouncements([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handlePost(e) {
    e.preventDefault();
    setPosting(true);
    try {
      await announcementApi.create(form);
      toast.success('Announcement posted!');
      setForm({ title: '', message: '', targetAudience: 'all' });
      load();
    } catch (err) { toast.error(err.message); }
    finally { setPosting(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this announcement?')) return;
    try {
      await announcementApi.delete(id);
      toast.success('Announcement deleted');
      load();
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Announcements</h1>
          <p>Quick broadcasts to students and staff</p>
        </div>
      </div>

      {isTeacher && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
            📣 Post Announcement
          </h3>
          <form className="form" onSubmit={handlePost}>
            <div className="form-group">
              <label>Title</label>
              <input id="ann-title" className="form-control" placeholder="Announcement title" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea id="ann-message" className="form-control" rows={3} placeholder="Your message..."
                value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Target Audience</label>
              <select id="ann-audience" className="form-control" value={form.targetAudience}
                onChange={e => setForm(p => ({ ...p, targetAudience: e.target.value }))}>
                <option value="all">All</option>
                <option value="students">Students Only</option>
                <option value="teachers">Teachers Only</option>
              </select>
            </div>
            <button id="post-ann-btn" type="submit" className="btn btn-primary" disabled={posting} style={{ alignSelf: 'flex-start' }}>
              {posting ? <><span className="spinner" /> Posting...</> : <><Icon.Send /> Post Announcement</>}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : announcements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📣</div>
          <h3>No announcements</h3>
          <p>Nothing to show right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {announcements.map(a => (
            <div key={a._id} className="notice-item" style={{
              borderLeft: '3px solid var(--accent-amber)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>{a.title}</div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{a.message}</p>
                </div>
                {isTeacher && (
                  <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDelete(a._id)} id={`del-ann-${a._id}`}><Icon.Trash /></button>
                )}
              </div>
              <div className="notice-item-footer">
                <div className="notice-meta">
                  <span className="meta-text">📅 {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'Today'}</span>
                  <span className="badge badge-draft">→ {a.targetAudience || 'all'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
