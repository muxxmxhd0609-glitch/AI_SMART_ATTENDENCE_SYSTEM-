// RGIT AI Smart Attendance - Unified API Service Layer

// Smart dynamic resolution of API base URL for Web, Mobile, and Android Emulator/Capacitor
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('rgit_api_base');
    if (custom) return custom.replace(/\/+$/, '');
    
    // Check if running inside Capacitor Android or native mobile container
    const isCapacitor = window.Capacitor?.isNativePlatform?.() || 
                        window.location.protocol === 'capacitor:' || 
                        window.location.protocol === 'file:';
    if (isCapacitor) {
      const host = window.location.hostname && window.location.hostname !== 'localhost'
        ? window.location.hostname
        : '10.0.2.2';
      return `http://${host}:8000/api`;
    }
  }
  return '/api';
};

const API_BASE = getApiBaseUrl();
export const API_BASE_URL = API_BASE;

// Retrieve or generate persistent device hardware UUID (Anti-proxy binding)
export const getDeviceUUID = () => {
  let uuid = localStorage.getItem('rgit_device_uuid');
  if (!uuid) {
    uuid = 'DEV_' + Math.random().toString(36).substring(2, 10).toUpperCase() + '_' + Date.now().toString(36).toUpperCase();
    localStorage.setItem('rgit_device_uuid', uuid);
  }
  return uuid;
};

