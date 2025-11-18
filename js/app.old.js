// Updated App State with Backend Integration
class AppState {
    constructor() {
        this.api = apiClient;
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check if user is already authenticated
        if (this.api.token) {
            try {
                this.currentUser = await this.api.getCurrentUser();
                if (this.currentUser.role === 'admin') {
                    this.renderAdminDashboard();
                } else {
                    this.renderDashboard();
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
            if (user.role === 'admin') {
                this.renderAdminDashboard();
            } else {
                this.renderDashboard();
            }
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
                this.renderDashboard();
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
        const content = `
            <div class="text-center py-16">
                <h1 class="text-4xl font-bold mb-4">Welcome to Nikhire</h1>
                <p class="text-xl text-gray-600 mb-8">Your campus recruitment solution</p>

                <div class="max-w-md mx-auto">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="Email">
                    </div>

                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Password</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="Password">
                    </div>

                    <div class="flex items-center justify-between">
                        <button id="loginSubmit" class="btn-primary px-4 py-2 rounded font-bold text-white focus:outline-none focus:shadow-outline">Login</button>
                        <button id="registerSubmit" class="btn-secondary px-4 py-2 rounded font-bold text-white focus:outline-none focus:shadow-outline">Register</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('appContent').innerHTML = content;

        document.getElementById('loginSubmit').addEventListener('click', () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            this.loginUser(email, password);
        });

        document.getElementById('registerSubmit').addEventListener('click', () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const name = prompt('Please enter your name:');
            if (name) {
                this.registerUser({ email, password, name, role: 'student' });
            }
        });
    }

    renderDashboard() {
        const content = `
            <div class="py-8">
                <div class="flex justify-between items-center mb-8">
                    <h1 class="text-3xl font-bold">Welcome, ${this.currentUser.name}</h1>
                    <button id="logoutBtn" class="btn-primary px-4 py-2 rounded">Logout</button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 class="text-2xl font-bold mb-4">Available Jobs</h2>
                        <div id="jobList">
                            <!-- Jobs will be loaded here -->
                        </div>
                    </div>

                    <div>
                        <h2 class="text-2xl font-bold mb-4">Your Applications</h2>
                        <div id="applicationList">
                            <!-- Applications will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="mt-8">
                    <h2 class="text-2xl font-bold mb-4">Your Tasks</h2>
                    <div id="taskList">
                        <!-- Tasks will be loaded here -->
                    </div>
                </div>

                <div class="mt-8">
                    <h2 class="text-2xl font-bold mb-4">Your Profile</h2>
                    <div id="profileSection">
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="institution">Institution</label>
                            <select class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="institution">
                                <option value="">Select your institution</option>
                            </select>
                            <button id="addInstitutionBtn" class="btn-secondary px-4 py-2 rounded mt-2">Add New Institution</button>
                        </div>

                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="occupation">Occupation</label>
                            <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="occupation" type="text" placeholder="Your desired occupation">
                        </div>

                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="profileImage">Profile Image</label>
                            <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="profileImage" type="file" accept="image/*">
                        </div>

                        <button id="saveProfileBtn" class="btn-primary px-4 py-2 rounded">Save Profile</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('appContent').innerHTML = content;

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('addInstitutionBtn').addEventListener('click', () => {
            const newInstitution = prompt('Enter the name of your institution:');
            if (newInstitution) {
                this.api.addInstitution(newInstitution).then(() => {
                    this.loadInstitutions();
                }).catch(error => alert(error.message));
            }
        });

        document.getElementById('saveProfileBtn').addEventListener('click', () => {
            const institution = document.getElementById('institution').value;
            const occupation = document.getElementById('occupation').value;
            const profileImage = document.getElementById('profileImage').files[0];

            if (institution && occupation) {
                const profileData = { institution, occupation };
                
                if (profileImage) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        profileData.profileImage = e.target.result;
                        this.api.updateUserProfile(this.currentUser.id, profileData)
                            .then(() => {
                                alert('Profile updated successfully!');
                                this.currentUser.institution = institution;
                                this.currentUser.occupation = occupation;
                            })
                            .catch(error => alert(error.message));
                    };
                    reader.readAsDataURL(profileImage);
                } else {
                    this.api.updateUserProfile(this.currentUser.id, profileData)
                        .then(() => {
                            alert('Profile updated successfully!');
                            this.currentUser.institution = institution;
                            this.currentUser.occupation = occupation;
                        })
                        .catch(error => alert(error.message));
                }
            } else {
                alert('Please fill in all fields');
            }
        });

        this.loadJobs();
        this.loadApplications();
        this.loadTasks();
        this.loadInstitutions();
    }

    renderAdminDashboard() {
        const content = `
            <div class="py-8">
                <div class="flex justify-between items-center mb-8">
                    <h1 class="text-3xl font-bold">Admin Dashboard</h1>
                    <button id="logoutBtn" class="btn-primary px-4 py-2 rounded">Logout</button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 class="text-2xl font-bold mb-4">All Users</h2>
                        <div id="userList">
                            <!-- Users will be loaded here -->
                        </div>
                    </div>

                    <div>
                        <h2 class="text-2xl font-bold mb-4">All Applications</h2>
                        <div id="allApplicationsList">
                            <!-- All applications will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="mt-8">
                    <h2 class="text-2xl font-bold mb-4">Add New Job</h2>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="jobTitle">Job Title</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="jobTitle" type="text" placeholder="Job Title">
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="jobCompany">Company</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="jobCompany" type="text" placeholder="Company">
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="jobDescription">Description</label>
                        <textarea class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="jobDescription" placeholder="Job Description"></textarea>
                    </div>

                    <button id="addJobBtn" class="btn-secondary px-4 py-2 rounded">Add Job</button>
                </div>

                <div class="mt-8">
                    <h2 class="text-2xl font-bold mb-4">Assign Task to Student</h2>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="taskStudent">Student</label>
                        <select class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="taskStudent">
                            <option value="">Select a student</option>
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="taskDescription">Task Description</label>
                        <textarea class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="taskDescription" placeholder="Task Description"></textarea>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="taskDueDate">Due Date</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="taskDueDate" type="date">
                    </div>

                    <button id="assignTaskBtn" class="btn-secondary px-4 py-2 rounded">Assign Task</button>
                </div>
            </div>
        `;

        document.getElementById('appContent').innerHTML = content;

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('addJobBtn').addEventListener('click', () => {
            const title = document.getElementById('jobTitle').value;
            const company = document.getElementById('jobCompany').value;
            const description = document.getElementById('jobDescription').value;

            if (title && company && description) {
                this.addJob({ title, company, description });
            } else {
                alert('Please fill in all fields');
            }
        });

        document.getElementById('assignTaskBtn').addEventListener('click', () => {
            const student = document.getElementById('taskStudent').value;
            const description = document.getElementById('taskDescription').value;
            const dueDate = document.getElementById('taskDueDate').value;

            if (student && description && dueDate) {
                this.assignTask({ studentId: student, description, dueDate });
            } else {
                alert('Please fill in all fields');
            }
        });

        this.loadUsers();
        this.loadAllApplications();
        this.loadStudentsForTasks();
    }

    async loadJobs() {
        try {
            const jobs = await this.api.getJobs();
            const jobList = document.getElementById('jobList');

            if (jobs.length === 0) {
                jobList.innerHTML = '<p class="text-gray-600">No jobs available at the moment.</p>';
                return;
            }

            jobList.innerHTML = jobs.map(job => `
                <div class="bg-white p-4 rounded shadow mb-4">
                    <h3 class="text-xl font-bold mb-2">${job.title}</h3>
                    <p class="text-gray-600 mb-2">${job.company}</p>
                    <p class="text-gray-600 mb-4">${job.description}</p>
                    <button class="btn-accent px-3 py-1 rounded text-sm apply-btn" data-job-id="${job._id}">Apply</button>
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
            document.getElementById('jobList').innerHTML = '<p class="text-red-600">Error loading jobs</p>';
        }
    }

    async loadApplications() {
        try {
            const applications = await this.api.getApplications();
            const applicationList = document.getElementById('applicationList');

            if (applications.length === 0) {
                applicationList.innerHTML = '<p class="text-gray-600">You haven\'t applied to any jobs yet.</p>';
                return;
            }

            applicationList.innerHTML = applications.map(app => `
                <div class="bg-white p-4 rounded shadow mb-4">
                    <h3 class="text-xl font-bold mb-2">${app.jobTitle}</h3>
                    <p class="text-gray-600 mb-2">${app.company}</p>
                    <p class="text-gray-600 mb-2">Status: ${app.status}</p>
                    <p class="text-gray-600 text-sm">Applied on: ${new Date(app.appliedAt).toLocaleDateString()}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading applications:', error);
            document.getElementById('applicationList').innerHTML = '<p class="text-red-600">Error loading applications</p>';
        }
    }

    async loadTasks() {
        try {
            const tasks = await this.api.getTasks();
            const taskList = document.getElementById('taskList');

            if (tasks.length === 0) {
                taskList.innerHTML = '<p class="text-gray-600">You don\'t have any tasks yet.</p>';
                return;
            }

            taskList.innerHTML = tasks.map(task => `
                <div class="bg-white p-4 rounded shadow mb-4">
                    <h3 class="text-xl font-bold mb-2">${task.description}</h3>
                    <p class="text-gray-600 mb-2">Due: ${new Date(task.dueDate).toLocaleDateString()}</p>
                    <p class="text-gray-600 mb-2">Status: ${task.status}</p>
                    <p class="text-gray-600 text-sm">Assigned by: ${task.assignedBy.name}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading tasks:', error);
            document.getElementById('taskList').innerHTML = '<p class="text-red-600">Error loading tasks</p>';
        }
    }

    async loadInstitutions() {
        try {
            const institutions = await this.api.getInstitutions();
            const institutionSelect = document.getElementById('institution');

            institutionSelect.innerHTML = '<option value="">Select your institution</option>' +
                institutions.map(inst => `<option value="${inst.name}">${inst.name}</option>`).join('');
        } catch (error) {
            console.error('Error loading institutions:', error);
        }
    }

    async loadUsers() {
        try {
            const users = await this.api.getUsers();
            const userList = document.getElementById('userList');

            if (users.length === 0) {
                userList.innerHTML = '<p class="text-gray-600">No users registered yet.</p>';
                return;
            }

            userList.innerHTML = users.map(user => `
                <div class="bg-white p-4 rounded shadow mb-4">
                    <h3 class="text-xl font-bold mb-2">${user.name}</h3>
                    <p class="text-gray-600 mb-2">${user.email}</p>
                    <p class="text-gray-600 mb-2">Role: ${user.role}</p>
                    <p class="text-gray-600 mb-2">Institution: ${user.institution || 'Not set'}</p>
                    <p class="text-gray-600 mb-2">Occupation: ${user.occupation || 'Not set'}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading users:', error);
            document.getElementById('userList').innerHTML = '<p class="text-red-600">Error loading users</p>';
        }
    }

    async loadAllApplications() {
        try {
            const applications = await this.api.getAllApplications();
            const applicationList = document.getElementById('allApplicationsList');

            if (applications.length === 0) {
                applicationList.innerHTML = '<p class="text-gray-600">No applications submitted yet.</p>';
                return;
            }

            applicationList.innerHTML = applications.map(app => `
                <div class="bg-white p-4 rounded shadow mb-4">
                    <h3 class="text-xl font-bold mb-2">${app.jobTitle}</h3>
                    <p class="text-gray-600 mb-2">${app.company}</p>
                    <p class="text-gray-600 mb-2">Applied by: ${app.userId.name}</p>
                    <p class="text-gray-600 mb-2">Status: ${app.status}</p>
                    <p class="text-gray-600 text-sm">Applied on: ${new Date(app.appliedAt).toLocaleDateString()}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading applications:', error);
            document.getElementById('allApplicationsList').innerHTML = '<p class="text-red-600">Error loading applications</p>';
        }
    }

    async loadStudentsForTasks() {
        try {
            const users = await this.api.getUsers();
            const students = users.filter(user => user.role === 'student');
            const studentSelect = document.getElementById('taskStudent');

            studentSelect.innerHTML = '<option value="">Select a student</option>' +
                students.map(student => `<option value="${student._id}">${student.name}</option>`).join('');
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    async addJob(jobData) {
        try {
            await this.api.createJob(jobData);
            alert('Job added successfully!');

            document.getElementById('jobTitle').value = '';
            document.getElementById('jobCompany').value = '';
            document.getElementById('jobDescription').value = '';

            this.loadJobs();
        } catch (error) {
            alert(error.message);
        }
    }

    async assignTask(taskData) {
        try {
            await this.api.createTask(taskData);
            alert('Task assigned successfully!');

            document.getElementById('taskStudent').value = '';
            document.getElementById('taskDescription').value = '';
            document.getElementById('taskDueDate').value = '';
        } catch (error) {
            alert(error.message);
        }
    }

    async applyForJob(jobId) {
        try {
            await this.api.applyForJob(jobId);
            this.loadApplications();
            alert('Application submitted successfully!');
        } catch (error) {
            alert(error.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AppState();
});
