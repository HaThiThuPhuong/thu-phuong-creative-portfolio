
// SQLite-only API service
// Removed Firebase logic to prevent Quota Exceeded errors

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function sanitizeData(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const sanitized: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      sanitized[key] = sanitizeData(data[key]);
    }
  });
  return sanitized;
}

function getTimestampInSeconds(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val > 9999999999 ? val / 1000 : val;
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.getTime() / 1000;
  }
  return 0;
}

// Caching Helpers
const CACHE_PREFIX = 'fw_sqlite_cache_';
const DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

function getCache(key: string, allowStale = false) {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    const { data, expiry } = JSON.parse(cached);
    if (!allowStale && Date.now() > expiry) {
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

function setCache(key: string, data: any, expiryMs = DEFAULT_EXPIRY) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      expiry: Date.now() + expiryMs
    }));
  } catch (e) {}
}

function clearCache(keyPrefix?: string) {
  try {
    if (!keyPrefix) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) localStorage.removeItem(key);
      });
      return;
    }
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX + keyPrefix)) localStorage.removeItem(key);
    });
  } catch (e) {}
}

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  const headers: any = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = token;
  }

  try {
    const res = await fetch(path, { ...options, headers });
    if (!res.ok) {
      if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('auth_token');
      }
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Request failed');
    }
    return await res.json();
  } catch (err) {
    // Only log if it's not a common auth failure
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('Not logged in') && !msg.includes('Vui lòng đăng nhập')) {
      console.error(`API Request failed for ${path}:`, err);
    }
    throw err;
  }
}

export async function login(password: string) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (data.token) {
    localStorage.setItem('auth_token', data.token);
  }
  return data;
}

export async function logout() {
  localStorage.removeItem('auth_token');
  return { success: true };
}

export async function getMe() {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    return await request('/api/auth/me');
  } catch (e) {
    return null;
  }
}

export async function fetchProfile() {
  const cacheKey = 'profile';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const data = await request('/api/profile');
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    return getCache(cacheKey, true) || {};
  }
}

export async function saveProfile(data: any) {
  const updatedAt = new Date().toISOString();
  const res = await request('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...sanitizeData(data), updatedAt })
  });
  clearCache('profile');
  return res;
}

export async function fetchAssets(type?: string) {
  const cacheKey = `assets_${type || 'all'}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const apiPath = `/api/assets${type ? `?type=${encodeURIComponent(type)}` : ''}`;
    const data = await request(apiPath);
    const sorted = data.sort((a: any, b: any) => {
      const timeA = getTimestampInSeconds(a.createdAt || a.updatedAt);
      const timeB = getTimestampInSeconds(b.createdAt || b.updatedAt);
      return timeB - timeA;
    });
    setCache(cacheKey, sorted);
    return sorted;
  } catch (err) {
    return getCache(cacheKey, true) || [];
  }
}

export async function saveAsset(data: any) {
  const updatedAt = new Date().toISOString();
  const sanitized = sanitizeData(data);
  const path = sanitized.id ? `/api/assets/${sanitized.id}` : '/api/assets';
  const method = sanitized.id ? 'PUT' : 'POST';
  
  const res = await request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...sanitized, updatedAt })
  });
  clearCache('assets');
  return res;
}

export async function deleteAsset(id: string) {
  const res = await request(`/api/assets/${id}`, { method: 'DELETE' });
  clearCache('assets');
  return res;
}

export async function fetchServices(mode?: 'model' | 'ba') {
  const cacheKey = `services_${mode || 'all'}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const apiPath = `/api/services${mode ? `?mode=${encodeURIComponent(mode)}` : ''}`;
    const data = await request(apiPath);
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    return getCache(cacheKey, true) || [];
  }
}

export async function saveService(data: any) {
  const updatedAt = new Date().toISOString();
  const sanitized = sanitizeData(data);
  const path = sanitized.id ? `/api/services/${sanitized.id}` : '/api/services';
  const method = sanitized.id ? 'PUT' : 'POST';
  
  const res = await request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...sanitized, updatedAt })
  });
  clearCache('services');
  return res;
}

