// Enhanced Recruitment System App State with Full Features
class AppState {
    constructor() {
        this.api = apiClient;
        this.currentUser = null;
        this.allJobs = [];
        this.filteredJobs = [];
        this.searchTerm = '';
        this.sortBy = 'recent';
        this.filterCompany = '';
        this.init();
    }

    async init() {
        if (this.api.token) {
            try {
                this.currentUser = await this.api.getCurrentUser();
                if (this.currentUser.role === 'admin') {
                    this.renderAdminDashboard();
                } else {
                    this.renderStudentDashboard();
                }
            } catch (error) {
                this.api.logout();
                this.renderHomePage();
            }
        } else {
            this.renderHomePage();
        }
    }

    async registerUser(userData) {
        try {
            const user = await this.api.registerUser(userData);
            this.currentUser = user;
            this.renderStudentDashboard();
        } catch (error) {
            alert(error.message);
        }
    }

    async loginUser(email, password) {
        try {
            const user = await this.api.loginUser(email, password);
            this.currentUser = user;
            if (user.role === 'admin') {
                this.renderAdminDashboard();
            } else {
                this.renderStudentDashboard();
            }
        } catch (error) {
            alert(error.message);
        }
    }

    logout() {
        this.currentUser = null;
        this.api.logout();
        this.renderHomePage();
    }

