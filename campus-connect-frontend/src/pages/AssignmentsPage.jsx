import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { assignmentApi, ensureArray } from '../api';
import { Icon } from '../components/Sidebar';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const toast = useToast();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submissionCounts, setSubmissionCounts] = useState({});

  const [activeAssignment, setActiveAssignment] = useState(null);
  const [submissionDraft, setSubmissionDraft] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiFeedbackLoading, setAiFeedbackLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [viewSubmissionsAssignment, setViewSubmissionsAssignment] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradingState, setGradingState] = useState({});

  const [createForm, setCreateForm] = useState({
    title: '', description: '', subject: '', dueDate: '', maxMarks: 100, rubricCriteria: '',
  });
  const [creating, setCreating] = useState(false);

  async function loadAssignments() {
    setLoading(true);
    try {
      const data = await assignmentApi.list();
      const list = ensureArray(data);
      setAssignments(list);
      if (user?.role === 'teacher' && list.length > 0) loadSubmissionCounts(list);
    } catch (err) {
      toast.error(err.message || 'Failed to load assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubmissionCounts(list) {
    const counts = {};
    await Promise.allSettled(list.map(async (a) => {
      try {
        const res = await assignmentApi.submissions(a._id);
        const subs = Array.isArray(res) ? res : ensureArray(res);
        counts[a._id] = subs.length;
      } catch { counts[a._id] = 0; }
    }));
    setSubmissionCounts(counts);
  }

  useEffect(() => { loadAssignments(); }, []);

  async function handleCreateAssignment(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const rubricText = createForm.rubricCriteria.trim() || 'Criteria: Quality of Implementation (50%), Edge Case Handling (30%), Code Organization (20%)';
      await assignmentApi.create({
        title: createForm.title.trim(), description: createForm.description.trim(),
        subject: createForm.subject.trim(), deadline: new Date(createForm.dueDate).toISOString(),
        dueDate: createForm.dueDate, maxScore: Number(createForm.maxMarks) || 100,
        maxMarks: Number(createForm.maxMarks) || 100, rubric: rubricText,
        rubricCriteria: rubricText.split('\n').filter(Boolean),
      });
      toast.success('Assignment created!');
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', subject: '', dueDate: '', maxMarks: 100, rubricCriteria: '' });
      loadAssignments();
    } catch (err) { toast.error(err.message || 'Error creating assignment'); }
    finally { setCreating(false); }
  }

  async function handleGetAiFeedback(assignmentId) {
    if (!submissionDraft.trim()) { toast.error('Please write some content first!'); return; }
    setAiFeedbackLoading(true); setAiFeedback(null);
    try {
      const res = await assignmentApi.feedback(assignmentId, { draftContent: submissionDraft, submissionText: submissionDraft });
      setAiFeedback(res.evaluation || res.feedback || res);
      toast.success('AI Feedback generated!');
    } catch (err) { toast.error(err.message || 'Failed to generate AI feedback'); }
    finally { setAiFeedbackLoading(false); }
  }

  async function handleOfficialSubmit(assignmentId) {
    if (!submissionDraft.trim()) { toast.error('Cannot submit empty content'); return; }
    setSubmitting(true);
    try {
      await assignmentApi.submit(assignmentId, { content: submissionDraft, submissionText: submissionDraft });
      toast.success('Assignment submitted successfully!');
      setActiveAssignment(null); setSubmissionDraft(''); setAiFeedback(null);
      loadAssignments();
    } catch (err) { toast.error(err.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  }

  async function openSubmissionsModal(assignment) {
    setViewSubmissionsAssignment(assignment);
    setSubmissionsList([]); setGradingState({});
    setSubmissionsLoading(true);
    try {
      const res = await assignmentApi.submissions(assignment._id);
      const list = Array.isArray(res) ? res : ensureArray(res);
      setSubmissionsList(list);
      const existing = {};
      list.forEach((sub) => {
        existing[sub._id] = {
          marks: (sub.teacherGrade !== null && sub.teacherGrade !== undefined) ? sub.teacherGrade : '',
          feedback: sub.teacherFeedback || '',
        };
      });
      setGradingState(existing);
    } catch (err) { toast.error(err.message || 'Failed to load submissions'); setSubmissionsList([]); }
    finally { setSubmissionsLoading(false); }
  }

  async function handleGradeSubmission(assignmentId, submissionId) {
    const gradeInfo = gradingState[submissionId];
    if (!gradeInfo || gradeInfo.marks === '' || gradeInfo.marks === undefined) {
      toast.error('Please enter marks before saving'); return;
    }
    try {
      await assignmentApi.grade(assignmentId, submissionId, {
        marks: Number(gradeInfo.marks), teacherGrade: Number(gradeInfo.marks),
        feedback: gradeInfo.feedback || '', teacherFeedback: gradeInfo.feedback || '',
      });
      toast.success('Grade saved!');
      openSubmissionsModal(viewSubmissionsAssignment);
    } catch (err) { toast.error(err.message || 'Failed to save grade'); }
  }

  function getStudentName(sub) {
    if (sub.studentId && typeof sub.studentId === 'object') return sub.studentId.name || sub.studentId.email || 'Student';
    return sub.studentName || sub.student?.name || sub.studentEmail || 'Student';
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Assignments &amp; AI Improvement Loop</h1>
          <p>{isTeacher ? 'Create course assignments, define rubrics, and grade student submissions' : 'Review requirements, get AI suggestions before submitting, and track feedback'}</p>
        </div>
        {isTeacher && (
          <button id="create-assignment-btn" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Icon.Plus /> New Assignment
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : assignments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>No assignments yet</h3>
          <p>{isTeacher ? 'Click New Assignment to create one.' : 'You have no pending assignments.'}</p>
        </div>
      ) : (
        <div className="card-grid card-grid-2">
          {assignments.map(a => {
            const rawDate = a.deadline || a.dueDate;
            const dueStr = rawDate ? new Date(rawDate).toLocaleDateString() : 'No deadline';
            const maxMark = a.maxScore || a.maxMarks || 100;
            const subCount = submissionCounts[a._id] !== undefined ? submissionCounts[a._id] : (a.submissions?.length ?? '…');
            return (
              <div key={a._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span className="badge badge-draft" style={{ marginBottom: '6px' }}>{a.subject || 'General'}</span>
                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{a.title}</h3>
                  </div>
                  <span className="badge badge-lecture">{maxMark} Marks</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.6', flex: 1, margin: '10px 0' }}>{a.description}</p>
                {a.rubric && (
                  <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rubric:</span>
                    <div style={{ marginTop: '6px', fontSize: '12.5px', color: 'var(--text-secondary)', whiteSpace: 'pre-line', maxHeight: '60px', overflowY: 'auto' }}>{a.rubric}</div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
                  <span className="text-muted" style={{ fontSize: '12.5px' }}>⏰ Due: {dueStr}</span>
                  {isTeacher ? (
                    <button id={`view-subs-${a._id}`} className="btn btn-sm btn-secondary" onClick={() => openSubmissionsModal(a)}>
                      📋 View Submissions ({subCount})
                    </button>
                  ) : (
                    <button id={`start-submit-${a._id}`} className="btn btn-sm btn-primary" onClick={() => { setActiveAssignment(a); setSubmissionDraft(''); setAiFeedback(null); }}>
                      ✦ Work &amp; AI Feedback
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STUDENT SUBMISSION & AI FEEDBACK MODAL */}
      {activeAssignment && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <span className="modal-title">{activeAssignment.title}</span>
                <p className="text-muted" style={{ fontSize: '12.5px', marginTop: '2px' }}>Test your draft against rubrics with AI before teacher evaluation!</p>
              </div>
              <button className="modal-close" onClick={() => setActiveAssignment(null)}><Icon.X /></button>
            </div>
            {activeAssignment.rubric && (
              <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '14px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-accent)' }}>📋 Grading Rubric:</strong> <span style={{ whiteSpace: 'pre-line' }}>{activeAssignment.rubric}</span>
              </div>
            )}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Your Assignment Work / Draft</label>
              <textarea id="assignment-draft-input" className="form-control" rows={6} placeholder="Write your assignment solution, code explanation, or analysis here..." value={submissionDraft} onChange={e => setSubmissionDraft(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button id="ai-feedback-btn" type="button" className="btn btn-ai" disabled={aiFeedbackLoading} onClick={() => handleGetAiFeedback(activeAssignment._id)}>
                {aiFeedbackLoading ? <><span className="spinner" /> Analyzing...</> : <>✦ Get AI Feedback &amp; Improvement Tips</>}
              </button>
              <button id="official-submit-btn" type="button" className="btn btn-success" disabled={submitting} onClick={() => handleOfficialSubmit(activeAssignment._id)}>
                {submitting ? <><span className="spinner" /> Submitting...</> : '✓ Final Submit to Teacher'}
              </button>
            </div>
            {aiFeedback && (
              <div className="ai-result">
                <div className="ai-result-title"><span style={{ fontSize: '15px', lineHeight: 1 }}>✦</span> AI Assignment Pre-Submission Review</div>
                {typeof aiFeedback === 'object' ? (
                  <div>
                    {aiFeedback.readinessScore !== undefined && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div className="match-ring" style={{ width: '56px', height: '56px', fontSize: '16px' }}>{aiFeedback.readinessScore}%</div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px' }}>Readiness Evaluation</div>
                          <div className="text-muted" style={{ fontSize: '12.5px' }}>{aiFeedback.readinessScore >= 80 ? 'Well prepared for submission!' : 'Consider addressing suggestions before turning in.'}</div>
                        </div>
                      </div>
                    )}
                    {aiFeedback.strengths && (
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{ color: 'var(--accent-emerald)', fontSize: '13.5px' }}>✓ Strong Points</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{Array.isArray(aiFeedback.strengths) ? aiFeedback.strengths.join(' • ') : aiFeedback.strengths}</p>
                      </div>
                    )}
                    {aiFeedback.missingPoints && (
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{ color: 'var(--accent-amber)', fontSize: '13.5px' }}>⚠️ Missing Criteria / Gaps</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{Array.isArray(aiFeedback.missingPoints) ? aiFeedback.missingPoints.join(' • ') : aiFeedback.missingPoints}</p>
                      </div>
                    )}
                    {(aiFeedback.suggestions || aiFeedback.improvementSuggestions) && (
                      <div>
                        <h4 style={{ color: 'var(--accent-cyan)', fontSize: '13.5px' }}>💡 Specific Improvements</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{(() => { const s = aiFeedback.suggestions || aiFeedback.improvementSuggestions; return Array.isArray(s) ? s.join(' • ') : s; })()}</p>
                      </div>
                    )}
                    {aiFeedback.feedback && <p style={{ fontSize: '13.5px', marginTop: '10px' }}>{aiFeedback.feedback}</p>}
                  </div>
                ) : (
                  <p style={{ fontSize: '13.5px', whiteSpace: 'pre-wrap' }}>{String(aiFeedback)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEACHER SUBMISSIONS VIEW MODAL */}
      {viewSubmissionsAssignment && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <span className="modal-title">Submissions: {viewSubmissionsAssignment.title}</span>
                <p className="text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                  Max Marks: {viewSubmissionsAssignment.maxScore || viewSubmissionsAssignment.maxMarks || 100} &nbsp;|&nbsp;
                  {submissionsList.length} submission{submissionsList.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => openSubmissionsModal(viewSubmissionsAssignment)} disabled={submissionsLoading} title="Refresh">
                  <Icon.RefreshCw /> Refresh
                </button>
                <button className="modal-close" onClick={() => setViewSubmissionsAssignment(null)}><Icon.X /></button>
              </div>
            </div>

            {submissionsLoading ? (
              <div className="loading-center" style={{ padding: '40px' }}>
                <div className="spinner spinner-lg" />
                <p className="text-muted" style={{ marginTop: '12px' }}>Loading submissions...</p>
              </div>
            ) : submissionsList.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <div className="empty-state-icon">📭</div>
                <h3>No submissions yet</h3>
                <p>No student has submitted work for this assignment yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {submissionsList.map(sub => {
                  const subId = sub._id;
                  const studentName = getStudentName(sub);
                  const submittedDate = sub.submittedAt ? new Date(sub.submittedAt).toLocaleString()
                    : sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'Unknown';
                  const isSubmitted = sub.status === 'submitted';
                  const isGraded = sub.teacherGrade !== null && sub.teacherGrade !== undefined;
                  const currentGrade = gradingState[subId] || { marks: isGraded ? sub.teacherGrade : '', feedback: sub.teacherFeedback || '' };
                  const maxMark = viewSubmissionsAssignment.maxScore || viewSubmissionsAssignment.maxMarks || 100;
                  return (
                    <div key={subId} className="card" style={{ background: 'var(--bg-secondary)', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>👤 {studentName}</strong>
                          <div className="text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>Submitted: {submittedDate}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span className={`badge ${isSubmitted ? 'badge-success' : 'badge-draft'}`}>{isSubmitted ? '✓ Submitted' : 'Draft'}</span>
                          {isGraded && <span className="badge badge-lecture">{sub.teacherGrade}/{maxMark}</span>}
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '14px', maxHeight: '160px', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {sub.content || sub.submissionText || '(No text submitted)'}
                      </div>

                      {isGraded && sub.teacherFeedback && (
                        <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: '12px', fontSize: '12.5px', color: 'var(--accent-emerald)' }}>
                          <strong>Previous Feedback:</strong> {sub.teacherFeedback}
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: '10px', alignItems: 'end' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Marks (out of {maxMark})</label>
                          <input id={`grade-marks-${subId}`} type="number" min="0" max={maxMark} className="form-control" placeholder={`0–${maxMark}`}
                            value={currentGrade.marks}
                            onChange={e => setGradingState(p => ({ ...p, [subId]: { ...currentGrade, marks: e.target.value } }))} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Feedback / Comments</label>
                          <input id={`grade-feedback-${subId}`} className="form-control" placeholder="e.g. Good work! Improve documentation..."
                            value={currentGrade.feedback}
                            onChange={e => setGradingState(p => ({ ...p, [subId]: { ...currentGrade, feedback: e.target.value } }))} />
                        </div>
                        <button id={`save-grade-${subId}`} className="btn btn-sm btn-primary" onClick={() => handleGradeSubmission(viewSubmissionsAssignment._id, subId)}>
                          {isGraded ? 'Update Grade' : 'Save Grade'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Create New Assignment</span>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><Icon.X /></button>
            </div>
            <form className="form" onSubmit={handleCreateAssignment}>
              <div className="form-group">
                <label>Assignment Title</label>
                <input id="assignment-create-title" className="form-control" placeholder="e.g. Distributed Consensus Systems" value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject / Course</label>
                  <input id="assignment-create-subject" className="form-control" placeholder="e.g. CS402" value={createForm.subject} onChange={e => setCreateForm(p => ({ ...p, subject: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Max Marks</label>
                  <input id="assignment-create-marks" type="number" className="form-control" value={createForm.maxMarks} onChange={e => setCreateForm(p => ({ ...p, maxMarks: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input id="assignment-create-due" type="date" className="form-control" value={createForm.dueDate} onChange={e => setCreateForm(p => ({ ...p, dueDate: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Description &amp; Instructions</label>
                <textarea id="assignment-create-desc" className="form-control" rows={3} placeholder="Details of the problem statement..." value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} required />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label>Grading Rubrics (Criteria students are evaluated on)</label>
                  <span style={{ fontSize: '11px', color: 'var(--text-accent)' }}>Used by AI Feedback Loop</span>
                </div>
                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  💡 <strong>What is a Rubric?</strong> A rubric specifies the grading criteria (one per line) that students must satisfy. Before submitting, students can test their draft against these rubrics with Gemini AI to catch missing points!
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-sm btn-secondary" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => setCreateForm(p => ({ ...p, rubricCriteria: 'Algorithm Correctness & Logic (40%)\nEdge Case Handling & Test Coverage (30%)\nCode Formatting & Documentation (30%)' }))}>+ Coding Rubric</button>
                  <button type="button" className="btn btn-sm btn-secondary" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => setCreateForm(p => ({ ...p, rubricCriteria: 'Depth of Research & Technical Accuracy (40%)\nStructure & Clarity of Arguments (30%)\nCitations & Professional Format (30%)' }))}>+ Report Rubric</button>
                  <button type="button" className="btn btn-sm btn-secondary" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => setCreateForm(p => ({ ...p, rubricCriteria: 'Implementation & Working Demo (50%)\nExperimental Analysis (30%)\nReport & Code Presentation (20%)' }))}>+ Lab Rubric</button>
                </div>
                <textarea id="assignment-create-rubrics" className="form-control" rows={4} placeholder={"One criterion per line, e.g.:\nAlgorithm Correctness (40%)\nEdge Case Handling (30%)\nDocumentation & Clean Code (30%)"} value={createForm.rubricCriteria} onChange={e => setCreateForm(p => ({ ...p, rubricCriteria: e.target.value }))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button id="submit-create-assignment" type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <><span className="spinner" /> Creating...</> : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