export async function deleteService(id: string) {
  const res = await request(`/api/services/${id}`, { method: 'DELETE' });
  clearCache('services');
  return res;
}

export async function fetchMilestones(mode?: 'model' | 'ba') {
  const cacheKey = `milestones_${mode || 'all'}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const apiPath = `/api/milestones${mode ? `?mode=${encodeURIComponent(mode)}` : ''}`;
    const data = await request(apiPath);
    const sorted = data.sort((a: any, b: any) => (b.year || 0) - (a.year || 0));
    setCache(cacheKey, sorted);
    return sorted;
  } catch (err) {
    return getCache(cacheKey, true) || [];
  }
}

export async function saveMilestone(data: any) {
  const updatedAt = new Date().toISOString();
  const sanitized = sanitizeData(data);
  const path = sanitized.id ? `/api/milestones/${sanitized.id}` : '/api/milestones';
  const method = sanitized.id ? 'PUT' : 'POST';

  const res = await request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...sanitized, updatedAt })
  });
  clearCache('milestones');
  return res;
}

export async function deleteMilestone(id: string) {
  const res = await request(`/api/milestones/${id}`, { method: 'DELETE' });
  clearCache('milestones');
  return res;
}

export async function fetchBAProjects() {
  const cacheKey = 'ba_projects';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const data = await request('/api/ba-projects');
    const sorted = data.sort((a: any, b: any) => {
      const timeA = getTimestampInSeconds(a.createdAt || a.updatedAt);
      const timeB = getTimestampInSeconds(b.createdAt || b.updatedAt);
      return timeB - timeA;
    });
    setCache(cacheKey, sorted);
    return sorted;
  } catch (err) {
    return getCache(cacheKey, true) || [];
  }
}

export async function saveBAProject(data: any) {
  const updatedAt = new Date().toISOString();
  const sanitized = sanitizeData(data);
  const path = sanitized.id ? `/api/ba-projects/${sanitized.id}` : '/api/ba-projects';
  const method = sanitized.id ? 'PUT' : 'POST';

  const res = await request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...sanitized, updatedAt })
  });
  clearCache('ba_projects');
  return res;
}

export async function deleteBAProject(id: string) {
  const res = await request(`/api/ba-projects/${id}`, { method: 'DELETE' });
  clearCache('ba_projects');
  return res;
}

export async function fetchLifeHobbies() {
  const cacheKey = 'life_hobbies';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const data = await request('/api/life-hobbies');
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    return getCache(cacheKey, true) || [];
  }
}

export async function saveLifeHobby(data: any) {
  const updatedAt = new Date().toISOString();
  const sanitized = sanitizeData(data);
  const path = sanitized.id ? `/api/life-hobbies/${sanitized.id}` : '/api/life-hobbies';
  const method = sanitized.id ? 'PUT' : 'POST';

  const res = await request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...sanitized, updatedAt })
  });
  clearCache('life_hobbies');
  return res;
}

export async function deleteLifeHobby(id: string) {
  const res = await request(`/api/life-hobbies/${id}`, { method: 'DELETE' });
  clearCache('life_hobbies');
  return res;
}

export async function fetchCalendar() {
  const cacheKey = 'calendar';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const data = await request('/api/calendar');
    const sorted = data.sort((a: any, b: any) => (a.date_str || '').localeCompare(b.date_str || ''));
    setCache(cacheKey, sorted);
    return sorted;
  } catch (err) {
    return getCache(cacheKey, true) || [];
  }
}

export async function saveCalendar(data: any) {
  const updatedAt = new Date().toISOString();
  const sanitized = sanitizeData(data);
  const path = sanitized.id ? `/api/calendar/${sanitized.id}` : '/api/calendar';
  const method = sanitized.id ? 'PUT' : 'POST';

  const res = await request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...sanitized, updatedAt })
  });
  clearCache('calendar');
  return res;
}

// Dummy sync function to prevent breakage if called from UI
export async function syncMirrorToCloud() {
  console.log('Firebase is disabled. No sync needed.');
  return { success: true };
}
