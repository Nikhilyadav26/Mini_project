import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { eventApi, ensureArray } from '../api';
import { Icon } from '../components/Sidebar';

function EventModal({ onClose, onSaved, initial }) {
  const toast = useToast();

  const getInitialDateTime = () => {
    if (initial?.eventDate || initial?.date) {
      const d = new Date(initial.eventDate || initial.date);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
      }
    }
    const defaultDate = new Date(Date.now() + 86400000 * 3);
    const yyyy = defaultDate.getFullYear();
    const mm = String(defaultDate.getMonth() + 1).padStart(2, '0');
    const dd = String(defaultDate.getDate()).padStart(2, '0');
    return { date: `${yyyy}-${mm}-${dd}`, time: '10:00' };
  };

  const initDt = getInitialDateTime();

  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    date: initDt.date,
    time: initDt.time,
    location: initial?.location || initial?.venue || '',
    registrationLink: initial?.registrationLink || '',
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial;

  function upd(e) { setForm(p => ({ ...p, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.date || !form.time) {
      toast.error('Please specify both event date and time');
      return;
    }

    setLoading(true);
    try {
      const combinedDate = new Date(`${form.date}T${form.time}:00`);
      if (isNaN(combinedDate.getTime())) {
        toast.error('Invalid date or time entered');
        setLoading(false);
        return;
      }

      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        eventDate: combinedDate.toISOString(),
        location: form.location.trim(),
        registrationLink: form.registrationLink?.trim() || '',
      };
      if (isEdit) await eventApi.update(initial._id, body);
      else await eventApi.create(body);
      toast.success(isEdit ? 'Event updated!' : 'Event created!');
      onSaved();
      onClose();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Event' : 'Create Event'}</span>
          <button className="modal-close" onClick={onClose}><Icon.X /></button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input id="event-title" className="form-control" name="title" placeholder="Event name, e.g. Annual Tech Symposium" value={form.title} onChange={upd} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea id="event-description" className="form-control" name="description" rows={3} value={form.description} onChange={upd} placeholder="What is this event about?" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Event Date</label>
              <input id="event-date" type="date" className="form-control" name="date" value={form.date} onChange={upd} required />
            </div>
            <div className="form-group">
              <label>Start Time</label>
              <input id="event-time" type="time" className="form-control" name="time" value={form.time} onChange={upd} required />
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                {['09:00', '10:00', '14:00', '16:00'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '10.5px', padding: '2px 6px' }}
                    onClick={() => setForm(p => ({ ...p, time: t }))}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Location / Venue</label>
            <input id="event-location" className="form-control" name="location" placeholder="e.g. Auditorium Hall A or Seminar Hall 3" value={form.location} onChange={upd} required />
          </div>
          <div className="form-group">
            <label>External Registration Link (Optional)</label>
            <input id="event-reg-link" className="form-control" name="registrationLink" placeholder="e.g. https://forms.gle/... (optional)" value={form.registrationLink} onChange={upd} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="submit-event" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Saving...</> : isEdit ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventCard({ event, isTeacher, onRefresh }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [registering, setRegistering] = useState(false);

  const dateVal = event.eventDate || event.date;
  const dateStr = dateVal ? new Date(dateVal).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }) : 'TBD';

  async function handleRegister() {
    setRegistering(true);
    try {
      await eventApi.register(event._id);
      toast.success('Successfully registered!');
      onRefresh();
    } catch (err) { toast.error(err.message); }
    finally { setRegistering(false); }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${event.title}"?`)) return;
    try {
      await eventApi.delete(event._id);
      toast.success('Event deleted');
      onRefresh();
    } catch (err) { toast.error(err.message); }
  }

  const participants = event.participants?.length || event.registrations?.length || 0;
  const maxP = event.maxParticipants || 0;

  return (
    <>
      <div className="opportunity-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <div className="opp-company">🗓️ {dateStr}</div>
            <div className="opp-role">{event.title}</div>
          </div>
          {isTeacher && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-sm btn-secondary btn-icon" onClick={() => setEditing(true)} id={`edit-event-${event._id}`}><Icon.Edit /></button>
              <button className="btn btn-sm btn-danger btn-icon" onClick={handleDelete} id={`delete-event-${event._id}`}><Icon.Trash /></button>
            </div>
          )}
        </div>
        {event.description && <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.6' }}>{event.description}</p>}
        <div className="opp-meta">
          {(event.location || event.venue) && <span className="opp-meta-item"><Icon.MapPin /> {event.location || event.venue}</span>}
          {event.registrationLink && <span className="opp-meta-item">🔗 <a href={event.registrationLink} target="_blank" rel="noreferrer" style={{ color: 'var(--text-accent)' }}>Link</a></span>}
        </div>
        {!isTeacher && (
          <button id={`register-event-${event._id}`} className="btn btn-sm btn-success" onClick={handleRegister} disabled={registering} style={{ marginTop: '8px' }}>
            {registering ? <><span className="spinner" style={{ width: '12px', height: '12px' }} /> Registering...</> : '✓ Register'}
          </button>
        )}
        {maxP > 0 && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{Math.round(participants / maxP * 100)}% filled</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(100, participants / maxP * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
      {editing && <EventModal initial={event} onClose={() => setEditing(false)} onSaved={onRefresh} />}
    </>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await eventApi.list();
      setEvents(ensureArray(data));
    } catch (_) { setEvents([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const eventList = Array.isArray(events) ? events : [];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Events</h1>
          <p>Campus workshops, seminars and activities</p>
        </div>
        {isTeacher && (
          <button id="create-event-btn" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Icon.Plus /> New Event
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : eventList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗓️</div>
          <h3>No events scheduled</h3>
          <p>{isTeacher ? 'Create an event to get started.' : 'Check back for upcoming campus events.'}</p>
        </div>
      ) : (
        <div className="card-grid card-grid-2">
          {eventList.map(ev => (
            <EventCard key={ev._id} event={ev} isTeacher={isTeacher} onRefresh={load} />
          ))}
        </div>
      )}

      {showCreate && <EventModal onClose={() => setShowCreate(false)} onSaved={load} />}
    </div>
  );
}
