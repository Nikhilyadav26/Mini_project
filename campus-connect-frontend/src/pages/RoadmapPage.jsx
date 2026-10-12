import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { roadmapApi, ensureArray } from '../api';
import { Icon } from '../components/Sidebar';

export default function RoadmapPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const toast = useToast();

  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form for AI Generation
  const [genForm, setGenForm] = useState({
    subject: '',
    semester: 'Fall 2026',
    startDate: '2026-08-01',
    endDate: '2026-12-15',
    classesPerWeek: 3,
    syllabusText: '',
    holidaysText: '2026-08-15: Independence Day\n2026-10-02: Gandhi Jayanti\n2026-10-31: Diwali',
  });

  // Reschedule state
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  async function loadRoadmaps(selectId = null) {
    setLoading(true);
    try {
      const data = await roadmapApi.list();
      const list = ensureArray(data);
      setRoadmaps(list);
      if (selectId) {
        const found = list.find(r => r._id === selectId);
        if (found) setSelectedRoadmap(found);
      } else if (list.length > 0 && !selectedRoadmap) {
        setSelectedRoadmap(list[0]);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load roadmaps');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoadmaps();
  }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!genForm.syllabusText || genForm.syllabusText.trim().length < 10) {
      toast.error('Please enter at least 10 characters of syllabus text');
      return;
    }
    setGenerating(true);
    try {
      const holidays = genForm.holidaysText
        .split('\n')
        .filter(l => l.includes(':'))
        .map(l => {
          const [date, name] = l.split(':');
          return { date: date.trim(), name: name?.trim() };
        });

      // 1. Generate via AI
      const genRes = await roadmapApi.generate({
        subject: genForm.subject,
        semester: genForm.semester,
        startDate: genForm.startDate,
        endDate: genForm.endDate,
        classesPerWeek: Number(genForm.classesPerWeek),
        syllabusText: genForm.syllabusText,
        holidays,
      });

      const schedule = genRes.schedule || genRes.roadmap?.schedule || [];
      if (!schedule || schedule.length === 0) {
        throw new Error('AI could not parse a valid schedule from syllabus');
      }

      // 2. Automatically save generated roadmap
      const savedRes = await roadmapApi.save({
        subject: genForm.subject,
        semester: genForm.semester,
        startDate: genForm.startDate,
        endDate: genForm.endDate,
        classesPerWeek: Number(genForm.classesPerWeek),
        holidays,
        schedule,
      });

      toast.success('Teaching roadmap successfully synthesized by AI!');
      setShowGenerateModal(false);
      const newId = savedRes.roadmap?._id || savedRes._id;
      loadRoadmaps(newId);
    } catch (err) {
      toast.error(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleUpdateSession(classNum, newStatus) {
    if (!selectedRoadmap) return;
    try {
      await roadmapApi.updateStatus(selectedRoadmap._id, classNum, {
        status: newStatus,
        notes: `Updated status to ${newStatus}`,
      });
      toast.success(`Class #${classNum} updated to ${newStatus}`);
      // Refresh selected roadmap
      const updated = await roadmapApi.get(selectedRoadmap._id);
      setSelectedRoadmap(updated.roadmap || updated);
      loadRoadmaps();
    } catch (err) {
      toast.error(err.message || 'Status update failed');
    }
  }

  async function handleReschedule() {
    if (!selectedRoadmap) return;
    const missed = (selectedRoadmap.schedule || [])
      .filter(s => s.status === 'missed')
      .map(s => s.classNumber);

    if (missed.length === 0) {
      toast.info('No sessions currently marked as missed to reschedule');
      return;
    }

    setRescheduling(true);
    try {
      await roadmapApi.reschedule(selectedRoadmap._id, {
        missedClassNumbers: missed,
        reason: rescheduleReason || 'Emergency campus leave',
      });
      toast.success('AI redistributed the missed curriculum into upcoming revision slots!');
      setRescheduleReason('');
      const updated = await roadmapApi.get(selectedRoadmap._id);
      setSelectedRoadmap(updated.roadmap || updated);
    } catch (err) {
      toast.error(err.message || 'Rescheduling failed');
    } finally {
      setRescheduling(false);
    }
  }

  // Calculate statistics
  const schedule = selectedRoadmap?.schedule || [];
  const completedCount = schedule.filter(s => s.status === 'completed').length;
  const missedCount = schedule.filter(s => s.status === 'missed').length;
  const totalCount = schedule.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>AI Adaptive Teaching Roadmap</h1>
          <p>
            {isTeacher
              ? 'AI generates class-by-class schedules with revision slots and adapts when classes are missed'
              : 'Track upcoming lectures, revision milestones, and syllabus completion'}
          </p>
        </div>
        {isTeacher && (
          <button
            id="create-roadmap-btn"
            className="btn btn-primary"
            onClick={() => setShowGenerateModal(true)}
          >
            <Icon.Sparkles /> Generate AI Roadmap
          </button>
        )}
      </div>

      {loading && roadmaps.length === 0 ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : roadmaps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗺️</div>
          <h3>No teaching roadmaps available</h3>
          <p>{isTeacher ? 'Create your first roadmap with AI now!' : 'Teachers have not uploaded course roadmaps yet.'}</p>
        </div>
      ) : (
        <div>
          {/* Roadmap Selector Tabs */}
          <div className="tabs" style={{ marginBottom: '20px' }}>
            {roadmaps.map(r => (
              <button
                key={r._id}
                id={`roadmap-tab-${r._id}`}
                className={`tab-btn ${selectedRoadmap?._id === r._id ? 'active' : ''}`}
                onClick={() => setSelectedRoadmap(r)}
              >
                {r.subject} ({r.semester})
              </button>
            ))}
          </div>

          {selectedRoadmap && (
            <div>
              {/* Roadmap Header Card */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {selectedRoadmap.subject}
                    </h2>
                    <span className="text-muted" style={{ fontSize: '13px' }}>
                      Semester: {selectedRoadmap.semester} · {selectedRoadmap.classesPerWeek} classes/week
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="stat-card" style={{ padding: '8px 16px', background: 'var(--bg-glass)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Progress: </span>
                      <strong style={{ color: 'var(--accent-emerald)', fontSize: '15px' }}>{progressPct}%</strong>
                    </div>

                    {isTeacher && missedCount > 0 && (
                      <button
                        id="reschedule-btn"
                        className="btn btn-sm btn-ai"
                        disabled={rescheduling}
                        onClick={handleReschedule}
                      >
                        {rescheduling ? <><span className="spinner" /> Adapting...</> : <>✦ AI Adapt Missed ({missedCount})</>}
                      </button>
                    )}
                  </div>
                </div>

                <div className="progress-bar" style={{ height: '8px', marginBottom: '16px' }}>
                  <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <span>✓ <strong>{completedCount}</strong> Completed</span>
                  <span style={{ color: missedCount > 0 ? 'var(--accent-rose)' : 'inherit' }}>
                    ⚠️ <strong>{missedCount}</strong> Missed
                  </span>
                  <span>⏳ <strong>{totalCount - completedCount - missedCount}</strong> Remaining</span>
                  <span>📊 <strong>{totalCount}</strong> Total Sessions</span>
                </div>
              </div>

              {/* Session Timeline Table */}
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Class</th>
                      <th style={{ width: '130px' }}>Date</th>
                      <th>Curriculum Topic</th>
                      <th style={{ width: '120px' }}>Category</th>
                      <th style={{ width: '120px' }}>Status</th>
                      {isTeacher && <th style={{ width: '180px' }}>Teacher Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map(session => {
                      const dt = session.date ? new Date(session.date).toLocaleDateString() : 'TBD';
                      const isCompleted = session.status === 'completed';
                      const isMissed = session.status === 'missed';

                      return (
                        <tr key={session.classNumber}>
                          <td>
                            <strong style={{ color: 'var(--text-accent)' }}>#{session.classNumber}</strong>
                          </td>
                          <td style={{ fontSize: '13px' }}>{dt}</td>
                          <td>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{session.topic}</div>
                            {session.notes && (
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {session.notes}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`badge badge-${session.type || 'lecture'}`}>
                              {session.type || 'lecture'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${session.status || 'planned'}`}>
                              {session.status || 'planned'}
                            </span>
                          </td>
                          {isTeacher && (
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  id={`mark-complete-${session.classNumber}`}
                                  className={`btn btn-sm ${isCompleted ? 'btn-secondary' : 'btn-success'}`}
                                  style={{ padding: '4px 8px', fontSize: '11.5px' }}
                                  onClick={() => handleUpdateSession(session.classNumber, 'completed')}
                                >
                                  ✓ Done
                                </button>
                                <button
                                  id={`mark-missed-${session.classNumber}`}
                                  className={`btn btn-sm ${isMissed ? 'btn-secondary' : 'btn-danger'}`}
                                  style={{ padding: '4px 8px', fontSize: '11.5px' }}
                                  onClick={() => handleUpdateSession(session.classNumber, 'missed')}
                                >
                                  ✕ Missed
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GENERATE ROADMAP MODAL */}
      {showGenerateModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <span className="modal-title">✦ AI Adaptive Teaching Roadmap Generator</span>
                <p className="text-muted" style={{ fontSize: '12.5px', marginTop: '2px' }}>
                  Signature Feature: Gemini synthesizes a class-by-class schedule with revisions & tests.
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowGenerateModal(false)}><Icon.X /></button>
            </div>

            <form className="form" onSubmit={handleGenerate}>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject Name</label>
                  <input
                    id="gen-subject"
                    className="form-control"
                    placeholder="e.g. Operating Systems & Cloud"
                    value={genForm.subject}
                    onChange={e => setGenForm(p => ({ ...p, subject: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Semester</label>
                  <input
                    id="gen-semester"
                    className="form-control"
                    placeholder="e.g. Semester 5 (Fall 2026)"
                    value={genForm.semester}
                    onChange={e => setGenForm(p => ({ ...p, semester: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Semester Start Date</label>
                  <input
                    id="gen-start"
                    type="date"
                    className="form-control"
                    value={genForm.startDate}
                    onChange={e => setGenForm(p => ({ ...p, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Semester End Date</label>
                  <input
                    id="gen-end"
                    type="date"
                    className="form-control"
                    value={genForm.endDate}
                    onChange={e => setGenForm(p => ({ ...p, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Classes Per Week (Frequency)</label>
                <input
                  id="gen-classes-per-week"
                  type="number"
                  min="1"
                  max="7"
                  className="form-control"
                  value={genForm.classesPerWeek}
                  onChange={e => setGenForm(p => ({ ...p, classesPerWeek: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Syllabus Content (Topics, Units, Concepts)</label>
                <textarea
                  id="gen-syllabus"
                  className="form-control"
                  rows={4}
                  placeholder="Paste syllabus modules here. E.g.:&#10;Unit 1: Process Management & Threads&#10;Unit 2: Concurrency & Deadlocks&#10;Unit 3: Virtual Memory & Page Replacement&#10;Unit 4: File Systems & Distributed Storage"
                  value={genForm.syllabusText}
                  onChange={e => setGenForm(p => ({ ...p, syllabusText: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Academic Holidays (Format: YYYY-MM-DD: Holiday Name)</label>
                <textarea
                  id="gen-holidays"
                  className="form-control"
                  rows={2}
                  value={genForm.holidaysText}
                  onChange={e => setGenForm(p => ({ ...p, holidaysText: e.target.value }))}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>Cancel</button>
                <button id="start-gen-roadmap" type="submit" className="btn btn-primary" disabled={generating}>
                  {generating ? <><span className="spinner" /> Synthesizing Schedule with AI...</> : '✦ Generate Roadmap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
