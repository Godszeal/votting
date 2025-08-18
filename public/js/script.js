// public/js/script.js
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
          showError('Invalid credentials');
        }
      } catch (err) {
        showError('Server error. Please try again.');
      }
    });
  }
  
  // Handle admin login
  const adminLoginForm = document.getElementById('admin-login-form');
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('admin-email').value;
      const password = document.getElementById('admin-password').value;
      
      try {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', 'admin');
          window.location.href = 'admin-dashboard.html';
        } else {
          showError('Invalid admin credentials');
        }
      } catch (err) {
        showError('Server error. Please try again.');
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
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const password2 = document.getElementById('password2').value;
      
      if (password !== password2) {
        showError('Passwords do not match');
        return;
      }
      
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ matricNumber, university, email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.role);
          window.location.href = 'user-dashboard.html';
        } else {
          const errors = data.errors.map(err => err.msg);
          showError(errors.join('<br>'));
        }
      } catch (err) {
        showError('Server error. Please try again.');
      }
    });
  }
  
  // User dashboard functionality
  if (currentPath === 'user-dashboard.html') {
    loadElections();
    setupLogout();
  }
  
  function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
      errorDiv.innerHTML = message;
      errorDiv.classList.remove('hidden');
      setTimeout(() => {
        errorDiv.classList.add('hidden');
      }, 5000);
    }
  }
  
  function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'index.html';
      });
    }
  }
  
  async function loadElections() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/elections', {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to load elections');
      }
      
      const elections = await res.json();
      
      const electionsContainer = document.getElementById('elections-container');
      electionsContainer.innerHTML = '';
      
      if (elections.length === 0) {
        electionsContainer.innerHTML = '<p>No active elections at the moment</p>';
        return;
      }
      
      elections.forEach(election => {
        const electionCard = document.createElement('div');
        electionCard.className = 'card election-card';
        
        let candidatesHTML = '';
        election.candidates.forEach(candidate => {
          candidatesHTML += `
            <li>
              <span>${candidate.name}</span>
              <button class="vote-btn" data-election="${election._id}" data-candidate="${candidate.name}">
                Vote
              </button>
            </li>
          `;
        });
        
        electionCard.innerHTML = `
          <h2>${election.title}</h2>
          <p>${election.description}</p>
          <ul class="candidate-list">
            ${candidatesHTML}
          </ul>
          <div class="results">
            <h3>Current Results:</h3>
            ${election.candidates.map(c => `
              <div>
                <strong>${c.name}:</strong> ${c.votes} votes
                <div class="progress-bar">
                  <div class="progress" style="width: ${calculatePercentage(election.candidates, c.votes)}%"></div>
                </div>
              </div>
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
      console.error(err);
      showError('Failed to load elections');
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
        alert('Vote recorded successfully!');
        loadElections();
      } else {
        showError(data.msg || 'Failed to record vote');
      }
    } catch (err) {
      showError('Server error. Please try again.');
    }
  }
});