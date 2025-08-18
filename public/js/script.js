document.addEventListener('DOMContentLoaded', () => {
  // Check authentication on protected pages
  const protectedPages = ['user-dashboard.html', 'admin-dashboard.html'];
  const currentPath = window.location.pathname.split('/').pop();
  
  if (protectedPages.includes(currentPath)) {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
    }
  }

  // Handle login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const matricNumber = document.getElementById('matricNumber').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('error-message');
      
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ matricNumber, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.role);
          
          if (data.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
          } else {
            window.location.href = 'user-dashboard.html';
          }
        } else {
          let errorMessage = 'Invalid credentials';
          if (data.errors && data.errors[0] && data.errors[0].msg) {
            errorMessage = data.errors[0].msg;
          }
          
          errorDiv.innerHTML = errorMessage;
          errorDiv.classList.remove('hidden');
          
          setTimeout(() => {
            errorDiv.classList.add('hidden');
          }, 5000);
        }
      } catch (err) {
        console.error('Login error:', err);
        errorDiv.innerHTML = 'Server error. Please try again.';
        errorDiv.classList.remove('hidden');
        
        setTimeout(() => {
          errorDiv.classList.add('hidden');
        }, 5000);
      }
    });
  }

  // Handle signup
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const matricNumber = document.getElementById('matricNumber').value;
      const university = document.getElementById('university').value;
      const department = document.getElementById('department').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const password2 = document.getElementById('password2').value;
      const errorDiv = document.getElementById('error-message');
      
      if (password !== password2) {
        errorDiv.innerHTML = 'Passwords do not match';
        errorDiv.classList.remove('hidden');
        
        setTimeout(() => {
          errorDiv.classList.add('hidden');
        }, 5000);
        return;
      }
      
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ matricNumber, university, department, email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.role);
          window.location.href = 'user-dashboard.html';
        } else {
          let errorMessage = 'Registration failed';
          if (data.errors && Array.isArray(data.errors)) {
            errorMessage = data.errors.map(err => err.msg).join('<br>');
          } else if (data.message) {
            errorMessage = data.message;
          }
          
          errorDiv.innerHTML = errorMessage;
          errorDiv.classList.remove('hidden');
          
          setTimeout(() => {
            errorDiv.classList.add('hidden');
          }, 5000);
        }
      } catch (err) {
        console.error('Signup error:', err);
        errorDiv.innerHTML = 'Server error. Please try again.';
        errorDiv.classList.remove('hidden');
        
        setTimeout(() => {
          errorDiv.classList.add('hidden');
        }, 5000);
      }
    });
  }

  // User dashboard functionality
  if (currentPath === 'user-dashboard.html') {
    loadElections();
    setupLogout();
  }

  function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '../index.html';
      });
    }
  }

  async function loadElections() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token missing. Please log in again.');
      }
      
      const res = await fetch('/api/user/elections', {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || `Failed to load elections (Status: ${res.status})`);
      }
      
      const elections = await res.json();
      
      const electionsContainer = document.getElementById('elections-container');
      electionsContainer.innerHTML = '';
      
      if (elections.length === 0) {
        electionsContainer.innerHTML = `
          <div class="card text-center" style="padding: 3rem; grid-column: 1 / -1;">
            <div style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem;">🗳️</div>
            <h2 style="margin-bottom: 1rem;">No Active Elections</h2>
            <p style="color: var(--gray); max-width: 500px; margin: 0 auto;">
              There are no active elections available for you at the moment. Check back later or contact your student union.
            </p>
          </div>
        `;
        return;
      }
      
      elections.forEach(election => {
        const electionCard = document.createElement('div');
        electionCard.className = 'election-card card fade-in';
        electionCard.style.animationDelay = `${Math.random() * 0.3}s`;
        
        // Format restriction badges
        let restrictionBadges = '';
        if (election.universityRestriction && election.universityRestriction !== 'All Universities') {
          restrictionBadges += `
            <span class="election-restriction">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              ${election.universityRestriction}
            </span>
          `;
        }
        
        if (election.departmentRestriction && election.departmentRestriction !== 'All Departments') {
          restrictionBadges += `
            <span class="election-restriction" style="background-color: var(--secondary);">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              ${election.departmentRestriction}
            </span>
          `;
        }
        
        if (!restrictionBadges) {
          restrictionBadges = `
            <span class="election-restriction" style="background-color: var(--success);">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              All Students
            </span>
          `;
        }
        
        let candidatesHTML = '';
        election.candidates.forEach(candidate => {
          const percentage = calculatePercentage(election.candidates, candidate.votes);
          candidatesHTML += `
            <div class="candidate">
              <div class="candidate-name">${candidate.name}</div>
              <div class="candidate-votes">${candidate.votes} votes (${percentage}%)</div>
              <div class="progress-bar">
                <div class="progress" style="width: ${percentage}%"></div>
              </div>
            </div>
          `;
        });
        
        electionCard.innerHTML = `
          <div class="election-header">
            <h2 class="election-title">${election.title}</h2>
            <div style="display: flex; gap: 0.5rem;">
              ${restrictionBadges}
            </div>
          </div>
          
          <p class="election-description">${election.description}</p>
          
          <div class="election-candidates">
            ${candidatesHTML}
          </div>
          
          <div class="vote-actions">
            ${election.candidates.map(c => `
              <button class="btn btn-primary vote-btn" 
                      data-election="${election._id}" 
                      data-candidate="${c.name}">
                Vote for ${c.name}
              </button>
            `).join('')}
          </div>
        `;
        
        electionsContainer.appendChild(electionCard);
      });
      
      // Add vote event listeners
      document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', handleVote);
      });
      
    } catch (err) {
      console.error('Error loading elections:', err);
      
      const electionsContainer = document.getElementById('elections-container');
      electionsContainer.innerHTML = `
        <div class="card text-center" style="padding: 3rem; grid-column: 1 / -1;">
          <div style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;">⚠️</div>
          <h2 style="margin-bottom: 1rem; color: var(--danger);">Error Loading Elections</h2>
          <p style="color: var(--gray); max-width: 500px; margin: 0 auto 1.5rem;">
            ${err.message}
          </p>
          <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  function calculatePercentage(candidates, votes) {
    const total = candidates.reduce((sum, c) => sum + c.votes, 0);
    return total > 0 ? ((votes / total) * 100).toFixed(1) : 0;
  }

  async function handleVote(e) {
    const electionId = e.target.dataset.election;
    const candidate = e.target.dataset.candidate;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token missing. Please log in again.');
      }
      
      const res = await fetch('/api/user/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ electionId, candidate })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Show success message
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Vote recorded successfully!
        `;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.maxWidth = '400px';
        alertDiv.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        document.body.appendChild(alertDiv);
        
        alertDiv.style.display = 'flex';
        
        setTimeout(() => {
          alertDiv.style.display = 'none';
          document.body.removeChild(alertDiv);
          
          // Reload elections to show updated results
          loadElections();
        }, 3000);
      } else {
        let errorMessage = data.msg || 'Failed to record vote';
        if (data.error) {
          errorMessage += `: ${data.error}`;
        }
        
        // Show error message
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger';
        alertDiv.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          ${errorMessage}
        `;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.maxWidth = '400px';
        alertDiv.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        document.body.appendChild(alertDiv);
        
        alertDiv.style.display = 'flex';
        
        setTimeout(() => {
          alertDiv.style.display = 'none';
          document.body.removeChild(alertDiv);
        }, 5000);
      }
    } catch (err) {
      console.error('Vote error:', err);
      
      // Show error message
      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert alert-danger';
      alertDiv.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        Server error. Please try again.
      `;
      alertDiv.style.position = 'fixed';
      alertDiv.style.top = '20px';
      alertDiv.style.right = '20px';
      alertDiv.style.zIndex = '9999';
      alertDiv.style.maxWidth = '400px';
      alertDiv.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      document.body.appendChild(alertDiv);
      
      alertDiv.style.display = 'flex';
      
      setTimeout(() => {
        alertDiv.style.display = 'none';
        document.body.removeChild(alertDiv);
      }, 5000);
    }
  }
});
