document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
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
                window.location.href = 'login.html';
                return null;
            }
            return response;
        } catch (error) {
            console.error('Network error:', error);
            throw error;
        }
    };
    
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
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
        });
    }
    
    // Initialize user data
    const initializeUserData = async () => {
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
                
                if (document.querySelector('.avatar-img')) {
                    document.querySelector('.avatar-img').src = `images/avatars/${user.avatar}`;
                }
                
                if (document.querySelector('.matric-number')) {
                    document.querySelector('.matric-number').textContent = user.matricNumber;
                }
            }
        } catch (error) {
            console.error('Error fetching user ', error);
        }
    };
    
    // Initialize elections data
    const initializeElections = async () => {
        try {
            const response = await authFetch('/api/users/elections');
            if (!response) return;
            
            const data = await response.json();
            if (data.success) {
                const elections = data.data;
                const electionsContainer = document.getElementById('available-elections');
                
                if (electionsContainer) {
                    electionsContainer.innerHTML = '';
                    
                    if (elections.length === 0) {
                        electionsContainer.innerHTML = '<p class="no-elections">There are no active elections available for you at the moment.</p>';
                        return;
                    }
                    
                    elections.forEach(election => {
                        const electionCard = document.createElement('div');
                        electionCard.className = 'election-card';
                        electionCard.innerHTML = `
                            <div class="election-header">
                                <h3>${election.title}</h3>
                                <span class="status active">Active</span>
                            </div>
                            <div class="election-details">
                                <p><i class="fas fa-university"></i> ${election.faculty}</p>
                                <p><i class="fas fa-building"></i> ${election.department}</p>
                                <p><i class="fas fa-calendar"></i> ${new Date(election.startDate).toLocaleDateString()} - ${new Date(election.endDate).toLocaleDateString()}</p>
                            </div>
                            <button class="btn vote-btn" data-id="${election._id}">Vote Now</button>
                        `;
                        electionsContainer.appendChild(electionCard);
                    });
                    
                    // Add event listeners to vote buttons
                    document.querySelectorAll('.vote-btn').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const electionId = e.target.getAttribute('data-id');
                            window.location.href = `vote.html?election=${electionId}`;
                        });
                    });
                }
                
                // Initialize voted elections
                const votedElectionsContainer = document.getElementById('voted-elections');
                if (votedElectionsContainer) {
                    const votingHistoryResponse = await authFetch('/api/users/voting-history');
                    if (!votingHistoryResponse) return;
                    
                    const votingHistoryData = await votingHistoryResponse.json();
                    
                    if (votingHistoryData.success && votingHistoryData.data.length > 0) {
                        votedElectionsContainer.innerHTML = '';
                        
                        votingHistoryData.data.forEach(election => {
                            const electionItem = document.createElement('div');
                            electionItem.className = 'voted-election';
                            electionItem.innerHTML = `
                                <div class="voted-election-header">
                                    <h3>${election.title}</h3>
                                    <span class="status completed">Completed</span>
                                </div>
                                <div class="voted-election-details">
                                    <p><i class="fas fa-university"></i> ${election.faculty}</p>
                                    <p><i class="fas fa-building"></i> ${election.department}</p>
                                    <p><i class="fas fa-calendar"></i> ${new Date(election.startDate).toLocaleDateString()} - ${new Date(election.endDate).toLocaleDateString()}</p>
                                </div>
                            `;
                            votedElectionsContainer.appendChild(electionItem);
                        });
                    } else {
                        votedElectionsContainer.innerHTML = '<p class="no-votes">You haven\'t voted in any elections yet.</p>';
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching elections:', error);
        }
    };
    
    // Initialize dashboard
    const initDashboard = async () => {
        await initializeUserData();
        await initializeElections();
    };
    
    // Initialize if on dashboard page
    if (document.querySelector('.dashboard-container')) {
        initDashboard();
    }
    
    // Initialize if on vote page
    if (document.querySelector('.vote-container')) {
        const urlParams = new URLSearchParams(window.location.search);
        const electionId = urlParams.get('election');
        
        if (!electionId) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        const loadElection = async () => {
            try {
                const response = await authFetch(`/api/admin/elections/${electionId}`);
                if (!response) return;
                
                const data = await response.json();
                if (data.success) {
                    const election = data.data;
                    
                    // Populate election details
                    document.getElementById('election-title').textContent = election.title;
                    document.getElementById('election-faculty').textContent = election.faculty;
                    document.getElementById('election-department').textContent = election.department;
                    
                    // Populate candidates
                    const candidatesContainer = document.getElementById('candidates-list');
                    candidatesContainer.innerHTML = '';
                    
                    election.candidates.forEach(candidate => {
                        const candidateCard = document.createElement('div');
                        candidateCard.className = 'candidate-card';
                        candidateCard.innerHTML = `
                            <div class="candidate-image">
                                <img src="images/candidates/${candidate.image}" alt="${candidate.name}">
                            </div>
                            <div class="candidate-info">
                                <h3>${candidate.name}</h3>
                                <p class="position">${candidate.position}</p>
                                <p class="department">${candidate.department}</p>
                            </div>
                            <button class="btn vote-candidate" data-id="${candidate._id}">
                                <i class="fas fa-vote-yea"></i> Vote
                            </button>
                        `;
                        candidatesContainer.appendChild(candidateCard);
                    });
                    
                    // Add event listeners to vote buttons
                    document.querySelectorAll('.vote-candidate').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            const candidateId = e.target.getAttribute('data-id');
                            
                            if (!confirm('Are you sure you want to vote for this candidate? This action cannot be undone.')) {
                                return;
                            }
                            
                            try {
                                // Show loading state
                                e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Casting vote...';
                                e.target.disabled = true;
                                
                                const response = await authFetch('/api/users/vote', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        electionId,
                                        candidateId
                                    })
                                });
                                
                                if (!response) {
                                    e.target.innerHTML = '<i class="fas fa-vote-yea"></i> Vote';
                                    e.target.disabled = false;
                                    return;
                                }
                                
                                const data = await response.json();
                                
                                if (response.ok) {
                                    alert('Vote cast successfully!');
                                    window.location.href = 'dashboard.html';
                                } else {
                                    alert(data.message || 'Failed to cast vote. Please try again.');
                                    e.target.innerHTML = '<i class="fas fa-vote-yea"></i> Vote';
                                    e.target.disabled = false;
                                }
                            } catch (error) {
                                console.error('Vote error:', error);
                                alert('Network error. Please check your connection.');
                                e.target.innerHTML = '<i class="fas fa-vote-yea"></i> Vote';
                                e.target.disabled = false;
                            }
                        });
                    });
                } else {
                    alert(data.message || 'Failed to load election details.');
                    window.location.href = 'dashboard.html';
                }
            } catch (error) {
                console.error('Error loading election:', error);
                alert('Failed to load election details. Please try again.');
                window.location.href = 'dashboard.html';
            }
        };
        
        loadElection();
    }
    
    // Initialize if on profile page
    if (document.querySelector('.profile-container')) {
        const loadProfile = async () => {
            try {
                const response = await authFetch('/api/auth/me');
                if (!response) return;
                
                const data = await response.json();
                if (data.success) {
                    const user = data.data;
                    
                    // Populate profile fields
                    document.getElementById('username').value = user.username;
                    document.getElementById('email').value = user.email;
                    document.getElementById('matricNumber').value = user.matricNumber;
                    document.getElementById('faculty').value = user.faculty;
                    document.getElementById('department').value = user.department;
                    
                    // Update profile image
                    if (document.querySelector('.avatar-preview')) {
                        document.querySelector('.avatar-preview').src = `images/avatars/${user.avatar}`;
                    }
                }
            } catch (error) {
                console.error('Error loading profile:', error);
                alert('Failed to load profile data. Please try again.');
            }
        };
        
        // Setup profile update
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const email = document.getElementById('email').value;
                const faculty = document.getElementById('faculty').value;
                const department = document.getElementById('department').value;
                
                try {
                    // Show loading state
                    const submitBtn = profileForm.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
                    submitBtn.disabled = true;
                    
                    const response = await authFetch('/api/users/profile', {
                        method: 'PUT',
                        body: JSON.stringify({
                            username,
                            email,
                            faculty,
                            department
                        })
                    });
                    
                    if (!response) {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                        return;
                    }
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        alert('Profile updated successfully!');
                        
                        // Update profile elements in header
                        document.querySelectorAll('.username').forEach(el => {
                            el.textContent = username;
                        });
                    } else {
                        alert(data.message || 'Failed to update profile. Please try again.');
                    }
                    
                    // Reset button state
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                } catch (error) {
                    console.error('Profile update error:', error);
                    alert('Network error. Please check your connection.');
                    
                    // Reset button state
                    const submitBtn = profileForm.querySelector('button[type="submit"]');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
        
        // Setup avatar upload
        const avatarInput = document.getElementById('avatar');
        if (avatarInput) {
            avatarInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                // Validate file type
                const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!validTypes.includes(file.type)) {
                    alert('Please upload a valid image file (JPG, PNG, or GIF)');
                    return;
                }
                
                // Validate file size (max 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    alert('Please upload an image smaller than 2MB');
                    return;
                }
                
                try {
                    // Show loading state
                    const uploadBtn = avatarInput.closest('.upload-btn-wrapper').querySelector('button');
                    const originalText = uploadBtn.innerHTML;
                    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
                    uploadBtn.disabled = true;
                    
                    // Create FormData for file upload
                    const formData = new FormData();
                    formData.append('avatar', file);
                    
                    const response = await fetch('/api/users/avatar', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });
                    
                    if (!response) {
                        uploadBtn.innerHTML = originalText;
                        uploadBtn.disabled = false;
                        return;
                    }
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        // Update preview
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            document.querySelector('.avatar-preview').src = event.target.result;
                        };
                        reader.readAsDataURL(file);
                        
                        alert('Avatar updated successfully!');
                    } else {
                        alert(data.message || 'Failed to upload avatar. Please try again.');
                    }
                    
                    // Reset button state
                    uploadBtn.innerHTML = originalText;
                    uploadBtn.disabled = false;
                } catch (error) {
                    console.error('Avatar upload error:', error);
                    alert('Network error. Please check your connection.');
                    
                    // Reset button state
                    const uploadBtn = avatarInput.closest('.upload-btn-wrapper').querySelector('button');
                    uploadBtn.innerHTML = originalText;
                    uploadBtn.disabled = false;
                }
            });
        }
        
        // Setup password change
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                // Validate passwords
                if (newPassword.length < 6) {
                    alert('New password must be at least 6 characters');
                    return;
                }
                
                if (newPassword !== confirmPassword) {
                    alert('New passwords do not match');
                    return;
                }
                
                try {
                    // Show loading state
                    const submitBtn = passwordForm.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
                    submitBtn.disabled = true;
                    
                    const response = await authFetch('/api/users/change-password', {
                        method: 'PUT',
                        body: JSON.stringify({
                            currentPassword,
                            newPassword
                        })
                    });
                    
                    if (!response) {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                        return;
                    }
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        alert('Password updated successfully!');
                        passwordForm.reset();
                    } else {
                        alert(data.message || 'Failed to update password. Please check your current password.');
                    }
                    
                    // Reset button state
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                } catch (error) {
                    console.error('Password change error:', error);
                    alert('Network error. Please check your connection.');
                    
                    // Reset button state
                    const submitBtn = passwordForm.querySelector('button[type="submit"]');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
        
        // Initialize profile data
        loadProfile();
    }
});
