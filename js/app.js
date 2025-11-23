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
                } else if (this.currentUser.role === 'organization') {
                    this.renderOrganizationDashboard();
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
            } else if (user.role === 'organization') {
                this.renderOrganizationDashboard();
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

    renderHomePage() {
        const html = '<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"><div class="text-center py-16"><h1 class="text-5xl font-bold mb-4 text-gray-900">Welcome to NikHire</h1><p class="text-2xl text-gray-600 mb-8">Campus Recruitment Platform</p><p class="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">Connect with top employers and launch your career. Our platform makes it easy for students to find opportunities and employers to discover talent.</p><div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12"><div class="bg-white p-6 rounded-lg shadow"><div class="text-4xl mb-2">💼</div><h3 class="font-bold text-lg mb-2">Job Listings</h3><p class="text-gray-600 text-sm">Browse opportunities from top companies</p></div><div class="bg-white p-6 rounded-lg shadow"><div class="text-4xl mb-2">📋</div><h3 class="font-bold text-lg mb-2">Easy Apply</h3><p class="text-gray-600 text-sm">Apply with one click and track status</p></div><div class="bg-white p-6 rounded-lg shadow"><div class="text-4xl mb-2">🎯</div><h3 class="font-bold text-lg mb-2">Smart Matching</h3><p class="text-gray-600 text-sm">Find jobs matched to your profile</p></div></div></div><div class="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"><div class="bg-white p-8 rounded-lg shadow-lg"><h2 class="text-2xl font-bold mb-6 text-center">Student Login</h2><div class="space-y-4"><div><label class="block text-gray-700 text-sm font-bold mb-2">Email</label><input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="email" type="email" placeholder="your@email.com"></div><div><label class="block text-gray-700 text-sm font-bold mb-2">Password</label><input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="password" type="password" placeholder="••••••••"></div><button id="loginSubmit" class="w-full bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition">Sign In</button></div></div><div class="bg-white p-8 rounded-lg shadow-lg"><h2 class="text-2xl font-bold mb-6 text-center">Organization/Admin Login</h2><div class="space-y-4"><div><label class="block text-gray-700 text-sm font-bold mb-2">Email</label><input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="orgEmail" type="email" placeholder="company@email.com"></div><div><label class="block text-gray-700 text-sm font-bold mb-2">Password</label><input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="orgPassword" type="password" placeholder="••••••••"></div><button id="adminLoginSubmit" class="w-full bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition">Admin Sign In</button><p class="text-xs text-gray-600 text-center mt-4">New Organization? <button id="adminRegisterToggle" class="text-red-600 font-bold hover:underline">Register here</button></p></div></div></div><div id="adminRegisterForm" class="hidden max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg mb-8"><h2 class="text-2xl font-bold mb-6 text-center">Register Organization</h2><div class="space-y-4"><div><label class="block text-gray-700 text-sm font-bold mb-2">Organization Name</label><input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="org_name" type="text" placeholder="Company Name"></div><div><label class="block text-gray-700 text-sm font-bold mb-2">Email</label><input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="org_email" type="email" placeholder="company@email.com"></div><div><label class="block text-gray-700 text-sm font-bold mb-2">Password</label><input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="org_password" type="password" placeholder="••••••••"></div><button id="adminRegisterSubmit" class="w-full bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition">Register Organization</button><button id="adminRegisterCancel" class="w-full mt-2 bg-gray-400 text-white px-4 py-2 rounded font-bold hover:bg-gray-500 transition">Cancel</button></div></div><div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg"><h2 class="text-2xl font-bold mb-6 text-center">Student Registration</h2><div class="space-y-4"><div><label class="block text-gray-700 text-sm font-bold mb-2">Full Name</label><input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="reg_name" type="text" placeholder="Your full name"></div><div><label class="block text-gray-700 text-sm font-bold mb-2">Email</label><input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="reg_email" type="email" placeholder="student@email.com"></div><div><label class="block text-gray-700 text-sm font-bold mb-2">Institution</label><select id="reg_institution" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"><option value="">Select institution</option></select></div><div><label class="block text-gray-700 text-sm font-bold mb-2">Looking For</label><input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="reg_occupation" type="text" placeholder="e.g., Software Engineer"></div><div><label class="block text-gray-700 text-sm font-bold mb-2">Password</label><input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="reg_password" type="password" placeholder="••••••••"></div><button id="registerSubmit" class="w-full bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 transition">Student Sign Up</button></div></div></div>';

        document.getElementById('appContent').innerHTML = html;

        // Load institutions
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

        // Student login
        document.getElementById('loginSubmit').addEventListener('click', () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            if (!email || !password) {
                alert('Please enter email and password');
                return;
            }
            this.loginUser(email, password);
        });

        // Student registration
        document.getElementById('registerSubmit').addEventListener('click', () => {
            const email = document.getElementById('reg_email').value;
            const password = document.getElementById('reg_password').value;
            const name = document.getElementById('reg_name').value;
            const institution = document.getElementById('reg_institution').value;
            const occupation = document.getElementById('reg_occupation').value;

            if (!email || !password || !name) {
                alert('Name, email and password are required');
                return;
            }

            this.registerUser({ email, password, name, role: 'student', institution, occupation });
        });

        // Admin login
        document.getElementById('adminLoginSubmit').addEventListener('click', () => {
            const email = document.getElementById('orgEmail').value;
            const password = document.getElementById('orgPassword').value;
            if (!email || !password) {
                alert('Please enter email and password');
                return;
            }
            this.loginUser(email, password);
        });

        // Admin register toggle
        document.getElementById('adminRegisterToggle').addEventListener('click', (e) => {
            e.preventDefault();
            const form = document.getElementById('adminRegisterForm');
            form.classList.toggle('hidden');
        });

        // Admin registration
        document.getElementById('adminRegisterSubmit').addEventListener('click', () => {
            const email = document.getElementById('org_email').value;
            const password = document.getElementById('org_password').value;
            const name = document.getElementById('org_name').value;

            if (!email || !password || !name) {
                alert('Organization name, email and password are required');
                return;
            }

            this.registerUser({ email, password, name, role: 'organization', companyName: name });
        });

        // Admin register cancel
        document.getElementById('adminRegisterCancel').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('adminRegisterForm').classList.add('hidden');
        });
    }

    renderStudentDashboard() {
        const html = '<div class="py-8"><div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg mb-8"><div class="flex justify-between items-center"><div><h1 class="text-3xl font-bold">Welcome back, ' + (this.currentUser.name || 'Student') + '! 👋</h1><p class="text-blue-100 mt-1">Campus: ' + (this.currentUser.institution || 'Not set') + '</p></div><button id="logoutBtn" class="bg-white text-blue-600 px-4 py-2 rounded font-bold hover:bg-gray-100 transition">Logout</button></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"><div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500"><div class="text-sm text-gray-600">Jobs Available</div><div class="text-3xl font-bold text-blue-600" id="jobCount">0</div></div><div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500"><div class="text-sm text-gray-600">Applications Sent</div><div class="text-3xl font-bold text-green-600" id="appCount">0</div></div><div class="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500"><div class="text-sm text-gray-600">Tasks Pending</div><div class="text-3xl font-bold text-orange-600" id="taskCount">0</div></div><div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500"><div class="text-sm text-gray-600">Profile Strength</div><div class="text-3xl font-bold text-purple-600" id="profileStrength">0%</div></div></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-8"><div class="lg:col-span-2 space-y-8"><div class="bg-white rounded-lg shadow p-6"><div class="flex justify-between items-center mb-4"><h2 class="text-2xl font-bold">💼 Available Jobs</h2><button id="refreshJobsBtn" class="text-blue-600 hover:text-blue-700 text-sm">🔄 Refresh</button></div><div class="bg-gray-50 p-4 rounded-lg mb-4 space-y-3"><input class="w-full border rounded px-3 py-2 text-sm" id="jobSearch" type="text" placeholder="🔍 Search jobs by title..."><div class="grid grid-cols-2 gap-3"><input class="border rounded px-3 py-2 text-sm" id="companyFilter" type="text" placeholder="Filter by company..."><select class="border rounded px-3 py-2 text-sm" id="sortBy"><option value="recent">Most Recent</option><option value="company">By Company</option><option value="title">By Title</option></select></div><button id="applyFiltersBtn" class="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm font-bold hover:bg-blue-700 transition">Apply Filters</button></div><div id="jobList" class="space-y-4"><p class="text-gray-500">Loading jobs...</p></div></div><div class="bg-white rounded-lg shadow p-6"><h2 class="text-2xl font-bold mb-4">📋 Your Applications</h2><div id="applicationList" class="space-y-4"><p class="text-gray-500">Loading applications...</p></div></div><div class="bg-white rounded-lg shadow p-6"><h2 class="text-2xl font-bold mb-4">📝 Your Tasks</h2><div id="taskList" class="space-y-4"><p class="text-gray-500">Loading tasks...</p></div></div></div><div class="space-y-6"><div class="bg-white rounded-lg shadow p-6"><h3 class="text-xl font-bold mb-4">👤 My Profile</h3><div class="space-y-4"><div><label class="block text-gray-700 text-sm font-bold mb-2">Institution</label><select class="w-full border rounded px-3 py-2 text-sm" id="institution"><option value="">Select institution</option></select></div><div><label class="block text-gray-700 text-sm font-bold mb-2">Looking For</label><input class="w-full border rounded px-3 py-2 text-sm" id="occupation" type="text" placeholder="e.g., Software Engineer"></div><div><label class="block text-gray-700 text-sm font-bold mb-2">Skills (comma separated)</label><input class="w-full border rounded px-3 py-2 text-sm" id="skills" type="text" placeholder="e.g., JavaScript, Python, React"></div><div><label class="block text-gray-700 text-sm font-bold mb-2">Experience & Background</label><textarea class="w-full border rounded px-3 py-2 text-sm h-20" id="experience" placeholder="Describe your work experience, projects, and achievements..."></textarea></div><div><label class="block text-gray-700 text-sm font-bold mb-2">Your CV / Resume</label><textarea class="w-full border rounded px-3 py-2 text-sm h-32" id="cvText" placeholder="Paste your CV or resume content here..."></textarea></div><button id="saveProfileBtn" class="w-full bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition">Save Profile</button></div></div><div class="bg-blue-50 rounded-lg p-6 border border-blue-200"><h3 class="font-bold mb-3">💡 Tips for Success</h3><ul class="text-sm text-gray-700 space-y-2"><li>✓ Complete your profile</li><li>✓ Add your skills</li><li>✓ Upload your CV</li><li>✓ Apply to relevant jobs</li></ul></div></div></div></div>';

        document.getElementById('appContent').innerHTML = html;

        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('saveProfileBtn').addEventListener('click', () => this.saveStudentProfile());
        document.getElementById('refreshJobsBtn').addEventListener('click', () => this.loadJobs());
        document.getElementById('applyFiltersBtn').addEventListener('click', () => this.applyJobFilters());
        document.getElementById('jobSearch').addEventListener('keyup', () => this.applyJobFilters());
        document.getElementById('companyFilter').addEventListener('keyup', () => this.applyJobFilters());
        document.getElementById('sortBy').addEventListener('change', () => this.applyJobFilters());

        this.loadJobs();
        this.loadApplications();
        this.loadTasks();
        this.loadInstitutions();
        this.updateProfileStrength();
    }

    renderAdminDashboard() {
        const html = '<div class="py-8"><div class="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-lg mb-8"><div class="flex justify-between items-center"><div><h1 class="text-3xl font-bold">Admin Dashboard 🛡️</h1><p class="text-red-100 mt-1">Full system control & recruitment management</p></div><button id="logoutBtn" class="bg-white text-red-600 px-4 py-2 rounded font-bold hover:bg-gray-100 transition">Logout</button></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"><div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500"><div class="text-sm text-gray-600">Total Users</div><div class="text-3xl font-bold text-blue-600" id="userCount">0</div></div><div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500"><div class="text-sm text-gray-600">Total Jobs</div><div class="text-3xl font-bold text-green-600" id="totalJobs">0</div></div><div class="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500"><div class="text-sm text-gray-600">Total Applications</div><div class="text-3xl font-bold text-orange-600" id="totalApps">0</div></div><div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500"><div class="text-sm text-gray-600">Pending Tasks</div><div class="text-3xl font-bold text-purple-600" id="totalTasks">0</div></div></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-8"><div class="bg-white rounded-lg shadow p-6"><h2 class="text-2xl font-bold mb-4">📝 Post New Job</h2><div class="space-y-4"><input class="w-full border rounded px-3 py-2" id="jobTitle" type="text" placeholder="Job Title"><input class="w-full border rounded px-3 py-2" id="jobCompany" type="text" placeholder="Company Name"><textarea class="w-full border rounded px-3 py-2 h-24" id="jobDescription" placeholder="Job Description"></textarea><textarea class="w-full border rounded px-3 py-2 h-20" id="jobRequirements" placeholder="Requirements (comma separated)"></textarea><button id="addJobBtn" class="w-full bg-purple-600 text-white px-4 py-2 rounded font-bold hover:bg-purple-700 transition">Post Job</button></div></div><div class="bg-white rounded-lg shadow p-6"><h2 class="text-2xl font-bold mb-4">📌 Assign Task</h2><div class="space-y-4"><select class="w-full border rounded px-3 py-2" id="taskStudent"><option value="">Select a student</option></select><textarea class="w-full border rounded px-3 py-2 h-20" id="taskDescription" placeholder="Task Description"></textarea><input class="w-full border rounded px-3 py-2" id="taskDueDate" type="date"><button id="assignTaskBtn" class="w-full bg-purple-600 text-white px-4 py-2 rounded font-bold hover:bg-purple-700 transition">Assign Task</button></div></div><div class="bg-white rounded-lg shadow p-6"><h2 class="text-2xl font-bold mb-4">👥 All Registered Users</h2><div id="userList" class="space-y-3 max-h-96 overflow-y-auto"><p class="text-gray-500">Loading users...</p></div></div><div class="bg-white rounded-lg shadow p-6"><h2 class="text-2xl font-bold mb-4">📊 All Applications</h2><div id="allApplicationsList" class="space-y-3 max-h-96 overflow-y-auto"><p class="text-gray-500">Loading applications...</p></div></div></div></div>';

        document.getElementById('appContent').innerHTML = html;

        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('addJobBtn').addEventListener('click', () => this.addJob());
        document.getElementById('assignTaskBtn').addEventListener('click', () => this.assignTask());

        this.loadUsers();
        this.loadAllApplications();
        this.loadStudentsForTasks();
        this.loadAdminStats();
    }

    renderOrganizationDashboard() {
        const html = '<div class="py-8"><div class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-lg mb-8"><div class="flex justify-between items-center"><div><h1 class="text-3xl font-bold">Organization Dashboard 🏢</h1><p class="text-emerald-100 mt-1">Welcome ' + (this.currentUser.companyName || 'Organization') + '! Manage candidates and post jobs</p></div><button id="logoutBtn" class="bg-white text-emerald-600 px-4 py-2 rounded font-bold hover:bg-gray-100 transition">Logout</button></div></div><div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"><div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500"><div class="text-sm text-gray-600">Total Students</div><div class="text-3xl font-bold text-blue-600" id="studentCount">0</div></div><div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500"><div class="text-sm text-gray-600">My Posted Jobs</div><div class="text-3xl font-bold text-green-600" id="myJobCount">0</div></div><div class="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500"><div class="text-sm text-gray-600">Received Applications</div><div class="text-3xl font-bold text-orange-600" id="appCount">0</div></div></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-8"><div class="bg-white rounded-lg shadow p-6"><h2 class="text-2xl font-bold mb-4">📝 Post New Job</h2><div class="space-y-4"><input class="w-full border rounded px-3 py-2" id="jobTitle" type="text" placeholder="Job Title"><textarea class="w-full border rounded px-3 py-2 h-24" id="jobDescription" placeholder="Job Description"></textarea><textarea class="w-full border rounded px-3 py-2 h-20" id="jobRequirements" placeholder="Requirements (comma separated)"></textarea><button id="postJobBtn" class="w-full bg-emerald-600 text-white px-4 py-2 rounded font-bold hover:bg-emerald-700 transition">Post Job</button></div></div><div class="bg-white rounded-lg shadow p-6"><h2 class="text-2xl font-bold mb-4">🔍 Search & Filter Students</h2><div class="space-y-4"><input class="w-full border rounded px-3 py-2" id="searchStudents" type="text" placeholder="Search by name or email..."><input class="w-full border rounded px-3 py-2" id="filterSkills" type="text" placeholder="Filter by skills (comma separated)..."><button id="searchBtn" class="w-full bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition">Search</button></div></div><div class="bg-white rounded-lg shadow p-6"><h2 class="text-2xl font-bold mb-4">👥 All Registered Students</h2><div id="studentList" class="space-y-3 max-h-96 overflow-y-auto"><p class="text-gray-500">Loading students...</p></div></div></div></div>';

        document.getElementById('appContent').innerHTML = html;

        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('postJobBtn').addEventListener('click', () => this.postJobAsOrg());
        document.getElementById('searchBtn').addEventListener('click', () => this.searchStudents());

        this.loadStudentsForOrg();
    }

    async loadStudentsForOrg() {
        try {
            const users = await this.api.getUsers();
            const students = users.filter(u => u.role === 'student');
            const studentList = document.getElementById('studentList');

            if (!studentList) return;

            if (students.length === 0) {
                studentList.innerHTML = '<p class="text-gray-500 text-center py-8">No students registered yet.</p>';
                const studentCount = document.getElementById('studentCount');
                if (studentCount) studentCount.textContent = '0';
                return;
            }

            const studentCount = document.getElementById('studentCount');
            if (studentCount) studentCount.textContent = students.length;

            studentList.innerHTML = students.map(student => {
                return '<div class="border rounded-lg p-4 hover:shadow-lg transition"><div class="flex justify-between items-start"><div class="flex-1"><h3 class="font-bold text-gray-900">' + student.name + '</h3><p class="text-sm text-gray-600">' + student.email + '</p><p class="text-sm text-gray-600">' + (student.institution || 'N/A') + ' - ' + (student.occupation || 'N/A') + '</p></div><button class="bg-emerald-600 text-white px-3 py-2 rounded text-sm font-bold hover:bg-emerald-700 transition view-cv-btn" data-student-id="' + student._id + '">View CV</button></div></div>';
            }).join('');

            document.querySelectorAll('.view-cv-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const studentId = e.target.getAttribute('data-student-id');
                    this.viewStudentCV(studentId);
                });
            });
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    async viewStudentCV(studentId) {
        try {
            const student = await this.api.getUser(studentId);
            const cvContent = student.cv || 'No CV uploaded yet.';
            const cvHtml = '<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div class="bg-white rounded-lg p-8 max-w-2xl max-h-96 overflow-y-auto"><div class="flex justify-between items-start mb-4"><h2 class="text-2xl font-bold">CV: ' + student.name + '</h2><button id="closeCVModal" class="text-gray-600 hover:text-gray-900 text-2xl">&times;</button></div><div class="mb-4"><h3 class="font-bold text-gray-900">Contact:</h3><p class="text-gray-700">' + student.email + '</p></div><div class="mb-4"><h3 class="font-bold text-gray-900">Institution:</h3><p class="text-gray-700">' + (student.institution || 'N/A') + '</p></div><div class="mb-4"><h3 class="font-bold text-gray-900">Looking For:</h3><p class="text-gray-700">' + (student.occupation || 'N/A') + '</p></div>' + (student.skills && student.skills.length ? '<div class="mb-4"><h3 class="font-bold text-gray-900">Skills:</h3><div class="flex flex-wrap gap-2">' + student.skills.map(skill => '<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">' + skill + '</span>').join('') + '</div></div>' : '') + (student.experience ? '<div class="mb-4"><h3 class="font-bold text-gray-900">Experience:</h3><p class="text-gray-700 whitespace-pre-wrap">' + student.experience + '</p></div>' : '') + '<div class="mb-4"><h3 class="font-bold text-gray-900">CV Document:</h3><p class="text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto bg-gray-50 p-3 rounded">' + (cvContent === 'No CV uploaded yet.' ? 'No CV uploaded yet.' : cvContent) + '</p></div></div></div>';

            document.body.insertAdjacentHTML('beforeend', cvHtml);
            document.getElementById('closeCVModal').addEventListener('click', () => {
                const modal = document.querySelector('.fixed');
                if (modal) modal.remove();
            });

            document.querySelector('.fixed').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    e.target.remove();
                }
            });
        } catch (error) {
            alert('Error loading student CV: ' + error.message);
        }
    }

    async postJobAsOrg() {
        const title = document.getElementById('jobTitle').value;
        const description = document.getElementById('jobDescription').value;
        const requirementsStr = document.getElementById('jobRequirements').value;

        if (!title || !description) {
            alert('Job title and description are required');
            return;
        }

        const requirements = requirementsStr.split(',').map(r => r.trim()).filter(r => r);

        try {
            await this.api.createJob({
                title,
                company: this.currentUser.companyName || 'Organization',
                description,
                requirements
            });

            alert('Job posted successfully!');
            document.getElementById('jobTitle').value = '';
            document.getElementById('jobDescription').value = '';
            document.getElementById('jobRequirements').value = '';
            this.loadStudentsForOrg();
        } catch (error) {
            alert('Error posting job: ' + error.message);
        }
    }

    async searchStudents() {
        const searchTerm = document.getElementById('searchStudents').value.toLowerCase();
        const skillsFilter = document.getElementById('filterSkills').value.toLowerCase().split(',').map(s => s.trim()).filter(s => s);

        try {
            const users = await this.api.getUsers();
            let filtered = users.filter(u => u.role === 'student');

            if (searchTerm) {
                filtered = filtered.filter(u => 
                    u.name.toLowerCase().includes(searchTerm) || 
                    u.email.toLowerCase().includes(searchTerm)
                );
            }

            if (skillsFilter.length > 0) {
                filtered = filtered.filter(u => {
                    const userSkills = (u.skills || []).map(s => s.toLowerCase());
                    return skillsFilter.some(skill => userSkills.includes(skill));
                });
            }

            const studentList = document.getElementById('studentList');
            if (filtered.length === 0) {
                studentList.innerHTML = '<p class="text-gray-500 text-center py-8">No students found matching your criteria.</p>';
                return;
            }

            studentList.innerHTML = filtered.map(student => {
                return '<div class="border rounded-lg p-4 hover:shadow-lg transition"><div class="flex justify-between items-start"><div class="flex-1"><h3 class="font-bold text-gray-900">' + student.name + '</h3><p class="text-sm text-gray-600">' + student.email + '</p><p class="text-sm text-gray-600">' + (student.institution || 'N/A') + ' - ' + (student.occupation || 'N/A') + '</p>' + (student.skills && student.skills.length ? '<div class="mt-2 flex flex-wrap gap-1">' + student.skills.map(skill => '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">' + skill + '</span>').join('') + '</div>' : '') + '</div><button class="bg-emerald-600 text-white px-3 py-2 rounded text-sm font-bold hover:bg-emerald-700 transition view-cv-btn" data-student-id="' + student._id + '">View CV</button></div></div>';
            }).join('');

            document.querySelectorAll('.view-cv-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const studentId = e.target.getAttribute('data-student-id');
                    this.viewStudentCV(studentId);
                });
            });
        } catch (error) {
            alert('Error searching students: ' + error.message);
        }
    }

    async loadJobs() {
        try {
            const jobs = await this.api.getJobs();
            this.allJobs = jobs;
            this.filteredJobs = jobs;

            const jobList = document.getElementById('jobList');
            if (!jobList) return;

            if (jobs.length === 0) {
                jobList.innerHTML = '<p class="text-gray-500 text-center py-8">No jobs available.</p>';
                const jobCount = document.getElementById('jobCount');
                if (jobCount) jobCount.textContent = '0';
                return;
            }

            const jobCount = document.getElementById('jobCount');
            if (jobCount) jobCount.textContent = jobs.length;

            jobList.innerHTML = jobs.map(job => {
                const reqsHtml = (job.requirements && job.requirements.length) ? '<div class="mb-3"><strong class="text-sm text-gray-700">Requirements:</strong><ul class="list-disc list-inside text-sm text-gray-600 mt-2">' + job.requirements.map(req => '<li>' + req + '</li>').join('') + '</ul></div>' : '';
                return '<div class="border rounded-lg p-4 hover:shadow-lg transition"><div class="flex justify-between items-start mb-2"><div><h3 class="text-lg font-bold text-gray-900">' + job.title + '</h3><p class="text-sm text-gray-600">' + job.company + '</p></div><span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">New</span></div><p class="text-gray-700 text-sm mb-4">' + job.description.substring(0, 150) + (job.description.length > 150 ? '...' : '') + '</p>' + reqsHtml + '<button class="bg-blue-600 text-white px-4 py-2 rounded text-sm apply-btn font-bold hover:bg-blue-700 transition" data-job-id="' + job._id + '">Apply Now 🚀</button></div>';
            }).join('');

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
                applicationList.innerHTML = '<p class="text-gray-500 text-center py-8">No applications yet.</p>';
                const appCount = document.getElementById('appCount');
                if (appCount) appCount.textContent = '0';
                return;
            }

            const appCount = document.getElementById('appCount');
            if (appCount) appCount.textContent = applications.length;

            applicationList.innerHTML = applications.map(app => {
                const statusColor = app.status === 'Accepted' ? 'bg-green-100 text-green-800' : app.status === 'Rejected' ? 'bg-red-100 text-red-800' : app.status === 'Reviewed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
                return '<div class="border rounded-lg p-4 bg-gray-50"><div class="flex justify-between items-start mb-2"><div><h3 class="font-bold text-gray-900">' + app.jobTitle + '</h3><p class="text-sm text-gray-600">' + app.company + '</p></div><span class="px-3 py-1 rounded-full text-xs font-bold ' + statusColor + '">' + app.status + '</span></div><p class="text-xs text-gray-500">Applied: ' + new Date(app.appliedAt).toLocaleDateString() + '</p></div>';
            }).join('');
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
                taskList.innerHTML = '<p class="text-gray-500 text-center py-8">No tasks assigned.</p>';
                const taskCount = document.getElementById('taskCount');
                if (taskCount) taskCount.textContent = '0';
                return;
            }

            const taskCount = document.getElementById('taskCount');
            if (taskCount) taskCount.textContent = tasks.filter(t => t.status === 'Pending').length;

            taskList.innerHTML = tasks.map(task => {
                const statusColor = task.status === 'Completed' ? 'bg-green-100 text-green-800' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
                return '<div class="border-l-4 border-orange-500 bg-orange-50 p-4 rounded"><h3 class="font-bold text-gray-900">' + task.description + '</h3><div class="flex justify-between items-center mt-2"><p class="text-xs text-gray-600">Due: ' + new Date(task.dueDate).toLocaleDateString() + '</p><span class="px-2 py-1 rounded text-xs font-bold ' + statusColor + '">' + task.status + '</span></div></div>';
            }).join('');
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    async loadUsers() {
        try {
            const users = await this.api.getUsers();
            const userList = document.getElementById('userList');

            if (!userList) return;

            if (users.length === 0) {
                userList.innerHTML = '<p class="text-gray-500">No users found.</p>';
                return;
            }

            const userCount = document.getElementById('userCount');
            if (userCount) userCount.textContent = users.length;

            userList.innerHTML = users.map(user => '<div class="p-3 bg-gray-50 rounded border"><p class="font-bold text-gray-900">' + user.name + '</p><p class="text-sm text-gray-600">' + user.email + '</p><p class="text-xs text-gray-500">' + (user.role || 'student') + ' • ' + (user.institution || 'N/A') + '</p></div>').join('');
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    async loadAllApplications() {
        try {
            const applications = await this.api.getAllApplications();
            const appsList = document.getElementById('allApplicationsList');

            if (!appsList) return;

            if (applications.length === 0) {
                appsList.innerHTML = '<p class="text-gray-500">No applications.</p>';
                return;
            }

            const totalApps = document.getElementById('totalApps');
            if (totalApps) totalApps.textContent = applications.length;

            appsList.innerHTML = applications.map(app => '<div class="p-3 bg-gray-50 rounded border"><p class="font-bold text-gray-900">' + app.jobTitle + ' - ' + app.company + '</p><p class="text-sm text-gray-600">' + app.status + '</p></div>').join('');
        } catch (error) {
            console.error('Error loading applications:', error);
        }
    }

    async loadInstitutions() {
        try {
            const institutions = await this.api.getInstitutions();
            const sel = document.getElementById('institution');

            if (sel && Array.isArray(institutions)) {
                sel.innerHTML = '<option value="">Select institution</option>';
                institutions.forEach(inst => {
                    const opt = document.createElement('option');
                    opt.value = inst.name || inst;
                    opt.textContent = inst.name || inst;
                    sel.appendChild(opt);
                });
            }
        } catch (error) {
            console.error('Error loading institutions:', error);
        }
    }

    async loadStudentsForTasks() {
        try {
            const users = await this.api.getUsers();
            const sel = document.getElementById('taskStudent');

            if (sel) {
                sel.innerHTML = '<option value="">Select a student</option>';
                users.filter(u => u.role !== 'admin').forEach(user => {
                    const opt = document.createElement('option');
                    opt.value = user._id;
                    opt.textContent = user.name;
                    sel.appendChild(opt);
                });
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    async loadAdminStats() {
        try {
            const [users, jobs, apps, tasks] = await Promise.all([
                this.api.getUsers(),
                this.api.getJobs(),
                this.api.getAllApplications(),
                this.api.getTasks()
            ]);

            if (document.getElementById('userCount')) document.getElementById('userCount').textContent = users.length;
            if (document.getElementById('totalJobs')) document.getElementById('totalJobs').textContent = jobs.length;
            if (document.getElementById('totalApps')) document.getElementById('totalApps').textContent = apps.length;
            if (document.getElementById('totalTasks')) document.getElementById('totalTasks').textContent = tasks.length;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async saveStudentProfile() {
        try {
            const institution = document.getElementById('institution').value;
            const occupation = document.getElementById('occupation').value;
            const skillsStr = document.getElementById('skills').value;
            const experience = document.getElementById('experience').value;
            const cv = document.getElementById('cvText').value;

            const skills = skillsStr.split(',').map(s => s.trim()).filter(s => s);

            await this.api.updateUserProfile(this.currentUser.id, { 
                institution, 
                occupation, 
                skills, 
                experience, 
                cv,
                cvFilename: 'CV_' + (this.currentUser.name || 'Student').replace(/\s+/g, '_') + '.txt'
            });

            this.currentUser.institution = institution;
            this.currentUser.occupation = occupation;
            this.currentUser.skills = skills;
            this.currentUser.experience = experience;
            this.currentUser.cv = cv;

            alert('Profile updated successfully!');
            this.updateProfileStrength();
        } catch (error) {
            alert(error.message);
        }
    }

    updateProfileStrength() {
        let strength = 0;
        if (this.currentUser && this.currentUser.name) strength += 20;
        if (this.currentUser && this.currentUser.institution) strength += 20;
        if (this.currentUser && this.currentUser.occupation) strength += 20;
        if (this.currentUser && this.currentUser.skills && this.currentUser.skills.length > 0) strength += 20;
        if (this.currentUser && this.currentUser.cv) strength += 20;

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
        const searchTerm = (document.getElementById('jobSearch') ? document.getElementById('jobSearch').value : '').toLowerCase();
        const companyFilter = (document.getElementById('companyFilter') ? document.getElementById('companyFilter').value : '').toLowerCase();
        const sortBy = document.getElementById('sortBy') ? document.getElementById('sortBy').value : 'recent';

        let filtered = this.allJobs.filter(job => {
            const titleMatch = job.title.toLowerCase().includes(searchTerm);
            const companyMatch = !companyFilter || job.company.toLowerCase().includes(companyFilter);
            return titleMatch && companyMatch;
        });

        if (sortBy === 'company') {
            filtered.sort((a, b) => a.company.localeCompare(b.company));
        } else if (sortBy === 'title') {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
        } else {
            filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }

        this.filteredJobs = filtered;

        const jobList = document.getElementById('jobList');
        if (!jobList) return;

        if (filtered.length === 0) {
            jobList.innerHTML = '<p class="text-gray-500 text-center py-8">No jobs match your filters.</p>';
            return;
        }

        jobList.innerHTML = filtered.map(job => {
            const reqsHtml = (job.requirements && job.requirements.length) ? '<div class="mb-3"><strong class="text-sm text-gray-700">Requirements:</strong><ul class="list-disc list-inside text-sm text-gray-600 mt-2">' + job.requirements.map(req => '<li>' + req + '</li>').join('') + '</ul></div>' : '';
            return '<div class="border rounded-lg p-4 hover:shadow-lg transition"><div class="flex justify-between items-start mb-2"><div><h3 class="text-lg font-bold text-gray-900">' + job.title + '</h3><p class="text-sm text-gray-600">' + job.company + '</p></div><span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">New</span></div><p class="text-gray-700 text-sm mb-4">' + job.description.substring(0, 150) + (job.description.length > 150 ? '...' : '') + '</p>' + reqsHtml + '<button class="bg-blue-600 text-white px-4 py-2 rounded text-sm apply-btn font-bold hover:bg-blue-700 transition" data-job-id="' + job._id + '">Apply Now 🚀</button></div>';
        }).join('');

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
