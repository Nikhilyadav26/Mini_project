import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { noticeApi, ensureArray } from '../api';
import { Icon } from '../components/Sidebar';

function CreateNoticeModal({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: '', content: '', category: 'general', status: 'published' });
  const [loading, setLoading] = useState(false);
  const [polishing, setPolishing] = useState(false);

  async function handleAiPolish() {
    if (!form.content.trim() && !form.title.trim()) {
      toast.error('Please write some content first to polish with AI!');
      return;
    }
    setPolishing(true);
    try {
      const res = await noticeApi.rewrite(form.content || form.title);
      const data = res.data || res;
      setForm(p => ({
        ...p,
        title: data.title || p.title,
        content: data.content || p.content,
      }));
      toast.success('AI polished the notice draft!');
    } catch (err) {
      toast.error(err.message || 'AI polish failed');
    } finally {
      setPolishing(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await noticeApi.create({
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category || 'general',
        status: 'published',
      });
      toast.success('Notice published successfully!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Create Notice</span>
          <button className="modal-close" onClick={onClose}><Icon.X /></button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input id="notice-title" className="form-control" placeholder="Notice title" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select id="notice-category" className="form-control" value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              <option value="general">General</option>
              <option value="academic">Academic</option>
              <option value="event">Event</option>
              <option value="placement">Placement</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Content</label>
              <button
                type="button"
                className="btn btn-sm btn-ai"
                style={{ padding: '3px 8px', fontSize: '11.5px' }}
                disabled={polishing}
                onClick={handleAiPolish}
              >
                {polishing ? <><span className="spinner" style={{ width: '12px', height: '12px' }} /> Polishing...</> : '✦ AI Polish Draft'}
              </button>
            </div>
            <textarea id="notice-content" className="form-control" placeholder="Write your notice draft here..." rows={4}
              value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} required />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="submit-notice" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Publishing...</> : 'Publish Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NoticeCard({ notice, isTeacher, onRefresh }) {
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function handlePublish() {
    try {
      await noticeApi.publish(notice._id);
      toast.success('Notice published!');
      onRefresh();
    } catch (err) { toast.error(err.message); }
  }

  async function handleDelete() {
    if (!confirm('Delete this notice?')) return;
    try {
      await noticeApi.delete(notice._id);
      toast.success('Notice deleted');
      onRefresh();
    } catch (err) { toast.error(err.message); }
  }

  async function handleAiRewrite() {
    setAiLoading(true);
    try {
      const res = await noticeApi.rewrite(`${notice.title}. ${notice.content}`);
      const data = res.data || res;
      setAiResult(data);
      toast.success('AI refined notice generated!');
    } catch (err) { toast.error(err.message || 'AI rewrite failed'); }
    finally { setAiLoading(false); }
  }

  return (
    <div className="notice-item">
      <div className="notice-item-header">
        <div className="notice-item-title">{notice.title}</div>
        <span className={`badge badge-${notice.status || 'published'}`}>{notice.status || 'published'}</span>
      </div>
      <p className={`notice-item-content ${expanded ? 'expanded' : ''}`}>{notice.content}</p>
      {notice.content?.length > 160 && (
        <button className="btn btn-sm" style={{ color: 'var(--text-accent)', padding: '4px 0', fontSize: '12px' }}
          onClick={() => setExpanded(p => !p)}>{expanded ? 'Show less' : 'Read more'}</button>
      )}

      {aiResult && (
        <div className="ai-result" style={{ marginTop: '14px' }}>
          <div className="ai-result-title">✦ AI Refined Version</div>
          {aiResult.title && <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>{aiResult.title}</h4>}
          <p>{aiResult.content || JSON.stringify(aiResult)}</p>
        </div>
      )}

      <div className="notice-item-footer">
        <div className="notice-meta">
          <span className="meta-text">📅 {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'N/A'}</span>
          {notice.category && <span className={`badge badge-${notice.category}`}>{notice.category}</span>}
        </div>
        {isTeacher && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {notice.status !== 'published' && (
              <button className="btn btn-sm btn-success" onClick={handlePublish} id={`publish-${notice._id}`}>Publish</button>
            )}
            <button className="btn btn-sm btn-ai" onClick={handleAiRewrite} disabled={aiLoading} id={`ai-rewrite-${notice._id}`}>
              {aiLoading ? <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#a78bfa' }} /> : '✦ AI Rewrite'}
            </button>
            <button className="btn btn-sm btn-danger btn-icon" onClick={handleDelete} id={`delete-notice-${notice._id}`}><Icon.Trash /></button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NoticesPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const data = await noticeApi.list();
      setNotices(ensureArray(data));
    } catch (_) { setNotices([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const safeNotices = Array.isArray(notices) ? notices : [];
  const filtered = filter === 'all' ? safeNotices : safeNotices.filter(n => n.status === filter || n.category === filter);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Notices</h1>
          <p>Official campus notices and announcements</p>
        </div>
        {isTeacher && (
          <button id="create-notice-btn" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Icon.Plus /> New Notice
          </button>
        )}
      </div>

      <div className="tabs">
        {['all', 'general', 'academic', 'placement', 'event', 'holiday'].map(f => (
          <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}
            id={`filter-${f}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /><p>Loading notices...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📢</div>
          <h3>No notices found</h3>
          <p>{isTeacher ? 'Create the first notice!' : 'Check back later.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(n => (
            <NoticeCard key={n._id} notice={n} isTeacher={isTeacher} onRefresh={load} />
          ))}
        </div>
      )}

      {showCreate && <CreateNoticeModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}
