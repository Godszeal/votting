document.addEventListener('DOMContentLoaded', () => {
    // Check authentication and admin role
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }
    
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
    const profileDropdown = document.querySelector('.user-avatar');
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
                
                if (document.querySelector('.user-avatar img')) {
                    document.querySelector('.user-avatar img').src = `../images/avatars/${user.avatar}`;
                }
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        }
    };
    
    // Initialize dashboard stats
    const initializeDashboardStats = async () => {
        try {
            const [usersRes, electionsRes, votesRes] = await Promise.all([
                authFetch('/api/admin/users'),
                authFetch('/api/admin/elections'),
                authFetch('/api/users/voting-history')
            ]);
            
            if (!usersRes || !electionsRes || !votesRes) return;
            
            const [usersData, electionsData, votesData] = await Promise.all([
                usersRes.json(),
                electionsRes.json(),
                votesRes.json()
            ]);
            
            if (!usersData.success || !electionsData.success || !votesData.success) return;
            
            // Calculate stats
            const totalUsers = usersData.data.length;
            const activeElections = electionsData.data.filter(e => e.isActive).length;
            
            // Calculate voting rate
            const totalVotes = votesData.data.reduce((sum, election) => sum + election.votes, 0);
            const votingRate = totalUsers > 0 ? ((totalVotes / totalUsers) * 100).toFixed(1) + '%' : '0%';
            
            // Update stats
            document.getElementById('total-users').textContent = totalUsers.toLocaleString();
            document.getElementById('active-elections').textContent = activeElections;
            document.getElementById('voting-rate').textContent = votingRate;
            
            // Update election chart
            initializeElectionChart(electionsData.data);
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    };
    
    // Initialize election chart
    const initializeElectionChart = (elections) => {
        const electionChartCtx = document.getElementById('electionChart');
        if (!electionChartCtx) return;
        
        // Calculate election status counts
        const now = new Date();
        const activeCount = elections.filter(e => e.isActive && now >= new Date(e.startDate) && now <= new Date(e.endDate)).length;
        const upcomingCount = elections.filter(e => e.isActive && now < new Date(e.startDate)).length;
        const completedCount = elections.filter(e => !e.isActive || now > new Date(e.endDate)).length;
        
        // Create chart
        new Chart(electionChartCtx, {
            type: 'doughnut',
            data: {
                labels: ['Active', 'Upcoming', 'Completed'],
                datasets: [{
                    data: [activeCount, upcomingCount, completedCount],
                    backgroundColor: [
                        '#06d6a0',
                        '#ffd166',
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
    };
    
    // Initialize recent elections table
    const initializeRecentElections = async () => {
        const tableBody = document.querySelector('.table-responsive table tbody');
        if (!tableBody) return;
        
        try {
            const response = await authFetch('/api/admin/elections');
            if (!response) return;
            
            const data = await response.json();
            if (!data.success) return;
            
            // Sort by most recent
            const sortedElections = [...data.data].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            ).slice(0, 5);
            
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
                    window.location.href = `edit-election.html?id=${electionId}`;
                });
            });
            
            document.querySelectorAll('.action-btn.view').forEach(button => {
                button.addEventListener('click', (e) => {
                    const electionId = e.target.closest('button').dataset.id;
                    window.location.href = `results.html?id=${electionId}`;
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
    
    // Initialize recent activity log
    const initializeActivityLog = async () => {
        const activityLog = document.querySelector('.activity-log');
        if (!activityLog) return;
        
        try {
            // In a real app, this would fetch from the API
            const mockActivity = [
                {
                    type: 'login',
                    user: 'John Doe',
                    action: 'Logged in to admin panel',
                    time: '2 minutes ago'
                },
                {
                    type: 'election',
                    user: 'Sarah Williams',
                    action: 'Created new election: Student Union President',
                    time: '15 minutes ago'
                },
                {
                    type: 'user',
                    user: 'Michael Chen',
                    action: 'Updated user role for 2019012345',
                    time: '30 minutes ago'
                },
                {
                    type: 'election',
                    user: 'Alex Johnson',
                    action: 'Ended election: Faculty Representative',
                    time: '1 hour ago'
                },
                {
                    type: 'login',
                    user: 'Emma Rodriguez',
                    action: 'Logged in to admin panel',
                    time: '2 hours ago'
                }
            ];
            
            activityLog.innerHTML = '';
            mockActivity.forEach(activity => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.innerHTML = `
                    <div class="activity-icon ${activity.type}">
                        <i class="fas fa-${activity.type === 'login' ? 'sign-in-alt' : activity.type === 'election' ? 'voting-remote' : 'user'}"></i>
                    </div>
                    <div class="activity-details">
                        <h4>${activity.user} ${activity.action}</h4>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                `;
                activityLog.appendChild(activityItem);
            });
        } catch (error) {
            console.error('Error loading activity log:', error);
            activityLog.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-circle"></i> Failed to load activity log
                </div>
            `;
        }
    };
    
    // Initialize system health monitoring
    const initializeSystemHealth = () => {
        // Simulate server load
        const serverLoad = document.getElementById('server-load');
        const progressBar = document.querySelector('.progress-bar');
        
        if (serverLoad && progressBar) {
            let load = 10;
            const interval = setInterval(() => {
                load = Math.min(100, load + Math.floor(Math.random() * 5));
                serverLoad.textContent = `${load.toFixed(1)}%`;
                progressBar.style.width = `${load}%`;
                
                if (load >= 95) {
                    clearInterval(interval);
                }
            }, 3000);
        }
    };
    
    // Initialize all components
    const init = async () => {
        await initializeAdminData();
        await initializeDashboardStats();
        await initializeRecentElections();
        await initializeActivityLog();
        initializeSystemHealth();
    };
    
    init();
});