    // ==================== HOME PAGE ====================
    renderHomePage() {
        const content = `
            <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
                <!-- Hero Section -->
                <div class="text-center py-20">
                    <h1 class="text-5xl font-bold mb-4 text-gray-900">Welcome to Nikhire</h1>
                    <p class="text-2xl text-gray-600 mb-8">Campus Recruitment Made Simple</p>
                    <p class="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
                        Connect with top employers and launch your career. Our platform makes it easy for students to find opportunities and employers to discover talent.
                    </p>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
                        <div class="bg-white p-6 rounded-lg shadow">
                            <div class="text-4xl mb-2">💼</div>
                            <h3 class="font-bold text-lg mb-2">Job Listings</h3>
                            <p class="text-gray-600 text-sm">Browse opportunities from top companies</p>
                        </div>
                        <div class="bg-white p-6 rounded-lg shadow">
                            <div class="text-4xl mb-2">📋</div>
                            <h3 class="font-bold text-lg mb-2">Easy Apply</h3>
                            <p class="text-gray-600 text-sm">Apply with one click and track status</p>
                        </div>
                        <div class="bg-white p-6 rounded-lg shadow">
                            <div class="text-4xl mb-2">🎯</div>
                            <h3 class="font-bold text-lg mb-2">Smart Matching</h3>
                            <p class="text-gray-600 text-sm">Find jobs matched to your profile</p>
                        </div>
                    </div>
                </div>

                <!-- Login/Register Form -->
                <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
                    <h2 class="text-2xl font-bold mb-6 text-center">Get Started</h2>
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500" id="reg_name" type="text" placeholder="Your full name">
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500" id="email" type="email" placeholder="your@email.com">
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Institution</label>
                        <select id="reg_institution" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline focus:border-indigo-500">
                            <option value="">Select institution (optional)</option>
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Looking For (Occupation)</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500" id="reg_occupation" type="text" placeholder="e.g., Software Engineer">
                    </div>

                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Password</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500" id="password" type="password" placeholder="••••••••">
                    </div>

                    <div class="flex gap-4">
                        <button id="loginSubmit" class="flex-1 btn-primary px-4 py-2 rounded font-bold text-white hover:bg-indigo-700 transition">
                            Sign In
                        </button>
                        <button id="registerSubmit" class="flex-1 btn-secondary px-4 py-2 rounded font-bold text-white hover:bg-purple-700 transition">
                            Sign Up
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('appContent').innerHTML = content;

        // Populate institutions into registration select
        this.api.getInstitutions().then(list => {
            const sel = document.getElementById('reg_institution');
            if (sel && Array.isArray(list)) {
                list.forEach(inst => {
                    const opt = document.createElement('option');
                    opt.value = inst.name || inst;
                    opt.textContent = inst.name || inst;
                    sel.appendChild(opt);
                });
            }
        }).catch(() => {});

        document.getElementById('loginSubmit').addEventListener('click', () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            if (!email || !password) {
                alert('Please enter email and password');
                return;
            }
            this.loginUser(email, password);
        });

        document.getElementById('registerSubmit').addEventListener('click', () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const name = document.getElementById('reg_name').value;
            const institution = document.getElementById('reg_institution').value;
            const occupation = document.getElementById('reg_occupation').value;

            if (!email || !password || !name) {
                alert('Name, email and password are required');
                return;
            }

            this.registerUser({ email, password, name, role: 'student', institution, occupation });
        });
    }

    // ==================== STUDENT DASHBOARD ====================
    renderStudentDashboard() {
        const content = `
            <div class="py-8">
                <!-- Header with User Info -->
                <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg mb-8">
                    <div class="flex justify-between items-center">
                        <div>
                            <h1 class="text-3xl font-bold">Welcome back, ${this.currentUser.name}! 👋</h1>
                            <p class="text-indigo-100 mt-1">Campus: ${this.currentUser.institution || 'Not set'}</p>
                        </div>
                        <button id="logoutBtn" class="bg-white text-blue-600 px-4 py-2 rounded font-bold hover:bg-gray-100 transition">
                            Logout
                        </button>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <div class="text-sm text-gray-600">Jobs Available</div>
                        <div class="text-3xl font-bold text-blue-600" id="jobCount">0</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                        <div class="text-sm text-gray-600">Applications Sent</div>
                        <div class="text-3xl font-bold text-green-600" id="appCount">0</div>
                    </div>
                    <div class="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                        <div class="text-sm text-gray-600">Tasks Pending</div>
                        <div class="text-3xl font-bold text-orange-600" id="taskCount">0</div>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                        <div class="text-sm text-gray-600">Profile Strength</div>
                        <div class="text-3xl font-bold text-purple-600" id="profileStrength">0%</div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Main Content (2 columns) -->
                    <div class="lg:col-span-2 space-y-8">
                        <!-- Available Jobs -->
                        <div class="bg-white rounded-lg shadow p-6">
                            <div class="flex justify-between items-center mb-4">
                                <h2 class="text-2xl font-bold">💼 Available Jobs</h2>
                                <button id="refreshJobsBtn" class="text-indigo-600 hover:text-indigo-700 text-sm">🔄 Refresh</button>
                            </div>
                            
                            <!-- Job Filters & Search -->
                            <div class="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
                                <input class="w-full border rounded px-3 py-2 text-sm" id="jobSearch" type="text" placeholder="🔍 Search jobs by title...">
                                <div class="grid grid-cols-2 gap-3">
                                    <input class="border rounded px-3 py-2 text-sm" id="companyFilter" type="text" placeholder="Filter by company...">
                                    <select class="border rounded px-3 py-2 text-sm" id="sortBy">
                                        <option value="recent">Most Recent</option>
                                        <option value="company">By Company</option>
                                        <option value="title">By Title</option>
                                    </select>
                                </div>
                                <button id="applyFiltersBtn" class="w-full bg-indigo-600 text-white px-3 py-2 rounded text-sm font-bold hover:bg-indigo-700 transition">
                                    Apply Filters
                                </button>
                            </div>
                            
                            <div id="jobList" class="space-y-4">
                                <p class="text-gray-500">Loading jobs...</p>
                            </div>
                        </div>

                        <!-- Your Applications -->
                        <div class="bg-white rounded-lg shadow p-6">
                            <h2 class="text-2xl font-bold mb-4">📋 Your Applications</h2>
                            <div id="applicationList" class="space-y-4">
                                <p class="text-gray-500">Loading applications...</p>
                            </div>
                        </div>

                        <!-- Assigned Tasks -->
                        <div class="bg-white rounded-lg shadow p-6">
                            <h2 class="text-2xl font-bold mb-4">📝 Your Tasks</h2>
                            <div id="taskList" class="space-y-4">
                                <p class="text-gray-500">Loading tasks...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar (1 column) -->
                    <div class="space-y-6">
                        <!-- Profile Card -->
                                <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
                            <h3 class="text-xl font-bold mb-4">👤 My Profile</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-gray-700 text-sm font-bold mb-2">Institution</label>
                                    <select class="w-full border rounded px-3 py-2 text-sm" id="institution">
                                        <option value="">Select institution</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-gray-700 text-sm font-bold mb-2">Looking For</label>
                                    <input class="w-full border rounded px-3 py-2 text-sm" id="occupation" type="text" placeholder="e.g., Software Engineer">
                                </div>
                                <div>
                                    <label class="block text-gray-700 text-sm font-bold mb-2">Profile Photo</label>
                                    <input class="w-full border rounded px-3 py-2 text-sm" id="profileImage" type="file" accept="image/*">
                                </div>
                                <button id="saveProfileBtn" class="w-full btn-primary px-4 py-2 rounded font-bold text-white hover:bg-indigo-700 transition">
                                    Save Profile
                                </button>
                            </div>
                        </div>

                        <!-- Tips -->
                        <div class="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                            <h3 class="font-bold mb-3">💡 Tips for Success</h3>
                            <ul class="text-sm text-gray-700 space-y-2">
                                <li>✓ Complete your profile</li>
                                <li>✓ Update your occupation</li>
                                <li>✓ Apply to relevant jobs</li>
                                <li>✓ Check tasks regularly</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('appContent').innerHTML = content;

        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('saveProfileBtn').addEventListener('click', () => this.saveStudentProfile());
        document.getElementById('refreshJobsBtn').addEventListener('click', () => this.loadJobs());
        
        // Dynamic filtering listeners
                                            <button id="registerSubmit" class="flex-1 btn-secondary px-4 py-2 rounded font-bold text-white hover:bg-blue-900 transition">
        document.getElementById('jobSearch').addEventListener('keyup', () => this.applyJobFilters());
        document.getElementById('companyFilter').addEventListener('keyup', () => this.applyJobFilters());
        document.getElementById('sortBy').addEventListener('change', () => this.applyJobFilters());

        this.loadJobs();
        this.loadApplications();
        this.loadTasks();
        this.loadInstitutions();
        this.updateProfileStrength();
    }

