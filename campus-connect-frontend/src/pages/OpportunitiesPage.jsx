import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { opportunityApi, applicationApi, prepApi, ensureArray } from '../api';
import { Icon } from '../components/Sidebar';

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const toast = useToast();

  const [opportunities, setOpportunities] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drives'); // 'drives' | 'my-apps'

  // Teacher Create Drive Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    company: '',
    role: '',
    description: '',
    eligibility: 'B.Tech CSE/IT with CGPA >= 7.0, 2026 Batch',
    packageOrStipend: '12 LPA',
    deadline: '2026-11-30',
    applicationLink: 'https://careers.google.com/jobs',
  });

  // Student Apply Modal
  const [applyModalOpp, setApplyModalOpp] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyForm, setApplyForm] = useState({ resumeUrl: '', notes: '' });

  // AI Prep Engine Modal (Signature Feature 2)
  const [prepModalOpp, setPrepModalOpp] = useState(null);
  const [prepType, setPrepType] = useState('quiz'); // 'quiz' | 'interview' | 'skillgap'
  const [prepLoading, setPrepLoading] = useState(false);

  // Prep Results
  const [quizData, setQuizData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [interviewData, setInterviewData] = useState(null);
  const [skillGapData, setSkillGapData] = useState(null);
  const [studentSkillsInput, setStudentSkillsInput] = useState('JavaScript, React, Node.js, SQL');

  async function loadData() {
    setLoading(true);
    try {
      const oppRes = await opportunityApi.list();
      setOpportunities(ensureArray(oppRes));

      if (!isTeacher) {
        try {
          const appRes = await applicationApi.mine();
          setMyApplications(ensureArray(appRes));
        } catch (_) {}
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load placement opportunities');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateOpportunity(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        company: createForm.company.trim(),
        role: createForm.role.trim(),
        description: createForm.description.trim(),
        eligibility: createForm.eligibility.trim(),
        packageOrStipend: createForm.packageOrStipend.trim(),
        deadline: new Date(createForm.deadline).toISOString(),
        applicationLink: createForm.applicationLink.trim() || 'https://careers.company.com',
      };
      await opportunityApi.create(payload);
      toast.success('Placement opportunity posted successfully!');
      setShowCreateModal(false);
      setCreateForm({
        company: '',
        role: '',
        description: '',
        eligibility: 'B.Tech CSE/IT with CGPA >= 7.0, 2026 Batch',
        packageOrStipend: '12 LPA',
        deadline: '2026-11-30',
        applicationLink: 'https://careers.google.com/jobs',
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create drive');
    } finally {
      setCreating(false);
    }
  }

  async function handleApply(e) {
    e.preventDefault();
    setApplying(true);
    try {
      await applicationApi.apply({
        opportunityId: applyModalOpp._id,
        resumeUrl: applyForm.resumeUrl || 'https://drive.google.com/resume-sample',
        notes: applyForm.notes,
      });
      toast.success(`Successfully applied to ${applyModalOpp.company}!`);
      setApplyModalOpp(null);
      setApplyForm({ resumeUrl: '', notes: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Application failed');
    } finally {
      setApplying(false);
    }
  }

  // AI Prep Trigger
  async function generatePrep(type, opp = prepModalOpp) {
    if (!opp) return;
    setPrepLoading(true);
    try {
      if (type === 'quiz') {
        const res = await prepApi.quiz({
          opportunityId: opp._id,
          company: opp.company,
          role: opp.role,
          description: opp.description,
          numberOfQuestions: 5,
        });
        setQuizData(res.quiz || res.questions || res);
        setSelectedAnswers({});
      } else if (type === 'interview') {
        const res = await prepApi.mockInterview({
          opportunityId: opp._id,
          company: opp.company,
          role: opp.role,
          description: opp.description,
          level: 'entry',
        });
        setInterviewData(res.interviewRounds || res.questions || res.interview || res);
      } else if (type === 'skillgap') {
        const skills = studentSkillsInput.split(',').map(s => s.trim()).filter(Boolean);
        const res = await prepApi.skillGap({
          opportunityId: opp._id,
          company: opp.company,
          role: opp.role,
          description: opp.description,
          studentSkills: skills,
        });
        setSkillGapData(res.report || res);
      }
      toast.success(`Generated AI ${type} prep for ${opp.role}!`);
    } catch (err) {
      toast.error(err.message || `Failed to generate AI ${type}`);
    } finally {
      setPrepLoading(false);
    }
  }

  function openPrepModal(opp) {
    setPrepModalOpp(opp);
    setPrepType('quiz');
    setQuizData(null);
    setInterviewData(null);
    setSkillGapData(null);
    generatePrep('quiz', opp);
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Placement-to-Preparation Engine</h1>
          <p>
            {isTeacher
              ? 'Publish drives and oversee campus placement pipelines'
              : 'Discover campus drives and launch AI practice quizzes, mock interviews & skill-gap reports'}
          </p>
        </div>
        {isTeacher && (
          <button
            id="create-opp-btn"
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Icon.Plus /> Post Placement Drive
          </button>
        )}
      </div>

      {!isTeacher && (
        <div className="tabs">
          <button
            id="tab-all-drives"
            className={`tab-btn ${activeTab === 'drives' ? 'active' : ''}`}
            onClick={() => setActiveTab('drives')}
          >
            🏢 Available Drives ({opportunities.length})
          </button>
          <button
            id="tab-my-apps"
            className={`tab-btn ${activeTab === 'my-apps' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-apps')}
          >
            📋 My Applications ({myApplications.length})
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : activeTab === 'my-apps' && !isTeacher ? (
        /* My Applications Tab */
        myApplications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💼</div>
            <h3>No applications submitted yet</h3>
            <p>Browse available drives to apply.</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company & Role</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {myApplications.map(app => {
                  const compName = app.opportunity?.company || 'Company';
                  const roleName = app.opportunity?.role || 'Role';
                  return (
                    <tr key={app._id}>
                      <td>
                        <strong>{compName}</strong>
                        <div className="text-muted" style={{ fontSize: '12px' }}>{roleName}</div>
                      </td>
                      <td>{new Date(app.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${app.status || 'applied'}`}>
                          {app.status || 'applied'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {app.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Available Drives Grid */
        opportunities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💼</div>
            <h3>No active placement drives</h3>
            <p>{isTeacher ? 'Click "Post Placement Drive" to add one!' : 'Check back later for new recruitments.'}</p>
          </div>
        ) : (
          <div className="card-grid card-grid-2">
            {opportunities.map(opp => {
              const applied = myApplications.some(a => a.opportunityId === opp._id || a.opportunity?._id === opp._id);
              return (
                <div key={opp._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <span className="opp-company" style={{ fontSize: '14px', fontWeight: '800' }}>
                        {opp.company}
                      </span>
                      <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                        {opp.role}
                      </h3>
                    </div>
                    <span className="badge badge-published">{opp.type || 'Full-Time'}</span>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.6', margin: '10px 0', flex: 1 }}>
                    {opp.description}
                  </p>

                  <div className="opp-meta" style={{ margin: '8px 0 14px' }}>
                    {(opp.packageOrStipend || opp.packageDetails) && (
                      <span className="opp-meta-item">
                        <Icon.DollarSign /> <strong>{opp.packageOrStipend || opp.packageDetails}</strong>
                      </span>
                    )}
                    {opp.eligibility && (
                      <span className="opp-meta-item">
                        <Icon.Award /> {typeof opp.eligibility === 'string' ? opp.eligibility : `Min ${opp.eligibility?.minCgpa || 7.0} CGPA`}
                      </span>
                    )}
                    {opp.deadline && (
                      <span className="opp-meta-item">
                        <Icon.Clock /> Due {new Date(opp.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', marginTop: 'auto', flexWrap: 'wrap' }}>
                    <button
                      id={`prep-btn-${opp._id}`}
                      className="btn btn-sm btn-ai"
                      onClick={() => openPrepModal(opp)}
                    >
                      <Icon.Sparkles /> AI Prep Engine
                    </button>

                    {!isTeacher && (
                      applied ? (
                        <span className="badge badge-applied" style={{ alignSelf: 'center', marginLeft: 'auto' }}>
                          ✓ Applied
                        </span>
                      ) : (
                        <button
                          id={`apply-btn-${opp._id}`}
                          className="btn btn-sm btn-primary"
                          style={{ marginLeft: 'auto' }}
                          onClick={() => setApplyModalOpp(opp)}
                        >
                          Apply Now
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* AI PREPARATION ENGINE MODAL (SIGNATURE FEATURE 2) */}
      {prepModalOpp && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <span className="modal-title">
                  ✦ AI Placement Preparation: {prepModalOpp.role} ({prepModalOpp.company})
                </span>
                <p className="text-muted" style={{ fontSize: '12.5px', marginTop: '2px' }}>
                  Signature Feature: Tailored AI quizzes, mock interview questions, and skill-gap diagnostics.
                </p>
              </div>
              <button className="modal-close" onClick={() => setPrepModalOpp(null)}><Icon.X /></button>
            </div>

            {/* Prep Sub-tabs */}
            <div className="tabs" style={{ marginBottom: '18px' }}>
              <button
                id="subtab-quiz"
                className={`tab-btn ${prepType === 'quiz' ? 'active' : ''}`}
                onClick={() => { setPrepType('quiz'); if (!quizData) generatePrep('quiz'); }}
              >
                🎯 Practice Quiz
              </button>
              <button
                id="subtab-interview"
                className={`tab-btn ${prepType === 'interview' ? 'active' : ''}`}
                onClick={() => { setPrepType('interview'); if (!interviewData) generatePrep('interview'); }}
              >
                🎙️ Mock Interview
              </button>
              <button
                id="subtab-skillgap"
                className={`tab-btn ${prepType === 'skillgap' ? 'active' : ''}`}
                onClick={() => { setPrepType('skillgap'); if (!skillGapData) generatePrep('skillgap'); }}
              >
                ⚡ Skill-Gap Report
              </button>
            </div>

            {prepLoading ? (
              <div className="loading-center">
                <div className="spinner spinner-lg" />
                <p>Gemini is synthesizing role-specific preparation materials...</p>
              </div>
            ) : prepType === 'quiz' ? (
              /* QUIZ VIEW */
              <div>
                {quizData ? (
                  <div>
                    {(Array.isArray(quizData) ? quizData : quizData.questions || []).map((q, qIdx) => {
                      const userChoice = selectedAnswers[qIdx];
                      const isAnswered = userChoice !== undefined;
                      const correctIdx = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : q.correctIndex !== undefined ? q.correctIndex : q.answer;

                      return (
                        <div key={qIdx} className="quiz-card">
                          <div className="quiz-question">
                            Q{qIdx + 1}: {q.question}
                          </div>
                          <div className="quiz-options">
                            {(q.options || []).map((opt, oIdx) => {
                              let optionClass = '';
                              if (isAnswered) {
                                if (oIdx === correctIdx) optionClass = 'correct';
                                else if (userChoice === oIdx) optionClass = 'incorrect';
                              }
                              return (
                                <button
                                  key={oIdx}
                                  className={`quiz-option ${optionClass}`}
                                  onClick={() => setSelectedAnswers(p => ({ ...p, [qIdx]: oIdx }))}
                                >
                                  {String.fromCharCode(65 + oIdx)}. {opt}
                                </button>
                              );
                            })}
                          </div>
                          {isAnswered && q.explanation && (
                            <div style={{ marginTop: '10px', fontSize: '12.5px', color: 'var(--text-secondary)', background: 'var(--bg-glass)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                              💡 <strong>Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <button className="btn btn-ai" onClick={() => generatePrep('quiz')}>Generate Practice Quiz</button>
                )}
              </div>
            ) : prepType === 'interview' ? (
              /* MOCK INTERVIEW VIEW */
              <div>
                {interviewData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {(Array.isArray(interviewData) ? interviewData : interviewData.interviewRounds || interviewData.questions || []).map((item, idx) => (
                      <div key={idx} className="quiz-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className="badge badge-draft">{item.category || item.type || 'Technical'}</span>
                          {item.difficulty && <span className="badge badge-draft">{item.difficulty}</span>}
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '14.5px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                          {idx + 1}. {item.question}
                        </div>
                        {(item.evaluationCriteria || item.guidance) && (
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-glass)', padding: '10px', borderRadius: 'var(--radius-sm)', lineHeight: '1.6' }}>
                            🎯 <strong>What interviewers look for:</strong> {item.evaluationCriteria || item.guidance}
                          </div>
                        )}
                        {(item.sampleAnswerPoints || item.sampleKeyPoints) && (
                          <div style={{ fontSize: '12.5px', color: 'var(--accent-cyan)', marginTop: '6px' }}>
                            🔑 <strong>Key points to hit:</strong> {Array.isArray(item.sampleAnswerPoints || item.sampleKeyPoints) ? (item.sampleAnswerPoints || item.sampleKeyPoints).join(', ') : (item.sampleAnswerPoints || item.sampleKeyPoints)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <button className="btn btn-ai" onClick={() => generatePrep('interview')}>Generate Mock Questions</button>
                )}
              </div>
            ) : (
              /* SKILL-GAP VIEW */
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                    Your Current Technical Skills (comma-separated):
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      id="student-skills-input"
                      className="form-control"
                      value={studentSkillsInput}
                      onChange={e => setStudentSkillsInput(e.target.value)}
                    />
                    <button
                      id="calc-skillgap-btn"
                      className="btn btn-ai"
                      onClick={() => generatePrep('skillgap')}
                    >
                      Analyze Gap
                    </button>
                  </div>
                </div>

                {skillGapData && (
                  <div className="ai-result">
                    <div className="match-ring-container">
                      <div className="match-ring">
                        {skillGapData.matchPercentage || skillGapData.matchScore || 75}%
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          Job Description Alignment Score
                        </h3>
                        <p className="text-muted" style={{ fontSize: '13px' }}>
                          Calculated based on required skills for {prepModalOpp.role}
                        </p>
                      </div>
                    </div>

                    {skillGapData.matchedSkills && (
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{ color: 'var(--accent-emerald)', fontSize: '13.5px' }}>✓ Matching Strengths</h4>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {(Array.isArray(skillGapData.matchedSkills) ? skillGapData.matchedSkills : [skillGapData.matchedSkills]).map((s, i) => (
                            <span key={i} className="badge badge-published">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {skillGapData.missingSkills && (
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{ color: 'var(--accent-rose)', fontSize: '13.5px' }}>⚠️ Missing / Recommended Skills</h4>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {(Array.isArray(skillGapData.missingSkills) ? skillGapData.missingSkills : [skillGapData.missingSkills]).map((s, i) => (
                            <span key={i} className="badge badge-rejected">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {skillGapData.recommendations && (
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{ color: 'var(--accent-cyan)', fontSize: '13.5px' }}>📚 High-Yield Action Plan</h4>
                        <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginTop: '4px', paddingLeft: '18px' }}>
                          {(Array.isArray(skillGapData.recommendations) ? skillGapData.recommendations : [skillGapData.recommendations]).map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {skillGapData.preparationRoadmap && (
                      <div>
                        <h4 style={{ color: 'var(--text-primary)', fontSize: '13.5px', marginBottom: '6px' }}>🗓️ Step-by-Step Preparation Roadmap</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(Array.isArray(skillGapData.preparationRoadmap) ? skillGapData.preparationRoadmap : [skillGapData.preparationRoadmap]).map((step, i) => (
                            <div key={i} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                              📌 {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDENT APPLY MODAL */}
      {applyModalOpp && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Apply to {applyModalOpp.company}</span>
              <button className="modal-close" onClick={() => setApplyModalOpp(null)}><Icon.X /></button>
            </div>
            <form className="form" onSubmit={handleApply}>
              <div className="form-group">
                <label>Role</label>
                <input className="form-control" value={applyModalOpp.role} disabled />
              </div>
              <div className="form-group">
                <label>Resume Link / Portfolio</label>
                <input
                  id="apply-resume-url"
                  className="form-control"
                  placeholder="https://drive.google.com/your-resume.pdf"
                  value={applyForm.resumeUrl}
                  onChange={e => setApplyForm(p => ({ ...p, resumeUrl: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Candidate Cover Note (optional)</label>
                <textarea
                  id="apply-notes"
                  className="form-control"
                  rows={3}
                  placeholder="Why are you a great match for this position?"
                  value={applyForm.notes}
                  onChange={e => setApplyForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setApplyModalOpp(null)}>Cancel</button>
                <button id="submit-app-btn" type="submit" className="btn btn-primary" disabled={applying}>
                  {applying ? <><span className="spinner" /> Submitting Application...</> : 'Confirm Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER CREATE DRIVE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">Post New Placement / Internship Drive</span>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><Icon.X /></button>
            </div>
            <form className="form" onSubmit={handleCreateOpportunity}>
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    id="opp-company-input"
                    className="form-control"
                    placeholder="e.g. Google, Microsoft, Adobe"
                    value={createForm.company}
                    onChange={e => setCreateForm(p => ({ ...p, company: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role / Position</label>
                  <input
                    id="opp-role-input"
                    className="form-control"
                    placeholder="e.g. Software Development Engineer I"
                    value={createForm.role}
                    onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Package / Stipend</label>
                  <input
                    id="opp-package-input"
                    className="form-control"
                    placeholder="e.g. 14 LPA or ₹50,000/month"
                    value={createForm.packageOrStipend}
                    onChange={e => setCreateForm(p => ({ ...p, packageOrStipend: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Application Deadline</label>
                  <input
                    id="opp-deadline-input"
                    type="date"
                    className="form-control"
                    value={createForm.deadline}
                    onChange={e => setCreateForm(p => ({ ...p, deadline: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Eligibility Criteria (Text description of branch, CGPA, batch)</label>
                <input
                  id="opp-eligibility-input"
                  className="form-control"
                  placeholder="e.g. B.Tech CSE/IT with CGPA >= 7.0, 2026 Batch"
                  value={createForm.eligibility}
                  onChange={e => setCreateForm(p => ({ ...p, eligibility: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Application / Career Portal Link</label>
                <input
                  id="opp-link-input"
                  className="form-control"
                  placeholder="e.g. https://careers.company.com/apply or Internal"
                  value={createForm.applicationLink}
                  onChange={e => setCreateForm(p => ({ ...p, applicationLink: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Job Description & Requirements</label>
                <textarea
                  id="opp-desc-input"
                  className="form-control"
                  rows={4}
                  placeholder="Paste details of tech stack, requirements, and job responsibilities. AI uses this for preparation!"
                  value={createForm.description}
                  onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button id="submit-create-opp" type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <><span className="spinner" /> Publishing...</> : 'Publish Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
