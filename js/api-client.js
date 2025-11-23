// API Client for Backend Communication
class APIClient {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('authToken');
    }

    // Set token after login
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Get authorization headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // ==================== AUTHENTICATION ====================

    async registerUser(userData) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            if (data.token) {
                        this.setToken(data.token);
                    }
                    if (data.refreshToken) {
                        localStorage.setItem('refreshToken', data.refreshToken);
            }
            return data.user;
        } catch (error) {
            throw error;
        }
    }

    async loginUser(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (data.token) {
                this.setToken(data.token);
            }
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            return data.user;
        } catch (error) {
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/me`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch user');
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // ==================== USERS ====================

    async getUsers() {
        try {
            const response = await fetch(`${this.baseURL}/api/users`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch users');
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async getUser(userId) {
        try {
            const response = await fetch(`${this.baseURL}/api/users/${userId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch user');
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async updateUserProfile(userId, profileData) {
        try {
            const response = await fetch(`${this.baseURL}/api/users/${userId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(profileData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return data.user;
        } catch (error) {
            throw error;
        }
    }

    async uploadDocument(userId, file, onProgress) {
        return new Promise((resolve, reject) => {
            try {
                const xhr = new XMLHttpRequest();
                const url = `${this.baseURL}/api/users/${userId}/upload-document`;
                const formData = new FormData();
                formData.append('document', file);

                xhr.open('POST', url, true);
                if (this.token) xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);

                xhr.upload.onprogress = function (e) {
                    if (e.lengthComputable && typeof onProgress === 'function') {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        onProgress(percent, e.loaded, e.total);
                    }
                };

                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        try {
                            const resp = JSON.parse(xhr.responseText || '{}');
                            if (xhr.status >= 200 && xhr.status < 300) {
                                resolve(resp);
                            } else {
                                reject(new Error(resp.message || 'Upload failed'));
                            }
                        } catch (err) {
                            reject(err);
                        }
                    }
                };

                xhr.onerror = function (err) {
                    reject(err || new Error('Network error during upload'));
                };

                xhr.send(formData);
            } catch (error) {
                reject(error);
            }
        });
    }

    async approveDocument(userId, approved, reviewNotes = '') {
        try {
            const response = await fetch(`${this.baseURL}/api/users/${userId}/approve-document`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ approved, reviewNotes })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return data;
        } catch (error) {
            throw error;
        }
    }

    // ==================== JOBS ====================

    async getJobs() {
        try {
            const response = await fetch(`${this.baseURL}/api/jobs`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch jobs');
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async createJob(jobData) {
        try {
            const response = await fetch(`${this.baseURL}/api/jobs`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(jobData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return data.job;
        } catch (error) {
            throw error;
        }
    }

    // ==================== APPLICATIONS ====================

    async getApplications() {
        try {
            const response = await fetch(`${this.baseURL}/api/applications`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch applications');
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async getAllApplications() {
        try {
            const response = await fetch(`${this.baseURL}/api/applications/all`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch applications');
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async applyForJob(jobId) {
        try {
            const response = await fetch(`${this.baseURL}/api/applications`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ jobId })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return data.application;
        } catch (error) {
            throw error;
        }
    }

    // ==================== TASKS ====================

    async getTasks() {
        try {
            const response = await fetch(`${this.baseURL}/api/tasks`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch tasks');
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async createTask(taskData) {
        try {
            const response = await fetch(`${this.baseURL}/api/tasks`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(taskData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return data.task;
        } catch (error) {
            throw error;
        }
    }

    // ==================== INSTITUTIONS ====================

    async getInstitutions() {
        try {
            const response = await fetch(`${this.baseURL}/api/institutions`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch institutions');
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async addInstitution(name) {
        try {
            const response = await fetch(`${this.baseURL}/api/institutions`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ name })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return data.institution;
        } catch (error) {
            throw error;
        }
    }

    // Logout
    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }
}

// Initialize API client
const apiClient = new APIClient();