    // ==================== ADMIN DASHBOARD ====================
    renderAdminDashboard() {
        const content = `
            <div class="py-8">
                <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-700 to-blue-800 text-white p-6 rounded-lg mb-8">
                    <div class="flex justify-between items-center">
                        <div>
                            <h1 class="text-3xl font-bold">Admin Dashboard 🛡️</h1>
                                <p class="text-blue-100 mt-1">Full system control & recruitment management</p>
                        </div>
                        <button id="logoutBtn" class="bg-white text-blue-700 px-4 py-2 rounded font-bold hover:bg-gray-100 transition">
                            Logout
                        </button>
                    </div>
                </div>

                <!-- Admin Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <div class="text-sm text-gray-600">Total Users</div>
                        <div class="text-3xl font-bold text-blue-600" id="userCount">0</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                        <div class="text-sm text-gray-600">Total Jobs</div>
                        <div class="text-3xl font-bold text-green-600" id="totalJobs">0</div>
                    </div>
                    <div class="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                        <div class="text-sm text-gray-600">Total Applications</div>
                        <div class="text-3xl font-bold text-orange-600" id="totalApps">0</div>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                        <div class="text-sm text-gray-600">Pending Tasks</div>
                        <div class="text-3xl font-bold text-purple-600" id="totalTasks">0</div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Create Job -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-2xl font-bold mb-4">📝 Post New Job</h2>
                        <div class="space-y-4">
                            <input class="w-full border rounded px-3 py-2" id="jobTitle" type="text" placeholder="Job Title">
                            <input class="w-full border rounded px-3 py-2" id="jobCompany" type="text" placeholder="Company Name">
                            <textarea class="w-full border rounded px-3 py-2 h-24" id="jobDescription" placeholder="Job Description & Requirements"></textarea>
                            <textarea class="w-full border rounded px-3 py-2 h-24" id="jobRequirements" placeholder="Requirements (comma separated)"></textarea>
                            <button id="addJobBtn" class="w-full btn-secondary px-4 py-2 rounded font-bold text-white hover:bg-purple-700 transition">
                                Post Job
                            </button>
                        </div>
                    </div>

                    <!-- Assign Task -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-2xl font-bold mb-4">📌 Assign Task to Student</h2>
                        <div class="space-y-4">
                            <select class="w-full border rounded px-3 py-2" id="taskStudent">
                                <option value="">Select a student</option>
                            </select>
                            <textarea class="w-full border rounded px-3 py-2 h-20" id="taskDescription" placeholder="Task Description"></textarea>
                            <input class="w-full border rounded px-3 py-2" id="taskDueDate" type="date">
                            <button id="assignTaskBtn" class="w-full btn-secondary px-4 py-2 rounded font-bold text-white hover:bg-purple-700 transition">
                                Assign Task
                            </button>
                        </div>
                    </div>

                    <!-- All Users -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-2xl font-bold mb-4">👥 All Registered Users</h2>
                        <div id="userList" class="space-y-3 max-h-96 overflow-y-auto">
                            <p class="text-gray-500">Loading users...</p>
                        </div>
                    </div>

                    <!-- All Applications -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-2xl font-bold mb-4">📊 All Applications</h2>
                        <div id="allApplicationsList" class="space-y-3 max-h-96 overflow-y-auto">
                            <p class="text-gray-500">Loading applications...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('appContent').innerHTML = content;

        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('addJobBtn').addEventListener('click', () => this.addJob());
        document.getElementById('assignTaskBtn').addEventListener('click', () => this.assignTask());

        this.loadUsers();
        this.loadAllApplications();
        this.loadStudentsForTasks();
        this.loadAdminStats();
    }

    // ==================== DATA LOADING ====================
    async loadJobs() {
        try {
            const jobs = await this.api.getJobs();
            this.state.allJobs = jobs; // Store all jobs for filtering
            this.state.filteredJobs = jobs; // Initialize filtered jobs
            
            const jobList = document.getElementById('jobList');

            if (!jobList) return;

            if (jobs.length === 0) {
                jobList.innerHTML = '<p class="text-gray-500 text-center py-8">No jobs available at the moment.</p>';
                document.getElementById('jobCount').textContent = '0';
                return;
            }

            document.getElementById('jobCount').textContent = jobs.length;

            jobList.innerHTML = jobs.map(job => `
                <div class="border rounded-lg p-4 hover:shadow-lg transition">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">${job.title}</h3>
                            <p class="text-sm text-gray-600">${job.company}</p>
                        </div>
                        <span class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">New</span>
                    </div>
                    <p class="text-gray-700 text-sm mb-4">${job.description.substring(0, 200)}${job.description.length>200? '...':''}</p>
                    ${job.requirements && job.requirements.length ? `
                        <div class="mb-3">
                            <strong class="text-sm text-gray-700">Requirements:</strong>
                            <ul class="list-disc list-inside text-sm text-gray-600 mt-2">
                                ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <button class="btn-accent px-4 py-2 rounded text-sm apply-btn font-bold hover:opacity-90 transition" data-job-id="${job._id}">
                        Apply Now 🚀
                    </button>
                </div>
            `).join('');

            document.querySelectorAll('.apply-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const jobId = e.target.getAttribute('data-job-id');
                    this.applyForJob(jobId);
                });
            });
        } catch (error) {
            console.error('Error loading jobs:', error);
        }
    }

    async loadApplications() {
        try {
            const applications = await this.api.getApplications();
            const applicationList = document.getElementById('applicationList');

            if (!applicationList) return;

            if (applications.length === 0) {
                applicationList.innerHTML = '<p class="text-gray-500 text-center py-8">You haven\'t applied to any jobs yet.</p>';
                document.getElementById('appCount').textContent = '0';
                return;
            }

            document.getElementById('appCount').textContent = applications.length;

            applicationList.innerHTML = applications.map(app => `
                <div class="border rounded-lg p-4 bg-gray-50">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h3 class="font-bold text-gray-900">${app.jobTitle}</h3>
                            <p class="text-sm text-gray-600">${app.company}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-bold ${
                            app.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                            app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            app.status === 'Reviewed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                        }">
                            ${app.status}
                        </span>
                    </div>
                    <p class="text-xs text-gray-500">Applied: ${new Date(app.appliedAt).toLocaleDateString()}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading applications:', error);
        }
    }

    async loadTasks() {
        try {
            const tasks = await this.api.getTasks();
            const taskList = document.getElementById('taskList');

            if (!taskList) return;

            if (tasks.length === 0) {
                taskList.innerHTML = '<p class="text-gray-500 text-center py-8">No tasks assigned to you.</p>';
                document.getElementById('taskCount').textContent = '0';
                return;
            }

            document.getElementById('taskCount').textContent = tasks.filter(t => t.status === 'Pending').length;

            taskList.innerHTML = tasks.map(task => `
                <div class="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
                    <h3 class="font-bold text-gray-900">${task.description}</h3>
                    <div class="flex justify-between items-center mt-2">
                        <p class="text-xs text-gray-600">Due: ${new Date(task.dueDate).toLocaleDateString()}</p>
                        <span class="px-2 py-1 rounded text-xs font-bold ${
                            task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }">
                            ${task.status}
                        </span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    async loadInstitutions() {
        try {
            const institutions = await this.api.getInstitutions();
            const institutionSelect = document.getElementById('institution');

            if (!institutionSelect) return;

            institutionSelect.innerHTML = '<option value="">Select your institution</option>' +
                institutions.map(inst => `<option value="${inst.name || inst}">${inst.name || inst}</option>`).join('');
        } catch (error) {
            console.error('Error loading institutions:', error);
        }
    }

    async loadUsers() {
        try {
            const users = await this.api.getUsers();
            const userList = document.getElementById('userList');

            if (!userList) return;

            if (users.length === 0) {
                userList.innerHTML = '<p class="text-gray-500">No users registered.</p>';
                document.getElementById('userCount').textContent = '0';
                return;
            }

            document.getElementById('userCount').textContent = users.length;

            userList.innerHTML = users.map(user => `
                <div class="border rounded p-3 bg-gray-50 hover:bg-gray-100 transition">
                    <div class="font-bold text-gray-900">${user.name}</div>
                    <p class="text-xs text-gray-600">${user.email}</p>
                    <p class="text-xs text-gray-500">Role: <span class="font-bold">${user.role}</span> | Institution: ${user.institution || 'N/A'}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    async loadAllApplications() {
        try {
            const applications = await this.api.getAllApplications();
            const applicationList = document.getElementById('allApplicationsList');

            if (!applicationList) return;

            if (applications.length === 0) {
                applicationList.innerHTML = '<p class="text-gray-500">No applications yet.</p>';
                document.getElementById('totalApps').textContent = '0';
                return;
            }

            document.getElementById('totalApps').textContent = applications.length;

            applicationList.innerHTML = applications.map(app => `
                <div class="border rounded p-3 bg-gray-50 hover:bg-gray-100 transition">
                    <div class="font-bold text-gray-900">${app.jobTitle}</div>
                    <p class="text-xs text-gray-600">${app.userId?.name || 'Unknown'}</p>
                    <span class="inline-block text-xs font-bold px-2 py-1 rounded mt-1 ${
                        app.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                        app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }">
                        ${app.status}
                    </span>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading applications:', error);
        }
    }

    async loadStudentsForTasks() {
        try {
            const users = await this.api.getUsers();
            const students = users.filter(u => u.role === 'student');
            const select = document.getElementById('taskStudent');

            if (select) {
                select.innerHTML = '<option value="">Select a student</option>' +
                    students.map(s => `<option value="${s._id}">${s.name}</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    async loadAdminStats() {
        try {
            const [users, jobs, applications, tasks] = await Promise.all([
                this.api.getUsers(),
                this.api.getJobs(),
                this.api.getAllApplications(),
                this.api.getTasks()
            ]);

            document.getElementById('userCount').textContent = users.length;
            document.getElementById('totalJobs').textContent = jobs.length;
            document.getElementById('totalApps').textContent = applications.length;
            document.getElementById('totalTasks').textContent = tasks.filter(t => t.status === 'Pending').length;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // ==================== ACTIONS ====================
    async saveStudentProfile() {
        const institution = document.getElementById('institution').value;
        const occupation = document.getElementById('occupation').value;
        const profileImage = document.getElementById('profileImage').files[0];

        if (!institution || !occupation) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const profileData = { institution, occupation };

            if (profileImage) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profileData.profileImage = e.target.result;
                    this.updateProfile(profileData);
                };
                reader.readAsDataURL(profileImage);
            } else {
                this.updateProfile(profileData);
            }
        } catch (error) {
            alert(error.message);
        }
    }

    async updateProfile(profileData) {
        try {
            await this.api.updateUserProfile(this.currentUser.id, profileData);
            Object.assign(this.currentUser, profileData);
            alert('Profile updated successfully!');
            this.updateProfileStrength();
        } catch (error) {
            alert(error.message);
        }
    }

    updateProfileStrength() {
        let strength = 0;
        if (this.currentUser.name) strength += 25;
        if (this.currentUser.institution) strength += 25;
        if (this.currentUser.occupation) strength += 25;
        if (this.currentUser.profileImage) strength += 25;

        const el = document.getElementById('profileStrength');
        if (el) el.textContent = strength + '%';
    }

    async addJob() {
        const title = document.getElementById('jobTitle').value;
        const company = document.getElementById('jobCompany').value;
        const description = document.getElementById('jobDescription').value;
        const requirementsRaw = document.getElementById('jobRequirements') ? document.getElementById('jobRequirements').value : '';
        const requirements = requirementsRaw ? requirementsRaw.split(/[,\n]/).map(s => s.trim()).filter(Boolean) : [];

        if (!title || !company || !description) {
            alert('Please fill in all fields');
            return;
        }

        try {
            await this.api.createJob({ title, company, description, requirements });
            alert('Job posted successfully!');
            document.getElementById('jobTitle').value = '';
            document.getElementById('jobCompany').value = '';
            document.getElementById('jobDescription').value = '';
            if (document.getElementById('jobRequirements')) document.getElementById('jobRequirements').value = '';
            this.loadAdminStats();
        } catch (error) {
            alert(error.message);
        }
    }

    async assignTask() {
        const studentId = document.getElementById('taskStudent').value;
        const description = document.getElementById('taskDescription').value;
        const dueDate = document.getElementById('taskDueDate').value;

        if (!studentId || !description || !dueDate) {
            alert('Please fill in all fields');
            return;
        }

        try {
            await this.api.createTask({ studentId, description, dueDate });
            alert('Task assigned successfully!');
            document.getElementById('taskStudent').value = '';
            document.getElementById('taskDescription').value = '';
            document.getElementById('taskDueDate').value = '';
            this.loadAdminStats();
        } catch (error) {
            alert(error.message);
        }
    }

    async applyJobFilters() {
        const searchTerm = document.getElementById('jobSearch')?.value?.toLowerCase() || '';
        const companyFilter = document.getElementById('companyFilter')?.value?.toLowerCase() || '';
        const sortBy = document.getElementById('sortBy')?.value || 'recent';

        // Filter jobs based on search and company filters
        let filtered = this.state.allJobs.filter(job => {
            const titleMatch = job.title.toLowerCase().includes(searchTerm);
            const companyMatch = !companyFilter || job.company.toLowerCase().includes(companyFilter);
            return titleMatch && companyMatch;
        });

        // Sort filtered jobs
        if (sortBy === 'company') {
            filtered.sort((a, b) => a.company.localeCompare(b.company));
        } else if (sortBy === 'title') {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
        } else {
            // Default: most recent (by date created)
            filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }

        this.state.filteredJobs = filtered;

        // Re-render the job list
        const jobList = document.getElementById('jobList');
        if (!jobList) return;

        if (filtered.length === 0) {
            jobList.innerHTML = '<p class="text-gray-500 text-center py-8">No jobs match your filters.</p>';
            return;
        }

        jobList.innerHTML = filtered.map(job => `
            <div class="border rounded-lg p-4 hover:shadow-lg transition">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">${job.title}</h3>
                        <p class="text-sm text-gray-600">${job.company}</p>
                    </div>
                    <span class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">New</span>
                </div>
                <p class="text-gray-700 text-sm mb-4">${job.description.substring(0, 200)}${job.description.length>200? '...':''}</p>
                ${job.requirements && job.requirements.length ? `
                    <div class="mb-3">
                        <strong class="text-sm text-gray-700">Requirements:</strong>
                        <ul class="list-disc list-inside text-sm text-gray-600 mt-2">
                            ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <button class="btn-accent px-4 py-2 rounded text-sm apply-btn font-bold hover:opacity-90 transition" data-job-id="${job._id}">
                    Apply Now 🚀
                </button>
            </div>
        `).join('');

        // Reattach event listeners to apply buttons
        document.querySelectorAll('.apply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const jobId = e.target.getAttribute('data-job-id');
                this.applyForJob(jobId);
            });
        });
    }

    async applyForJob(jobId) {
        try {
            await this.api.applyForJob(jobId);
            this.loadApplications();
            alert('Application submitted successfully! 🎉');
        } catch (error) {
            alert(error.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AppState();
});
