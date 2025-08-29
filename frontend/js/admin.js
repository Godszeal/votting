document.addEventListener('DOMContentLoaded', () => {
    // Check authentication and admin role
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }
    
    // Verify admin role
    const verifyAdmin = async () => {
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                localStorage.removeItem('token');
                window.location.href = '../login.html';
                return false;
            }
            
            const data = await response.json();
            if (data.success && data.data.role === 'admin') {
                return true;
            } else {
                alert('You do not have permission to access this page.');
                window.location.href = '../dashboard.html';
                return false;
            }
        } catch (error) {
            console.error('Admin verification error:', error);
            localStorage.removeItem('token');
            window.location.href = '../login.html';
            return false;
        }
    };
    
    // Set auth header for all fetch requests
    const authFetch = async (url, options = {}) => {
        const token = localStorage.getItem('token');
        if (!options.headers) {
            options.headers = {};
        }
        options.headers['Authorization'] = `Bearer ${token}`;
        options.headers['Content-Type'] = 'application/json';
        
        try {
            const response = await fetch(url, options);
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                window.location.href = '../login.html';
                return null;
            }
            if (response.status === 403) {
                // Not authorized
                alert('You do not have permission to perform this action.');
                return null;
            }
            return response;
        } catch (error) {
            console.error('Network error:', error);
            throw error;
        }
    };
    
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Profile dropdown toggle
    const profileDropdown = document.querySelector('.profile-dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (profileDropdown) {
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
    }
    
    // Logout functionality
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                window.location.href = '../login.html';
            }
        });
    }
    
    // Initialize admin data
    const initializeAdminData = async () => {
        try {
            const response = await authFetch('/api/auth/me');
            if (!response) return;
            
            const data = await response.json();
            if (data.success) {
                const user = data.data;
                
                // Update profile elements
                document.querySelectorAll('.username').forEach(el => {
                    el.textContent = user.username;
                });
                
                if (document.querySelector('.user-profile img')) {
                    document.querySelector('.user-profile img').src = `../images/avatars/${user.avatar}`;
                }
                
                if (document.querySelector('.user-profile p')) {
                    document.querySelector('.user-profile p').textContent = user.email;
                }
            }
        } catch (error) {
            console.error('Error fetching admin ', error);
        }
    };
    
    // Initialize dashboard stats
    const initializeDashboardStats = async () => {
        try {
            const statsContainer = document.querySelector('.dashboard-stats');
            if (!statsContainer) return;
            
            // Show loading state
            statsContainer.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i> Loading statistics...
                </div>
            `;
            
            const [usersRes, electionsRes, votesRes] = await Promise.all([
                authFetch('/api/admin/users'),
                authFetch('/api/admin/elections'),
                authFetch('/api/users/voting-history')
            ]);
            
            if (!usersRes || !electionsRes || !votesRes) {
                statsContainer.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i> Failed to load statistics
                    </div>
                `;
                return;
            }
            
            const [usersData, electionsData, votesData] = await Promise.all([
                usersRes.json(),
                electionsRes.json(),
                votesRes.json()
            ]);
            
            if (!usersData.success || !electionsData.success || !votesData.success) {
                statsContainer.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i> Failed to load statistics
                    </div>
                `;
                return;
            }
            
            // Calculate stats
            const totalUsers = usersData.data.length;
            const activeElections = electionsData.data.filter(e => e.isActive).length;
            const totalVotes = votesData.data.reduce((sum, election) => sum + election.votes, 0);
            const totalEligibleVoters = totalUsers; // In a real app, this would be more complex
            
            const votingRate = totalEligibleVoters > 0 
                ? ((totalVotes / totalEligibleVoters) * 100).toFixed(1) + '%' 
                : '0%';
            
            // Update stats
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon bg-primary">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${totalUsers}</h3>
                        <p>Registered Voters</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon bg-success">
                        <i class="fas fa-vote-yea"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${activeElections}</h3>
                        <p>Active Elections</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon bg-warning">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${votingRate}</h3>
                        <p>Voting Rate</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon bg-danger">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="stat-info">
                        <h3>100%</h3>
                        <p>Secure Votes</p>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            const statsContainer = document.querySelector('.dashboard-stats');
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i> Failed to load statistics
                    </div>
                `;
            }
        }
    };
    
    // Initialize election chart
    const initializeElectionChart = async () => {
        const electionChartCtx = document.getElementById('electionChart');
        if (!electionChartCtx) return;
        
        try {
            const response = await authFetch('/api/admin/elections');
            if (!response) return;
            
            const data = await response.json();
            if (!data.success) return;
            
            // Calculate election status counts
            const activeCount = data.data.filter(e => e.isActive).length;
            const upcomingCount = data.data.filter(e => {
                const now = new Date();
                return new Date(e.startDate) > now && e.isActive;
            }).length;
            const completedCount = data.data.filter(e => !e.isActive || new Date(e.endDate) < new Date()).length;
            
            // Create chart
            new Chart(electionChartCtx, {
                type: 'doughnut',
                 {
                    labels: ['Active', 'Upcoming', 'Completed'],
                    datasets: [{
                         [activeCount, upcomingCount, completedCount],
                        backgroundColor: [
                            '#4cc9f0',
                            '#f8961e',
                            '#4361ee'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading election chart:', error);
        }
    };
    
    // Initialize recent elections table
    const initializeRecentElections = async () => {
        const tableBody = document.querySelector('.table-responsive table tbody');
        if (!tableBody) return;
        
        try {
            // Show loading state
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        <i class="fas fa-spinner fa-spin"></i> Loading elections...
                    </td>
                </tr>
            `;
            
            const response = await authFetch('/api/admin/elections');
            if (!response) return;
            
            const data = await response.json();
            if (!data.success) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 20px;">
                            Failed to load elections
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Sort by most recent
            const sortedElections = [...data.data].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            ).slice(0, 4);
            
            if (sortedElections.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 20px;">
                            No elections found
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Populate table
            tableBody.innerHTML = '';
            sortedElections.forEach(election => {
                const now = new Date();
                const startDate = new Date(election.startDate);
                const endDate = new Date(election.endDate);
                
                let status = 'completed';
                if (election.isActive && now >= startDate && now <= endDate) {
                    status = 'active';
                } else if (election.isActive && now < startDate) {
                    status = 'upcoming';
                }
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${election.title}</td>
                    <td>${election.faculty}</td>
                    <td>${election.department}</td>
                    <td><span class="status ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                    <td>
                        <button class="action-btn edit" title="Edit" data-id="${election._id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn view" title="View" data-id="${election._id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn delete" title="Delete" data-id="${election._id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            // Add event listeners to action buttons
            document.querySelectorAll('.action-btn.edit').forEach(button => {
                button.addEventListener('click', (e) => {
                    const electionId = e.target.closest('button').dataset.id;
                    window.location.href = `../admin/edit-election.html?id=${electionId}`;
                });
            });
            
            document.querySelectorAll('.action-btn.view').forEach(button => {
                button.addEventListener('click', (e) => {
                    const electionId = e.target.closest('button').dataset.id;
                    window.location.href = `../admin/results.html?id=${electionId}`;
                });
            });
            
            document.querySelectorAll('.action-btn.delete').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const electionId = e.target.closest('button').dataset.id;
                    const row = e.target.closest('tr');
                    
                    if (!confirm('Are you sure you want to delete this election? This action cannot be undone.')) {
                        return;
                    }
                    
                    try {
                        const response = await authFetch(`/api/admin/elections/${electionId}`, {
                            method: 'DELETE'
                        });
                        
                        if (!response) return;
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                            // Remove row with animation
                            row.style.opacity = '0';
                            row.style.transform = 'translateX(20px)';
                            setTimeout(() => {
                                row.remove();
                                
                                // Show message if no elections left
                                if (document.querySelectorAll('.table-responsive table tbody tr').length === 0) {
                                    document.querySelector('.table-responsive table tbody').innerHTML = `
                                        <tr>
                                            <td colspan="5" style="text-align: center; padding: 20px;">
                                                No elections found
                                            </td>
                                        </tr>
                                    `;
                                }
                            }, 300);
                        } else {
                            alert(data.message || 'Failed to delete election. Please try again.');
                        }
                    } catch (error) {
                        console.error('Delete election error:', error);
                        alert('Network error. Please check your connection.');
                    }
                });
            });
        } catch (error) {
            console.error('Error loading recent elections:', error);
            const tableBody = document.querySelector('.table-responsive table tbody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 20px;">
                            Failed to load elections
                        </td>
                    </tr>
                `;
            }
        }
    };
    
    // Initialize create election page
    const initializeCreateElection = () => {
        const facultySelect = document.getElementById('faculty');
        const departmentSelect = document.getElementById('department');
        
        if (facultySelect && departmentSelect) {
            const departmentsByFaculty = {
                'Engineering': ['All Departments', 'Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering'],
                'Science': ['All Departments', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Geology'],
                'Arts': ['All Departments', 'English', 'History', 'Philosophy', 'Theatre Arts', 'Fine Arts'],
                'Medicine': ['All Departments', 'Medicine', 'Dentistry', 'Nursing', 'Pharmacy', 'Public Health'],
                'Business': ['All Departments', 'Accounting', 'Finance', 'Marketing', 'Management', 'Economics'],
                'All Faculties': ['All Departments']
            };
            
            facultySelect.addEventListener('change', () => {
                const selectedFaculty = facultySelect.value;
                departmentSelect.innerHTML = '<option value="">Select Department</option>';
                
                if (selectedFaculty && departmentsByFaculty[selectedFaculty]) {
                    departmentsByFaculty[selectedFaculty].forEach(dept => {
                        const option = document.createElement('option');
                        option.value = dept;
                        option.textContent = dept;
                        departmentSelect.appendChild(option);
                    });
                }
            });
            
            // Initialize faculty select
            facultySelect.dispatchEvent(new Event('change'));
        }
        
        // Add candidate functionality
        const addCandidateBtn = document.getElementById('add-candidate');
        const candidatesContainer = document.getElementById('candidates-container');
        let candidateCount = 0;
        
        if (addCandidateBtn && candidatesContainer) {
            addCandidateBtn.addEventListener('click', () => {
                candidateCount++;
                
                const candidateDiv = document.createElement('div');
                candidateDiv.className = 'candidate-item';
                candidateDiv.dataset.id = candidateCount;
                
                candidateDiv.innerHTML = `
                    <div class="candidate-header">
                        <h4>Candidate #${candidateCount}</h4>
                        <button type="button" class="remove-candidate">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="form-row">
                        <div class="form-group half">
                            <label>Name</label>
                            <input type="text" name="candidate-name-${candidateCount}" placeholder="Candidate's full name" required>
                        </div>
                        <div class="form-group half">
                            <label>Matric Number</label>
                            <input type="text" name="candidate-matric-${candidateCount}" placeholder="10-digit matric number" maxlength="10" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group half">
                            <label>Faculty</label>
                            <select name="candidate-faculty-${candidateCount}" required>
                                <option value="">Select Faculty</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Science">Science</option>
                                <option value="Arts">Arts</option>
                                <option value="Medicine">Medicine</option>
                                <option value="Business">Business</option>
                            </select>
                        </div>
                        <div class="form-group half">
                            <label>Department</label>
                            <select name="candidate-department-${candidateCount}" required>
                                <option value="">Select Department</option>
                                <!-- Options will be populated based on faculty selection -->
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Profile Image</label>
                        <div class="file-upload">
                            <input type="file" name="candidate-image-${candidateCount}" accept="image/*">
                            <span class="file-name">No file chosen</span>
                            <button class="btn secondary">Choose File</button>
                        </div>
                    </div>
                `;
                
                candidatesContainer.appendChild(candidateDiv);
                
                // Setup file upload
                const fileInput = candidateDiv.querySelector('input[type="file"]');
                const fileName = candidateDiv.querySelector('.file-name');
                
                fileInput.addEventListener('change', () => {
                    if (fileInput.files.length > 0) {
                        fileName.textContent = fileInput.files[0].name;
                    } else {
                        fileName.textContent = 'No file chosen';
                    }
                });
                
                // Setup remove candidate
                const removeBtn = candidateDiv.querySelector('.remove-candidate');
                removeBtn.addEventListener('click', () => {
                    candidateDiv.remove();
                });
            });
        }
        
        // Add initial candidate
        if (addCandidateBtn) {
            addCandidateBtn.click();
        }
        
        // Form submission
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', async () => {
                const title = document.getElementById('title').value;
                const description = document.getElementById('description').value;
                const faculty = document.getElementById('faculty').value;
                const department = document.getElementById('department').value;
                const position = document.getElementById('position').value;
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;
                
                // Validate required fields
                if (!title || !description || !faculty || !department || !startDate || !endDate) {
                    alert('Please fill in all required fields');
                    return;
                }
                
                if (new Date(endDate) <= new Date(startDate)) {
                    alert('End date must be after start date');
                    return;
                }
                
                // Get candidates
                const candidateElements = document.querySelectorAll('.candidate-item');
                if (candidateElements.length === 0) {
                    alert('Please add at least one candidate');
                    return;
                }
                
                const candidates = [];
                let hasInvalidCandidate = false;
                
                candidateElements.forEach((candidateEl, index) => {
                    const name = candidateEl.querySelector(`[name="candidate-name-${index + 1}"]`).value;
                    const matricNumber = candidateEl.querySelector(`[name="candidate-matric-${index + 1}"]`).value;
                    const faculty = candidateEl.querySelector(`[name="candidate-faculty-${index + 1}"]`).value;
                    const department = candidateEl.querySelector(`[name="candidate-department-${index + 1}"]`).value;
                    
                    // Validate candidate
                    if (!name || !matricNumber || !faculty || !department) {
                        hasInvalidCandidate = true;
                        return;
                    }
                    
                    if (!/^\d{10}$/.test(matricNumber)) {
                        hasInvalidCandidate = true;
                        return;
                    }
                    
                    candidates.push({
                        name,
                        position,
                        faculty,
                        department
                    });
                });
                
                if (hasInvalidCandidate) {
                    alert('Please fill in all candidate details correctly');
                    return;
                }
                
                if (candidates.length < 2) {
                    alert('At least two candidates are required for an election');
                    return;
                }
                
                if (!confirm(`Are you sure you want to create the election "${title}"?`)) {
                    return;
                }
                
                try {
                    // Show loading state
                    const originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating election...';
                    submitBtn.disabled = true;
                    
                    const response = await authFetch('/api/admin/elections', {
                        method: 'POST',
                        body: JSON.stringify({
                            title,
                            description,
                            faculty,
                            department,
                            candidates,
                            startDate,
                            endDate
                        })
                    });
                    
                    if (!response) {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                        return;
                    }
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        alert('Election created successfully!');
                        window.location.href = 'manage-elections.html';
                    } else {
                        alert(data.message || 'Failed to create election. Please try again.');
                        
                        // Reset button state
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }
                } catch (error) {
                    console.error('Create election error:', error);
                    alert('Network error. Please check your connection.');
                    
                    // Reset button state
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    };
    
    // Initialize manage elections page
    const initializeManageElections = () => {
        // Setup filter functionality
        const statusFilter = document.getElementById('status-filter');
        const facultyFilter = document.getElementById('faculty-filter');
        
        if (statusFilter && facultyFilter) {
            const filters = {
                status: 'all',
                faculty: 'all'
            };
            
            statusFilter.addEventListener('change', () => {
                filters.status = statusFilter.value;
                applyFilters();
            });
            
            facultyFilter.addEventListener('change', () => {
                filters.faculty = facultyFilter.value;
                applyFilters();
            });
            
            const applyFilters = async () => {
                const electionsGrid = document.querySelector('.elections-grid');
                if (!electionsGrid) return;
                
                // Show loading state
                electionsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                        <i class="fas fa-spinner fa-spin"></i> Loading elections...
                    </div>
                `;
                
                try {
                    const response = await authFetch('/api/admin/elections');
                    if (!response) return;
                    
                    const data = await response.json();
                    if (!data.success) {
                        electionsGrid.innerHTML = `
                            <div style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                                Failed to load elections
                            </div>
                        `;
                        return;
                    }
                    
                    // Filter elections
                    let filteredElections = [...data.data];
                    
                    if (filters.status !== 'all') {
                        const now = new Date();
                        filteredElections = filteredElections.filter(election => {
                            if (filters.status === 'active') {
                                return election.isActive && now >= new Date(election.startDate) && now <= new Date(election.endDate);
                            } else if (filters.status === 'upcoming') {
                                return election.isActive && now < new Date(election.startDate);
                            } else if (filters.status === 'completed') {
                                return !election.isActive || now > new Date(election.endDate);
                            }
                            return true;
                        });
                    }
                    
                    if (filters.faculty !== 'all') {
                        filteredElections = filteredElections.filter(election => 
                            election.faculty === filters.faculty
                        );
                    }
                    
                    // Render elections
                    if (filteredElections.length === 0) {
                        electionsGrid.innerHTML = `
                            <div style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                                No elections found matching your filters
                            </div>
                        `;
                        return;
                    }
                    
                    electionsGrid.innerHTML = '';
                    filteredElections.forEach(election => {
                        const now = new Date();
                        const startDate = new Date(election.startDate);
                        const endDate = new Date(election.endDate);
                        
                        let status = 'completed';
                        if (election.isActive && now >= startDate && now <= endDate) {
                            status = 'active';
                        } else if (election.isActive && now < startDate) {
                            status = 'upcoming';
                        }
                        
                        // Calculate voting stats
                        const totalVotes = election.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
                        const eligibleVoters = 100; // In a real app, this would come from the database
                        
                        const votingRate = eligibleVoters > 0 
                            ? ((totalVotes / eligibleVoters) * 100).toFixed(1) + '%' 
                            : '0%';
                        
                        const electionCard = document.createElement('div');
                        electionCard.className = 'election-card';
                        electionCard.innerHTML = `
                            <div class="election-header">
                                <h3>${election.title}</h3>
                                <div class="election-actions">
                                    <button class="action-btn edit" title="Edit" data-id="${election._id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn share" title="Share" data-id="${election._id}" data-link="${window.location.origin}/vote/${election.voteLink}">
                                        <i class="fas fa-share-alt"></i>
                                    </button>
                                    <button class="action-btn delete" title="Delete" data-id="${election._id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="election-body">
                                <div class="election-info">
                                    <p><i class="fas fa-university"></i> ${election.faculty}</p>
                                    <p><i class="fas fa-building"></i> ${election.department}</p>
                                    <p><i class="fas fa-calendar"></i> ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
                                </div>
                                <span class="status ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                            </div>
                            <div class="election-stats">
                                <div class="stat">
                                    <span class="value">${totalVotes}</span>
                                    <span class="label">${status === 'active' ? 'Voters' : 'Votes'}</span>
                                </div>
                                <div class="stat">
                                    <span class="value">${election.candidates.length}</span>
                                    <span class="label">Candidates</span>
                                </div>
                                <div class="stat">
                                    <span class="value">${votingRate}</span>
                                    <span class="label">Turnout</span>
                                </div>
                            </div>
                            <div class="election-footer">
                                <a href="results.html?id=${election._id}" class="btn secondary">View Results</a>
                                ${status === 'active' ? 
                                    `<button class="btn end-election" data-id="${election._id}">End Election</button>` : 
                                    `<button class="btn" disabled>${status === 'upcoming' ? 'Not Started' : 'Completed'}</button>`
                                }
                            </div>
                        `;
                        electionsGrid.appendChild(electionCard);
                    });
                    
                    // Add event listeners
                    document.querySelectorAll('.end-election').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            const electionId = e.target.dataset.id;
                            const electionCard = e.target.closest('.election-card');
                            
                            if (!confirm('Are you sure you want to end this election early? This action cannot be undone.')) {
                                return;
                            }
                            
                            try {
                                // Show loading state
                                e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ending...';
                                e.target.disabled = true;
                                
                                const response = await authFetch(`/api/admin/elections/${electionId}/end`, {
                                    method: 'POST'
                                });
                                
                                if (!response) {
                                    e.target.innerHTML = 'End Election';
                                    e.target.disabled = false;
                                    return;
                                }
                                
                                const data = await response.json();
                                
                                if (response.ok) {
                                    // Update UI
                                    const statusBadge = electionCard.querySelector('.status');
                                    statusBadge.textContent = 'Completed';
                                    statusBadge.className = 'status completed';
                                    
                                    e.target.textContent = 'Election Ended';
                                    e.target.disabled = true;
                                    
                                    // Update stats in real-time
                                    const stats = electionCard.querySelector('.election-stats');
                                    stats.innerHTML = `
                                        <div class="stat">
                                            <span class="value">${stats.querySelector('.stat .value').textContent}</span>
                                            <span class="label">Final Votes</span>
                                        </div>
                                        <div class="stat">
                                            <span class="value">${stats.querySelectorAll('.stat')[1].querySelector('.value').textContent}</span>
                                            <span class="label">Candidates</span>
                                        </div>
                                        <div class="stat">
                                            <span class="value">${stats.querySelectorAll('.stat')[2].querySelector('.value').textContent}</span>
                                            <span class="label">Final Turnout</span>
                                        </div>
                                    `;
                                } else {
                                    alert(data.message || 'Failed to end election. Please try again.');
                                    e.target.innerHTML = 'End Election';
                                    e.target.disabled = false;
                                }
                            } catch (error) {
                                console.error('End election error:', error);
                                alert('Network error. Please check your connection.');
                                e.target.innerHTML = 'End Election';
                                e.target.disabled = false;
                            }
                        });
                    });
                    
                    document.querySelectorAll('.action-btn.delete').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            const electionId = e.target.closest('button').dataset.id;
                            const electionCard = e.target.closest('.election-card');
                            
                            if (!confirm('Are you sure you want to delete this election? This action cannot be undone.')) {
                                return;
                            }
                            
                            try {
                                // Show loading state
                                const actionButtons = electionCard.querySelector('.election-actions');
                                const originalHTML = actionButtons.innerHTML;
                                actionButtons.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                                
                                const response = await authFetch(`/api/admin/elections/${electionId}`, {
                                    method: 'DELETE'
                                });
                                
                                if (!response) {
                                    actionButtons.innerHTML = originalHTML;
                                    return;
                                }
                                
                                const data = await response.json();
                                
                                if (response.ok) {
                                    // Remove card with animation
                                    electionCard.style.opacity = '0';
                                    electionCard.style.transform = 'translateY(10px)';
                                    setTimeout(() => {
                                        electionCard.remove();
                                    }, 300);
                                } else {
                                    alert(data.message || 'Failed to delete election. Please try again.');
                                    actionButtons.innerHTML = originalHTML;
                                }
                            } catch (error) {
                                console.error('Delete election error:', error);
                                alert('Network error. Please check your connection.');
                                const actionButtons = electionCard.querySelector('.election-actions');
                                actionButtons.innerHTML = '<button class="action-btn delete"><i class="fas fa-trash"></i></button>';
                            }
                        });
                    });
                    
                    document.querySelectorAll('.action-btn.share').forEach(button => {
                        button.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const electionId = e.target.dataset.id;
                            const shareLink = e.target.dataset.link;
                            
                            // Create temporary input to copy
                            const tempInput = document.createElement('input');
                            tempInput.value = shareLink;
                            document.body.appendChild(tempInput);
                            tempInput.select();
                            document.execCommand('copy');
                            document.body.removeChild(tempInput);
                            
                            // Show success message
                            const originalText = e.target.innerHTML;
                            e.target.innerHTML = '<i class="fas fa-check"></i>';
                            
                            setTimeout(() => {
                                e.target.innerHTML = originalText;
                            }, 2000);
                            
                            alert(`Shareable link copied to clipboard!\n\n${shareLink}`);
                        });
                    });
                } catch (error) {
                    console.error('Filter elections error:', error);
                    const electionsGrid = document.querySelector('.elections-grid');
                    if (electionsGrid) {
                        electionsGrid.innerHTML = `
                            <div style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                                Failed to load elections
                            </div>
                        `;
                    }
                }
            };
            
            // Initial load
            applyFilters();
        }
    };
    
    // Initialize results page
    const initializeResultsPage = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const electionId = urlParams.get('id');
        
        if (!electionId) {
            window.location.href = 'manage-elections.html';
            return;
        }
        
        try {
            // Show loading state
            const resultsContainer = document.querySelector('.results-container');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 20px;"></i>
                        <p>Loading election results...</p>
                    </div>
                `;
            }
            
            // Fetch election data
            const [electionRes, resultsRes] = await Promise.all([
                authFetch(`/api/admin/elections/${electionId}`),
                authFetch(`/api/admin/elections/${electionId}/results`)
            ]);
            
            if (!electionRes || !resultsRes) {
                if (resultsContainer) {
                    resultsContainer.innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #f72585; margin-bottom: 20px;"></i>
                            <h3>Failed to load results</h3>
                            <p>There was an error loading the election results. Please try again later.</p>
                            <a href="manage-elections.html" class="btn" style="margin-top: 20px;">Back to Elections</a>
                        </div>
                    `;
                }
                return;
            }
            
            const [electionData, resultsData] = await Promise.all([
                electionRes.json(),
                resultsRes.json()
            ]);
            
            if (!electionData.success || !resultsData.success) {
                if (resultsContainer) {
                    resultsContainer.innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #f72585; margin-bottom: 20px;"></i>
                            <h3>${electionData.message || resultsData.message || 'Error'}</h3>
                            <p>${electionData.data || resultsData.data || 'Failed to load election results.'}</p>
                            <a href="manage-elections.html" class="btn" style="margin-top: 20px;">Back to Elections</a>
                        </div>
                    `;
                }
                return;
            }
            
            const election = electionData.data;
            const results = resultsData.data;
            
            // Update page title and breadcrumb
            document.querySelector('.admin-header h2').textContent = 'Election Results';
            document.querySelector('.breadcrumb').innerHTML = `
                ${election.title} • ${election.faculty} • ${election.department}
            `;
            
            // Update summary stats
            const totalVotes = results.results.reduce((sum, candidate) => sum + candidate.votes, 0);
            const eligibleVoters = 100; // In a real app, this would come from the database
            
            const votingRate = eligibleVoters > 0 
                ? ((totalVotes / eligibleVoters) * 100).toFixed(1) + '%' 
                : '0%';
            
            document.querySelector('.summary-card:nth-child(1) .value').textContent = totalVotes;
            document.querySelector('.summary-card:nth-child(2) .value').textContent = eligibleVoters;
            document.querySelector('.summary-card:nth-child(3) .value').textContent = votingRate;
            document.querySelector('.summary-card:nth-child(4) .value').textContent = 
                Math.ceil((new Date(election.endDate) - new Date(election.startDate)) / (1000 * 60 * 60 * 24)) + ' Days';
            
            // Create results chart
            const resultsChartCtx = document.getElementById('resultsChart');
            if (resultsChartCtx) {
                new Chart(resultsChartCtx, {
                    type: 'doughnut',
                     {
                        labels: results.results.map(candidate => candidate.name),
                        datasets: [{
                             results.results.map(candidate => candidate.votes),
                            backgroundColor: [
                                '#4361ee',
                                '#4cc9f0',
                                '#7209b7',
                                '#f72585',
                                '#f8961e',
                                '#4cc9f0'
                            ].slice(0, results.results.length),
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                            }
                        }
                    }
                });
            }
            
            // Populate results table
            const tableBody = document.querySelector('.results-table table tbody');
            if (tableBody) {
                tableBody.innerHTML = '';
                
                results.results.forEach((candidate, index) => {
                    const row = document.createElement('tr');
                    if (index === 0) row.classList.add('winner');
                    
                    const percentage = totalVotes > 0 
                        ? ((candidate.votes / totalVotes) * 100).toFixed(1) + '%' 
                        : '0%';
                    
                    row.innerHTML = `
                        <td>${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}</td>
                        <td>
                            <div class="candidate-info">
                                <img src="../images/candidates/${candidate.image}" alt="${candidate.name}">
                                <span>${candidate.name}</span>
                            </div>
                        </td>
                        <td>${candidate.faculty}</td>
                        <td>${candidate.department}</td>
                        <td>${candidate.votes}</td>
                        <td>${percentage}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }
            
            // Create daily votes chart (simulated data for demo)
            const dailyVotesChartCtx = document.getElementById('dailyVotesChart');
            if (dailyVotesChartCtx) {
                const days = Math.ceil((new Date(election.endDate) - new Date(election.startDate)) / (1000 * 60 * 60 * 24));
                const labels = [];
                const votesData = [];
                
                let currentDate = new Date(election.startDate);
                for (let i = 0; i < days && i < 7; i++) {
                    labels.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                    
                    // Simulate votes (in a real app, this would come from the database)
                    votesData.push(Math.floor(Math.random() * 20) + 5);
                    
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                
                new Chart(dailyVotesChartCtx, {
                    type: 'line',
                     {
                        labels: labels,
                        datasets: [{
                            label: 'Votes',
                            data: votesData,
                            borderColor: '#4361ee',
                            backgroundColor: 'rgba(67, 97, 238, 0.1)',
                            tension: 0.3,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
            
            // Create department chart (simulated data for demo)
            const departmentChartCtx = document.getElementById('departmentChart');
            if (departmentChartCtx) {
                const departments = [...new Set(results.results.map(c => c.department))];
                const votesByDepartment = departments.map(dept => 
                    results.results
                        .filter(c => c.department === dept)
                        .reduce((sum, c) => sum + c.votes, 0)
                );
                
                new Chart(departmentChartCtx, {
                    type: 'bar',
                     {
                        labels: departments,
                        datasets: [{
                            label: 'Votes',
                            data: votesByDepartment,
                            backgroundColor: '#4cc9f0'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
            
            // Setup export button
            const exportBtn = document.querySelector('.header-right .btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    // In a real app, this would generate and download a CSV/Excel file
                    alert('Exporting election results...\n\nIn a real implementation, this would download a CSV file with detailed election results.');
                });
            }
        } catch (error) {
            console.error('Error loading results:', error);
            const resultsContainer = document.querySelector('.results-container');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #f72585; margin-bottom: 20px;"></i>
                        <h3>Network Error</h3>
                        <p>Failed to load election results. Please check your internet connection and try again.</p>
                        <button class="btn" style="margin-top: 20px;" id="retry-btn">Retry</button>
                    </div>
                `;
                
                document.getElementById('retry-btn').addEventListener('click', () => {
                    window.location.reload();
                });
            }
        }
    };
    
    // Initialize based on current page
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    
    // Verify admin role for all admin pages
    verifyAdmin().then(isAdmin => {
        if (!isAdmin) return;
        
        if (page === 'dashboard.html') {
            initializeAdminData();
            initializeDashboardStats();
            initializeElectionChart();
            initializeRecentElections();
        } else if (page === 'create-election.html') {
            initializeCreateElection();
        } else if (page === 'manage-elections.html') {
            initializeManageElections();
        } else if (page === 'results.html') {
            initializeResultsPage();
        }
    });
});