// Auth Token management
export const getAuthToken = () => localStorage.getItem('rgit_auth_token');
export const setAuthToken = (token) => localStorage.setItem('rgit_auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('rgit_auth_token');

export const getCurrentUser = () => {
  const user = localStorage.getItem('rgit_user_data');
  return user ? JSON.parse(user) : null;
};
export const setCurrentUser = (user) => localStorage.setItem('rgit_user_data', JSON.stringify(user));
export const removeCurrentUser = () => localStorage.removeItem('rgit_user_data');

// Base fetch wrapper with auth header & session guard
async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    removeAuthToken();
    removeCurrentUser();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rgit_session_expired'));
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // 1. Auth Endpoints
  async login(username, password, isStudent = false, department = null, semester = null) {
    const deviceUuid = getDeviceUUID();
    const payload = {
      username,
      device_uuid: deviceUuid,
      is_student: isStudent,
      department: department,
      semester: semester ? parseInt(semester, 10) : null
    };
    if (password !== undefined && password !== null) {
      payload.password = password;
    }
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (department) data.department = department;
    if (semester) {
      data.semester = parseInt(semester, 10);
      data.selected_semester = parseInt(semester, 10);
    }
    setAuthToken(data.access_token);
    setCurrentUser(data);
    return data;
  },

  async studentLogin(usn, password = null, department = null, semester = null) {
    const deviceUuid = getDeviceUUID();
    const payload = {
      usn,
      device_uuid: deviceUuid,
      department: department,
      semester: semester ? parseInt(semester, 10) : null
    };
    if (password) {
      payload.password = password;
    }
    const data = await request('/auth/student-login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (department) data.department = department;
    if (semester) {
      data.semester = parseInt(semester, 10);
      data.selected_semester = parseInt(semester, 10);
    }
    setAuthToken(data.access_token);
    setCurrentUser(data);
    return data;
  },

  async adminLogin(username, password) {
    const data = await request('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password
      })
    });
    setAuthToken(data.access_token);
    setCurrentUser(data);
    return data;
  },

  async resetStudentPassword(payload) {
    return request('/auth/student/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  setCurrentUser(user) {
    setCurrentUser(user);
  },

  setStoredUser(user) {
    setCurrentUser(user);
  },

  getStoredUser() {
    return getCurrentUser();
  },

  async getMe() {
    return request('/auth/me');
  },

  logout() {
    removeAuthToken();
    removeCurrentUser();
  },

  // 2. Geofence Endpoints
  async checkGeofence(lat, lon, accuracy = 10, isMock = false) {
    const params = new URLSearchParams();
    if (lat !== undefined && lat !== null) params.append('lat', lat);
    if (lon !== undefined && lon !== null) params.append('lon', lon);
    if (accuracy !== undefined && accuracy !== null) params.append('accuracy', accuracy);
    if (isMock) params.append('is_mock', 'true');
    return request(`/geofence/status?${params.toString()}`);
  },

  async updateGeofence(radiusMeters, enforceGeofence = true) {
    return request('/geofence/update', {
      method: 'POST',
      body: JSON.stringify({
        radius_meters: parseFloat(radiusMeters),
        enforce_geofence: enforceGeofence
      })
    });
  },

  // 3. Timetable & Sessions
  async getCurrentTimetable(department = null, semester = null, section = null) {
    const user = getCurrentUser();
    const resolvedDept = department || user?.department || null;
    const resolvedSem = semester || user?.semester || user?.selected_semester || null;
    const resolvedSec = section || user?.section || null;

    const params = new URLSearchParams();
    if (resolvedDept) params.append('department', resolvedDept);
    if (resolvedSem) params.append('semester', resolvedSem);
    if (resolvedSec) params.append('section', resolvedSec);
    const qs = params.toString();
    return request(`/timetable/current${qs ? '?' + qs : ''}`);
  },

  async getTimetableMatrix(department = 'CSE', semester = 7, section = 'A', dayOfWeek = 'Monday') {
    const params = new URLSearchParams({
      department,
      semester: String(semester),
      section,
      day_of_week: dayOfWeek
    });
    return request(`/timetable/matrix?${params.toString()}`);
  },

  async setTimetableEntry(entryData) {
    return request('/timetable/set', {
      method: 'POST',
      body: JSON.stringify(entryData)
    });
  },

  async saveTimetableMatrix(payload) {
    return request('/timetable/save-matrix', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async deleteTimetableEntry(entryId) {
    return request(`/timetable/entry/${entryId}`, {
      method: 'DELETE'
    });
  },

  async resetTimetable(department = 'CSE', semester = 7, section = 'A', dayOfWeek = null) {
    const params = new URLSearchParams({
      department,
      semester: String(semester),
      section
    });
    if (dayOfWeek) params.append('day_of_week', dayOfWeek);
    return request(`/timetable/reset?${params.toString()}`, {
      method: 'POST'
    });
  },

  async startClassSession(subjectCode, section, periodNumber, durationMinutes = 10) {
    return request('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({
        subject_code: subjectCode,
        section,
        period_number: parseInt(periodNumber),
        duration_minutes: parseInt(durationMinutes)
      })
    });
  },

  async getActiveSession(section, subjectCode) {
    const params = new URLSearchParams();
    if (section) params.append('section', section);
    if (subjectCode) params.append('subject_code', subjectCode);
    return request(`/sessions/active?${params.toString()}`);
  },

  async endClassSession(sessionId) {
    return request(`/sessions/end/${sessionId}`, {
      method: 'POST'
    });
  },

  // 4. Biometric Attendance Marking
  async markAttendance({
    latitude,
    longitude,
    accuracyMeters = 10.0,
    isMockLocation = false,
    imageBase64,
    subjectCode = null,
    sessionCode = null,
    blinkDetected = true
  }) {
    const deviceUuid = getDeviceUUID();
    return request('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy_meters: parseFloat(accuracyMeters),
        is_mock_location: Boolean(isMockLocation),
        image_base64: imageBase64,
        subject_code: subjectCode,
        session_code: sessionCode,
        blink_detected: Boolean(blinkDetected),
        device_uuid: deviceUuid
      })
    });
  },

  async registerFace(usn, imageBase64) {
    return request('/students/register-face', {
      method: 'POST',
      body: JSON.stringify({
        usn,
        image_base64: imageBase64
      })
    });
  },

  async bindDevice(deviceUuid = null, usn = null) {
    const uuid = deviceUuid || getDeviceUUID();
    return request('/students/bind-device', {
      method: 'POST',
      body: JSON.stringify({
        device_uuid: uuid,
        usn: usn
      })
    });
  },

  async getAttendanceHistory(filters = {}) {
    const params = new URLSearchParams();
    if (filters.section) params.append('section', filters.section);
    if (filters.semester) params.append('semester', filters.semester);
    if (filters.department) params.append('department', filters.department);
    if (filters.subjectCode) params.append('subject_code', filters.subjectCode);
    if (filters.date) params.append('date_filter', filters.date);
    return request(`/attendance/history?${params.toString()}`);
  },

  async getDefaulters(section = null, semester = null, department = null) {
    const params = new URLSearchParams();
    if (section) params.append('section', section);
    if (semester) params.append('semester', semester);
    if (department) params.append('department', department);
    return request(`/attendance/defaulters?${params.toString()}`);
  },

  async getFacultyAttendanceReport({ department, subjectCode, section, semester, reportType = 'day_to_day', attendanceStatus = 'ALL', dateFrom = null, dateTo = null } = {}) {
    const params = new URLSearchParams();
    if (department && department !== 'ALL') params.append('department', department);
    if (subjectCode && subjectCode !== 'ALL') params.append('subject_code', subjectCode);
    if (section && section !== 'ALL') params.append('section', section);
    if (semester && semester !== 'ALL') params.append('semester', String(semester));
    if (reportType) params.append('report_type', reportType);
    if (attendanceStatus && attendanceStatus !== 'ALL') params.append('attendance_status', attendanceStatus);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    params.append('download_format', 'json');
    return request(`/faculty/attendance-export?${params.toString()}`);
  },

  async downloadAttendanceExcel({ department, subjectCode, section, semester, reportType = 'monthly_matrix', attendanceStatus = 'ALL', dateFrom = null, dateTo = null, month = 10, year = 2026 } = {}) {
    const params = new URLSearchParams();
    if (department && department !== 'ALL') params.append('department', department);
    if (subjectCode && subjectCode !== 'ALL') params.append('subject_code', subjectCode);
    if (section && section !== 'ALL') params.append('section', section);
    if (semester && semester !== 'ALL') params.append('semester', String(semester));
    if (reportType) params.append('report_type', reportType);
    if (attendanceStatus && attendanceStatus !== 'ALL') params.append('attendance_status', attendanceStatus);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    params.append('download_format', 'excel');
    const token = getAuthToken();
    const response = await fetch(`${getApiBaseUrl()}/faculty/attendance-export?${params.toString()}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      let errMsg = 'Failed to download attendance Excel sheet';
      try {
        const errJson = await response.json();
        if (errJson && (errJson.detail || errJson.message)) {
          errMsg = errJson.detail || errJson.message;
        }
      } catch (e) {
        try {
          const text = await response.text();
          if (text) errMsg = text;
        } catch (e2) {}
      }
      throw new Error(errMsg);
    }

    let filename = '';
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }
    if (!filename) {
      filename = `RGIT_Student_Attendance_Sheet_${subjectCode || 'BCS702'}_Sec${section || 'A'}_${month || 10}_${year || 2026}.xlsx`;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        if (a.parentNode) {
          document.body.removeChild(a);
        }
        window.URL.revokeObjectURL(url);
      } catch (e) {}
    }, 15000);
  },

  async downloadAttendanceCsv({ department, subjectCode, section, semester, reportType = 'day_to_day', attendanceStatus = 'ALL', dateFrom = null, dateTo = null, month = null, year = null } = {}) {
    const params = new URLSearchParams();
    if (department && department !== 'ALL') params.append('department', department);
    if (subjectCode && subjectCode !== 'ALL') params.append('subject_code', subjectCode);
    if (section && section !== 'ALL') params.append('section', section);
    if (semester && semester !== 'ALL') params.append('semester', String(semester));
    if (reportType) params.append('report_type', reportType);
    if (attendanceStatus && attendanceStatus !== 'ALL') params.append('attendance_status', attendanceStatus);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    params.append('download_format', 'csv');
    const token = getAuthToken();
    const response = await fetch(`${getApiBaseUrl()}/faculty/attendance-export?${params.toString()}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      let errMsg = 'Failed to download attendance CSV report';
      try {
        const errJson = await response.json();
        if (errJson && (errJson.detail || errJson.message)) {
          errMsg = errJson.detail || errJson.message;
        }
      } catch (e) {
        try {
          const text = await response.text();
          if (text) errMsg = text;
        } catch (e2) {}
      }
      throw new Error(errMsg);
    }

    // Extract filename from Content-Disposition if present
    let filename = '';
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }
    if (!filename) {
      const deptClean = (department || 'ALL').replace(/\s+/g, '_').replace(/&/g, 'AND');
      const subjClean = (subjectCode || 'ALL').replace(/\s+/g, '_');
      const secClean = (section || 'ALL').replace(/\s+/g, '_');
      const todayStr = new Date().toISOString().split('T')[0];
      const prefix = reportType === 'day_to_day' ? 'RGIT_DayToDay_Attendance' : 'RGIT_Summary_Attendance';
      filename = `${prefix}_${deptClean}_${subjClean}_Sec${secClean}_${todayStr}.csv`;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Revoke object URL after delay so browser has ample time to stream/save file
    setTimeout(() => {
      try {
        if (a.parentNode) {
          document.body.removeChild(a);
        }
        window.URL.revokeObjectURL(url);
      } catch (e) {}
    }, 15000);
  },

  async manualOverride({ studentUsn, subjectCode, date, periodNumber, status, reason }) {
    return request('/attendance/override', {
      method: 'POST',
      body: JSON.stringify({
        student_usn: studentUsn,
        subject_code: subjectCode,
        date,
        period_number: parseInt(periodNumber),
        status,
        reason
      })
    });
  },

  // 5. Dashboard & Administration
  async getDashboardStats() {
    return request('/dashboard/stats');
  },

  async getDepartmentDatabasesStatus() {
    return request('/department-databases/status');
  },

  async getAuditLogs(limit = 50) {
    return request(`/audit-logs?limit=${limit}`);
  },

  async getSecurityLogs(limit = 50) {
    return this.getAuditLogs(limit);
  },

  async getStudentsList(section = null, semester = null, department = null) {
    const params = new URLSearchParams();
    if (section && section !== 'ALL') params.append('section', section);
    if (semester && semester !== 'ALL') params.append('semester', semester);
    if (department && department !== 'ALL') params.append('department', department);
    return request(`/students/list?${params.toString()}`);
  },

  async deleteStudent(usn) {
    return request(`/students/${encodeURIComponent(usn)}`, {
      method: 'DELETE'
    });
  },

  async updateStudent(usn, payload) {
    return request(`/students/${encodeURIComponent(usn)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async getPublicStudentsBySemester(semester = null, department = null) {
    const params = new URLSearchParams();
    if (semester && semester !== 'ALL') params.append('semester', semester);
    if (department && department !== 'ALL') params.append('department', department);
    return request(`/auth/students-by-semester?${params.toString()}`);
  },

  async getPublicFacultyBySemester(semester = null, department = null) {
    const params = new URLSearchParams();
    if (semester && semester !== 'ALL') params.append('semester', semester);
    if (department && department !== 'ALL') params.append('department', department);
    return request(`/auth/faculty-by-semester?${params.toString()}`);
  },

  async getFacultyList() {
    return request('/faculty/list');
  },

  // 6. Student Self-Registration & Teacher Verification Queue
  async submitStudentRegistration(payload) {
    return request('/register/submit-form', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getPendingRegistrations(section = null, statusFilter = null, department = null, semester = null) {
    const params = new URLSearchParams();
    if (section && section !== 'ALL') params.append('section', section);
    if (statusFilter && statusFilter !== 'ALL') params.append('status_filter', statusFilter);
    if (department && department !== 'ALL') params.append('department', department);
    if (semester && semester !== 'ALL') params.append('semester', semester);
    return request(`/register/pending-list?${params.toString()}`);
  },

  async verifyStudentRegistration(requestId, action, rejectionReason = '') {
    return request(`/register/${requestId}/action`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        rejection_reason: rejectionReason
      })
    });
  },

  async batchApproveRegistrations(section = null) {
    const params = new URLSearchParams();
    if (section && section !== 'ALL') params.append('section', section);
    return request(`/register/batch-approve?${params.toString()}`, {
      method: 'POST'
    });
  },

  async checkRegistrationStatus(usn) {
    return request(`/register/check-status/${encodeURIComponent(usn)}`);
  },

  // 7. Academic Subjects & Faculty Management (Admin Only)
  async getAllSubjects() {
    return request('/subjects/list');
  },

  async createFaculty(payload) {
    return request('/faculty/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateFacultySubjects(facultyId, subjectCodes) {
    return request(`/faculty/${facultyId}/subjects`, {
      method: 'PUT',
      body: JSON.stringify({
        subject_codes: subjectCodes
      })
    });
  },

  async updateFacultyProfile(facultyId, payload) {
    return request(`/faculty/${facultyId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async updateFacultyCredentials(facultyId, newPassword, newUsername = null) {
    return request(`/faculty/${facultyId}/credentials`, {
      method: 'PUT',
      body: JSON.stringify({
        new_password: newPassword,
        new_username: newUsername
      })
    });
  },

  async deleteFaculty(facultyId) {
    return request(`/faculty/${facultyId}`, {
      method: 'DELETE'
    });
  },

  // 9. HOD Governance & Management (Admin Only)
  async getDepartmentHods() {
    return request('/admin/hods');
  },

  async createDepartmentHOD(payload) {
    return request('/admin/hods/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateHODPassword(hodId, newPassword, newUsername = null, department = null, fullName = null, email = null, phone = null) {
    return request(`/admin/hods/${hodId}/password`, {
      method: 'PUT',
      body: JSON.stringify({
        new_password: newPassword,
        new_username: newUsername,
        department: department,
        full_name: fullName,
        email: email,
        phone: phone
      })
    });
  },

  async deleteDepartmentHOD(hodId) {
    return request(`/admin/hods/${hodId}`, {
      method: 'DELETE'
    });
  },

  async getPublicHods(department = null) {
    const params = new URLSearchParams();
    if (department && department !== 'ALL') params.append('department', department);
    return request(`/public/hods${params.toString() ? `?${params.toString()}` : ''}`);
  }
};

// RGIT Canonical Coordinates
export const RGIT_LOCATION = {
  latitude: 13.033089637756348,
  longitude: 77.59778594970703,
  campusName: "Rajiv Gandhi Institute of Technology (RGIT)",
  city: "Bangalore, Karnataka",
  defaultRadiusMeters: 250
};
