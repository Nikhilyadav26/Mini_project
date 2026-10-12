// API Client — all fetch calls go through here
const BASE = '/api';

export function ensureArray(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.notices)) return res.notices;
  if (res && Array.isArray(res.events)) return res.events;
  if (res && Array.isArray(res.complaints)) return res.complaints;
  if (res && Array.isArray(res.assignments)) return res.assignments;
  if (res && Array.isArray(res.roadmaps)) return res.roadmaps;
  if (res && Array.isArray(res.opportunities)) return res.opportunities;
  if (res && Array.isArray(res.applications)) return res.applications;
  return [];
}

function getToken() {
  return localStorage.getItem('cc_token');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  // Seamless unwrapping of standard { success: true, message: '...', data: [...] or {...} }
  if (data && typeof data === 'object' && data.data !== undefined) {
    if (Array.isArray(data.data)) {
      const arr = [...data.data];
      arr.data = data.data;
      arr.success = data.success;
      arr.message = data.message;
      return arr;
    }
    if (typeof data.data === 'object' && data.data !== null) {
      return { ...data, ...data.data };
    }
  }
  return data;
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path)        => request('DELETE', path),
};

// ---- AUTH ----
export const authApi = {
  register: (body) => api.post('/auth/register', body),
  login:    (body) => api.post('/auth/login', body),
  me:       ()     => api.get('/auth/me'),
};

// ---- NOTICES ----
export const noticeApi = {
  list:    ()     => api.get('/notices'),
  get:     (id)   => api.get(`/notices/${id}`),
  create:  (body) => api.post('/notices', body),
  update:  (id, body) => api.put(`/notices/${id}`, body),
  delete:  (id)   => api.delete(`/notices/${id}`),
  publish: (id)  => api.patch(`/notices/${id}/publish`),
  rewrite: (rawText) => api.post('/ai/rewrite-notice', { rawText }),
};

// ---- AI SERVICES ----
export const aiApi = {
  rewriteNotice: (rawText) => api.post('/ai/rewrite-notice', { rawText }),
};

// ---- EVENTS ----
export const eventApi = {
  list:     ()     => api.get('/events'),
  get:      (id)   => api.get(`/events/${id}`),
  create:   (body) => api.post('/events', body),
  update:   (id, body) => api.put(`/events/${id}`, body),
  delete:   (id)   => api.delete(`/events/${id}`),
  register: (id)   => api.post(`/events/${id}/register`),
};

// ---- OPPORTUNITIES ----
export const opportunityApi = {
  list:   ()          => api.get('/opportunities'),
  create: (body)      => api.post('/opportunities', body),
};

// ---- APPLICATIONS ----
export const applicationApi = {
  apply:  (body)      => api.post('/applications', body),
  mine:   ()          => api.get('/applications/mine'),
  updateStatus: (id, body) => api.patch(`/applications/${id}/status`, body),
};

// ---- PREPARATION ENGINE (AI) ----
export const prepApi = {
  quiz:           (body) => api.post('/prep/quiz', body),
  mockInterview:  (body) => api.post('/prep/mock-interview', body),
  skillGap:       (body) => api.post('/prep/skill-gap', body),
};

// ---- ANNOUNCEMENTS ----
export const announcementApi = {
  list:   ()     => api.get('/announcements'),
  create: (body) => api.post('/announcements', body),
  delete: (id)   => api.delete(`/announcements/${id}`),
};

// ---- COMPLAINTS ----
export const complaintApi = {
  list:    ()                      => api.get('/complaints'),
  get:     (id)                    => api.get(`/complaints/${id}`),
  create:  (body)                  => api.post('/complaints', body),
  resolve: (id, teacherResponse)   => api.patch(`/complaints/${id}/status`, { status: 'resolved', teacherResponse }),
};

// ---- ASSIGNMENTS ----
export const assignmentApi = {
  list:    ()         => api.get('/assignments'),
  get:     (id)       => api.get(`/assignments/${id}`),
  create:  (body)     => api.post('/assignments', body),
  update:  (id, body) => api.put(`/assignments/${id}`, body),
  delete:  (id)       => api.delete(`/assignments/${id}`),
  submit:  (id, body) => api.post(`/assignments/${id}/submit`, body),
  feedback: (id, body) => api.post(`/assignments/${id}/ai-feedback`, body),
  grade:   (id, subId, body) => api.patch(`/assignments/${id}/submissions/${subId}/grade`, body),
  submissions: (id)   => api.get(`/assignments/${id}/submissions`),
};

// ---- ROADMAP ----
export const roadmapApi = {
  list:         ()                 => api.get('/roadmaps'),
  get:          (id)               => api.get(`/roadmaps/${id}`),
  generate:     (body)             => api.post('/roadmaps/generate', body),
  save:         (body)             => api.post('/roadmaps', body),
  updateStatus: (id, classNum, body) => api.patch(`/roadmaps/${id}/sessions/${classNum}`, body),
  reschedule:   (id, body)         => api.post(`/roadmaps/${id}/reschedule`, body),
};
