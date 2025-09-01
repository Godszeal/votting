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
    
    // Get election ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const electionId = urlParams.get('election');
    
    if (!electionId) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Initialize voting process
    const initVoting = async () => {
        try {
            // Load election details
            const electionResponse = await authFetch(`/api/admin/elections/${electionId}`);
            if (!electionResponse) return;
            
            const electionData = await electionResponse.json();
            if (!electionData.success) {
                alert(electionData.message || 'Failed to load election details.');
                window.location.href = 'dashboard.html';
                return;
            }
            
            const election = electionData.data;
            
            // Populate election details
            document.getElementById('election-title').textContent = election.title;
            document.getElementById('election-faculty').textContent = election.faculty;
            document.getElementById('election-department').textContent = election.department;
            
            // Start election timer
            startElectionTimer(election.endDate);
            
            // Load candidates
            loadCandidates(election.candidates);
            
            // Setup navigation
            setupNavigation();
        } catch (error) {
            console.error('Error initializing voting:', error);
            alert('Failed to load election details. Please try again.');
            window.location.href = 'dashboard.html';
        }
    };
    
    // Start election timer
    const startElectionTimer = (endDate) => {
        const timerElement = document.getElementById('election-timer');
        if (!timerElement) return;
        
        const updateTimer = () => {
            const now = new Date();
            const end = new Date(endDate);
            const diff = end - now;
            
            if (diff <= 0) {
                timerElement.textContent = 'Ended';
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            timerElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        };
        
        updateTimer();
        setInterval(updateTimer, 1000);
    };
    
    // Load candidates
    const loadCandidates = (candidates) => {
        const candidatesList = document.getElementById('candidates-list');
        if (!candidatesList) return;
        
        candidatesList.innerHTML = '';
        
        candidates.forEach((candidate, index) => {
            const candidateCard = document.createElement('div');
            candidateCard.className = 'candidate-card';
            candidateCard.dataset.id = candidate._id;
            candidateCard.innerHTML = `
                <div class="candidate-header">
                    <div class="candidate-avatar">
                        <span>${candidate.name.charAt(0)}</span>
                    </div>
                    <div class="candidate-info">
                        <h3>${candidate.name}</h3>
                        <p>${candidate.position} • ${candidate.department}</p>
                    </div>
                </div>
                <div class="candidate-bio">
                    <p>${candidate.bio || 'No bio provided.'}</p>
                </div>
                <div class="candidate-platform">
                    <h4>Platform</h4>
                    <ul>
                        ${candidate.platform ? 
                            candidate.platform.map(item => `<li>${item}</li>`).join('') : 
                            '<li>No platform information provided.</li>'
                        }
                    </ul>
                </div>
            `;
            candidatesList.appendChild(candidateCard);
            
            // Add click event to select candidate
            candidateCard.addEventListener('click', () => {
                // Remove selected class from all candidates
                document.querySelectorAll('.candidate-card').forEach(card => {
                    card.classList.remove('selected');
                });
                
                // Add selected class to clicked candidate
                candidateCard.classList.add('selected');
                
                // Update confirmation screen
                document.getElementById('selected-candidate').textContent = candidate.name;
                document.getElementById('selected-position').textContent = candidate.position;
                
                // Show confirmation screen
                document.querySelector('.vote-selection').style.display = 'none';
                document.querySelector('.vote-confirmation').style.display = 'block';
            });
        });
    };
    
    // Setup navigation
    const setupNavigation = () => {
        // Back button
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                document.querySelector('.vote-selection').style.display = 'block';
                document.querySelector('.vote-confirmation').style.display = 'none';
            });
        }
        
        // Confirm vote button
        const confirmVoteBtn = document.getElementById('confirm-vote-btn');
        if (confirmVoteBtn) {
            confirmVoteBtn.addEventListener('click', confirmVote);
        }
        
        // View results button
        const viewResultsBtn = document.getElementById('view-results-btn');
        if (viewResultsBtn) {
            viewResultsBtn.addEventListener('click', () => {
                window.location.href = `results.html?id=${electionId}`;
            });
        }
        
        // Return to dashboard button
        const returnDashboardBtn = document.getElementById('return-dashboard-btn');
        if (returnDashboardBtn) {
            returnDashboardBtn.addEventListener('click', () => {
                window.location.href = 'dashboard.html';
            });
        }
    };
    
    // Confirm vote
    const confirmVote = async () => {
        const selectedCandidate = document.querySelector('.candidate-card.selected');
        if (!selectedCandidate) {
            alert('Please select a candidate before confirming your vote.');
            return;
        }
        
        const candidateId = selectedCandidate.dataset.id;
        
        if (!confirm('Are you sure you want to vote for this candidate? This action cannot be undone.')) {
            return;
        }
        
        try {
            // Show loading state
            const confirmBtn = document.getElementById('confirm-vote-btn');
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Confirming...';
            confirmBtn.disabled = true;
            
            const response = await authFetch('/api/users/vote', {
                method: 'POST',
                body: JSON.stringify({
                    electionId,
                    candidateId
                })
            });
            
            if (!response) {
                confirmBtn.innerHTML = originalText;
                confirmBtn.disabled = false;
                return;
            }
            
            const data = await response.json();
            
            if (response.ok) {
                // Generate verification details
                const transactionId = Math.random().toString(36).substr(2, 16);
                const voteTime = new Date().toLocaleString();
                
                document.getElementById('transaction-id').textContent = transactionId;
                document.getElementById('vote-time').textContent = voteTime;
                
                // Show verified screen
                document.querySelector('.vote-confirmation').style.display = 'none';
                document.querySelector('.vote-verified').style.display = 'block';
            } else {
                alert(data.message || 'Failed to cast vote. Please try again.');
                confirmBtn.innerHTML = originalText;
                confirmBtn.disabled = false;
            }
        } catch (error) {
            console.error('Vote error:', error);
            alert('Network error. Please check your connection.');
            
            const confirmBtn = document.getElementById('confirm-vote-btn');
            confirmBtn.innerHTML = 'Confirm Vote';
            confirmBtn.disabled = false;
        }
    };
    
    // Initialize voting process
    initVoting();
});
