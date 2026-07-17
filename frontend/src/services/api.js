const API_BASE = '/api'; // Use Vite proxy in development

async function request(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });

  if (!res.ok) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }

    console.error('API error:', {
      url: API_BASE + path,
      status: res.status,
      body,
    });

    const message =
      body?.message ||
      body?.detail ||
      body?.msg ||
      res.statusText ||
      'Request failed';

    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  if (res.status === 204) {
    return { success: true };
  }

  try {
    return await res.json();
  } catch {
    return { success: true };
  }
}

// --- Auth API ---

export function login(email, password, role, entityId) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, role, entityId }) });
}

export function signup(name, email, password) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function me() { return request('/auth/me'); }

export function forgotPassword(email, method = 'otp') {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email, method }),
  });
}

export function resetPassword({ email, newPassword, otp, resetToken }) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email,
      newPassword,
      otp,
      resetToken,
    }),
  });
}

export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

// --- Wellness API ---

/**
 * Fetches all health records from the backend.
 * @returns {Promise<Array<Object>>} A promise that resolves to the list of health records.
 */
export const fetchHealthRecords = () => request('/wellness/health-records');

/**
 * Adds a new health record via the backend.
 * @param {Object} newRecord The new health record to add.
 * @returns {Promise<Object>} A promise that resolves to the added record.
 */
export const addHealthRecord = (newRecord) => request('/wellness/health-records', {
    method: 'POST',
    body: JSON.stringify(newRecord),
});

/**
 * Updates an existing health record for a user via the backend.
 * @param {Object} updatedRecord The record with updated information.
 * @returns {Promise<Object>} A promise that resolves to the updated record.
 */
export const updateHealthRecord = (updatedRecord) => request(`/wellness/health-records/${updatedRecord.employeeId}`, {
    method: 'PUT',
    body: JSON.stringify(updatedRecord),
});

/**
 * Deletes a health record via the backend.
 * @param {string} employeeId The ID of the employee record to delete.
 * @returns {Promise<Object>} A promise that resolves on successful deletion.
 */
export const deleteHealthRecord = (employeeId) => request(`/wellness/health-records/${employeeId}`, { method: 'DELETE' });
// --- LocalStorage helpers for non-persistent prototype data ---
const getFromStorage = (key, defaultValue) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const saveToStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error saving to localStorage key “${key}”:`, error);
    }
};

export const fetchAllWellnessData = async () => ({
    risks: getFromStorage('wellness_risks', []),
    recommendations: getFromStorage('wellness_recommendations', []),
    sentiments: getFromStorage('wellness_sentiments', []),
});

export const saveRisks = (risksData) => saveToStorage('wellness_risks', risksData);

export const saveSentiments = (sentimentsData) => saveToStorage('wellness_sentiments', sentimentsData);

export default { login, signup, me, logout, forgotPassword, resetPassword, fetchHealthRecords, addHealthRecord, updateHealthRecord, deleteHealthRecord, fetchAllWellnessData, saveRisks, saveSentiments };
