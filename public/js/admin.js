// Admin-specific functionality
document.addEventListener('DOMContentLoaded', () => {
  window.adminJS = {
    init: () => {
      console.log('Admin JS initialized');
      adminJS.setupLogout();
      adminJS.setupNavigation();
      adminJS.loadElectionsManagement();
    },
    
    setupLogout: () => {
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          window.location.href = '../index.html';
        });
      }
    },
    
    setupNavigation: () => {
      document.querySelectorAll('.sidebar li').forEach(item => {
        item.addEventListener('click', () => {
          document.querySelectorAll('.sidebar li').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          
          const view = item.dataset.view;
          if (view === 'elections') {
            adminJS.loadElectionsManagement();
          } else if (view === 'results') {
            adminJS.loadResultsManagement();
          } else if (view === 'voters') {
            adminJS.loadVotersManagement();
          }
        });
      });
    },
    
    loadElectionsManagement: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }
        
        const res = await fetch('/api/admin/elections', {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || `Failed to load elections (Status: ${res.status})`);
        }
        
        const elections = await res.json();
        
        let html = `
          <h2>Manage Elections</h2>
          <button id="create-election-btn" class="btn">Create New Election</button>
          <div class="election-list">
        `;
        
        if (elections.length === 0) {
          html += `
            <div class="card">
              <p>No elections created yet. Click "Create New Election" to get started.</p>
            </div>
          `;
        } else {
          elections.forEach(election => {
            const statusClass = election.isActive ? 'status-active' : 'status-inactive';
            const statusText = election.isActive ? 'Active' : 'Inactive';
            const endDate = new Date(election.endDate).toLocaleString();
            
            html += `
              <div class="election-item">
                <div>
                  <h3>${election.title}</h3>
                  <p>${election.description}</p>
                  <p><strong>Ends:</strong> ${endDate}</p>
                  <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="election-actions">
                  <button class="btn" onclick="adminFunctions.editElection('${election._id}')">Edit</button>
                  <button class="btn btn-danger" onclick="adminFunctions.deleteElection('${election._id}')">Delete</button>
                  <button class="btn ${election.isActive ? 'btn-danger' : 'btn-success'}" 
                          onclick="adminFunctions.toggleElection('${election._id}', ${!election.isActive})">
                    ${election.isActive ? 'End Election' : 'Activate'}
                  </button>
                </div>
              </div>
            `;
          });
        }
        
        html += '</div>';
        
        document.getElementById('admin-content').innerHTML = html;
        
        // Add event listener for create button
        const createBtn = document.getElementById('create-election-btn');
        if (createBtn) {
          createBtn.addEventListener('click', adminJS.showCreateElectionForm);
        }
        
      } catch (err) {
        console.error('Error loading elections:', err);
        adminJS.showError(`Failed to load elections: ${err.message}`);
        
        // If it's an auth error, redirect to login
        if (err.message.includes('401') || err.message.includes('token')) {
          setTimeout(() => {
            window.location.href = '../admin-login.html';
          }, 3000);
        }
      }
    },
    
    showCreateElectionForm: () => {
      let candidateInputs = `
        <div class="candidate-inputs">
          <input type="text" class="candidate-name" placeholder="Candidate Name" required>
        </div>
      `;
      
      const html = `
        <h2>Create New Election</h2>
        <form id="create-election-form">
          <div class="form-group">
            <label for="title">Election Title</label>
            <input type="text" id="title" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" class="form-control" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label>Candidates <small>(minimum 2)</small></label>
            ${candidateInputs}
            <button type="button" class="add-candidate btn">Add Candidate</button>
          </div>
          <div class="form-group">
            <label for="endDate">End Date & Time</label>
            <input type="datetime-local" id="endDate" class="form-control" required>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="isActive" checked>
              Start Election Immediately
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-danger cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-success">Create Election</button>
          </div>
        </form>
      `;
      
      document.getElementById('admin-content').innerHTML = html;
      
      // Set default end date to 7 days from now
      const now = new Date();
      now.setDate(now.getDate() + 7);
      document.getElementById('endDate').value = now.toISOString().slice(0, 16);
      
      // Add event listeners
      document.querySelector('.add-candidate').addEventListener('click', () => {
        const container = document.querySelector('.candidate-inputs');
        const newInput = document.createElement('div');
        newInput.className = 'candidate-inputs';
        newInput.innerHTML = `
          <input type="text" class="candidate-name" placeholder="Candidate Name" required>
          <button type="button" class="remove-candidate btn btn-danger">&times;</button>
        `;
        container.appendChild(newInput);
        
        // Add remove functionality
        newInput.querySelector('.remove-candidate').addEventListener('click', () => {
          newInput.remove();
        });
      });
      
      document.getElementById('create-election-form').addEventListener('submit', adminJS.handleCreateElection);
      
      document.querySelector('.cancel-btn').addEventListener('click', () => {
        adminJS.loadElectionsManagement();
      });
    },
    
    handleCreateElection: async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      const endDate = document.getElementById('endDate').value;
      const isActive = document.getElementById('isActive').checked;
      const candidateInputs = document.querySelectorAll('.candidate-name');
      
      const candidates = Array.from(candidateInputs)
        .map(input => input.value.trim())
        .filter(name => name);
      
      if (candidates.length < 2) {
        adminJS.showError('At least 2 candidates are required');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }
        
        const res = await fetch('/api/admin/elections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({ 
            title, 
            description, 
            candidates, 
            endDate,
            isActive
          })
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || `Failed to create election (Status: ${res.status})`);
        }
        
        const election = await res.json();
        console.log('Election created:', election);
        
        alert('Election created successfully!');
        adminJS.loadElectionsManagement();
      } catch (err) {
        console.error('Error creating election:', err);
        adminJS.showError(`Failed to create election: ${err.message}`);
      }
    },
    
    editElection: async (id) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }
        
        const res = await fetch(`/api/admin/elections/${id}`, {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || `Failed to fetch election details (Status: ${res.status})`);
        }
        
        const election = await res.json();
        
        let candidateInputs = '';
        election.candidates.forEach((candidate, index) => {
          candidateInputs += `
            <div class="candidate-inputs">
              <input type="text" class="candidate-name" value="${candidate.name.replace(/"/g, '&quot;')}" required>
              ${index > 0 ? '<button type="button" class="remove-candidate btn btn-danger">&times;</button>' : ''}
            </div>
          `;
        });
        
        const html = `
          <h2>Edit Election: ${election.title}</h2>
          <form id="edit-election-form">
            <input type="hidden" id="election-id" value="${election._id}">
            <div class="form-group">
              <label for="title">Election Title</label>
              <input type="text" id="title" class="form-control" value="${election.title.replace(/"/g, '&quot;')}" required>
            </div>
            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" class="form-control" rows="3" required>${election.description}</textarea>
            </div>
            <div class="form-group">
              <label>Candidates</label>
              ${candidateInputs}
              <button type="button" class="add-candidate btn">Add Candidate</button>
            </div>
            <div class="form-group">
              <label for="endDate">End Date & Time</label>
              <input type="datetime-local" id="endDate" class="form-control" 
                     value="${new Date(election.endDate).toISOString().slice(0, 16)}" required>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="isActive" ${election.isActive ? 'checked' : ''}>
                Election is Active
              </label>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-danger cancel-btn">Cancel</button>
              <button type="submit" class="btn btn-success">Update Election</button>
            </div>
          </form>
        `;
        
        document.getElementById('admin-content').innerHTML = html;
        
        // Add event listeners
        document.querySelector('.add-candidate').addEventListener('click', () => {
          const container = document.querySelector('.candidate-inputs').parentElement;
          const newInput = document.createElement('div');
          newInput.className = 'candidate-inputs';
          newInput.innerHTML = `
            <input type="text" class="candidate-name" placeholder="Candidate Name" required>
            <button type="button" class="remove-candidate btn btn-danger">&times;</button>
          `;
          container.appendChild(newInput);
          
          newInput.querySelector('.remove-candidate').addEventListener('click', () => {
            newInput.remove();
          });
        });
        
        document.querySelectorAll('.remove-candidate').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.target.parentElement.remove();
          });
        });
        
        document.getElementById('edit-election-form').addEventListener('submit', adminJS.handleUpdateElection);
        
        document.querySelector('.cancel-btn').addEventListener('click', () => {
          adminJS.loadElectionsManagement();
        });
        
      } catch (err) {
        console.error('Error loading election:', err);
        adminJS.showError(`Failed to load election: ${err.message}`);
      }
    },
    
    handleUpdateElection: async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('election-id').value;
      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      const endDate = document.getElementById('endDate').value;
      const isActive = document.getElementById('isActive').checked;
      const candidateInputs = document.querySelectorAll('.candidate-name');
      
      const candidates = Array.from(candidateInputs)
        .map(input => input.value.trim())
        .filter(name => name);
      
      if (candidates.length < 2) {
        adminJS.showError('At least 2 candidates are required');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }
        
        const res = await fetch(`/api/admin/elections/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({ title, description, candidates, endDate, isActive })
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || `Failed to update election (Status: ${res.status})`);
        }
        
        alert('Election updated successfully!');
        adminJS.loadElectionsManagement();
      } catch (err) {
        console.error('Error updating election:', err);
        adminJS.showError(`Failed to update election: ${err.message}`);
      }
    },
    
    deleteElection: async (id) => {
      if (!confirm('Are you sure you want to delete this election? This action cannot be undone!')) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }
        
        const res = await fetch(`/api/admin/elections/${id}`, {
          method: 'DELETE',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || `Failed to delete election (Status: ${res.status})`);
        }
        
        alert('Election deleted successfully!');
        adminJS.loadElectionsManagement();
      } catch (err) {
        console.error('Error deleting election:', err);
        adminJS.showError(`Failed to delete election: ${err.message}`);
      }
    },
    
    toggleElection: async (id, isActive) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }
        
        const res = await fetch(`/api/admin/elections/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({ isActive })
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || `Failed to ${isActive ? 'activate' : 'end'} election (Status: ${res.status})`);
        }
        
        alert(`Election ${isActive ? 'activated' : 'ended'} successfully!`);
        adminJS.loadElectionsManagement();
      } catch (err) {
        console.error('Error toggling election status:', err);
        adminJS.showError(`Failed to ${isActive ? 'activate' : 'end'} election: ${err.message}`);
      }
    },
    
    loadResultsManagement: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }
        
        const res = await fetch('/api/admin/elections', {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || `Failed to fetch election results (Status: ${res.status})`);
        }
        
        const elections = await res.json();
        
        let html = '<h2>Election Results & Analytics</h2>';
        
        if (elections.length === 0) {
          html += `
            <div class="card">
              <p>No elections available to view results.</p>
            </div>
          `;
        } else {
          elections.forEach(election => {
            const totalVotes = election.candidates.reduce((sum, c) => sum + c.votes, 0);
            
            html += `
              <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                  <h3>${election.title} ${election.isActive ? '<span class="status-badge status-active">Active</span>' : '<span class="status-badge status-inactive">Completed</span>'}</h3>
                  <div>
                    <button class="btn" onclick="adminFunctions.editElection('${election._id}')">Edit</button>
                  </div>
                </div>
                <p>${new Date(election.startDate).toLocaleDateString()} - ${new Date(election.endDate).toLocaleDateString()}</p>
                <p><strong>Total Votes:</strong> ${totalVotes}</p>
                
                <div class="results">
                  ${election.candidates.map(c => `
                    <div class="candidate-result">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <strong>${c.name}:</strong>
                        <span>${c.votes} votes (${totalVotes > 0 ? ((c.votes/totalVotes)*100).toFixed(1) : 0}%)</span>
                      </div>
                      <div class="progress-bar">
                        <div class="progress" style="width: ${totalVotes > 0 ? ((c.votes/totalVotes)*100).toFixed(1) : 0}%"></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
                
                ${totalVotes > 0 ? `
                <div class="chart-container" style="margin-top: 20px; height: 300px;">
                  <canvas id="chart-${election._id}"></canvas>
                </div>
                ` : ''}
                
                <div class="audit-section" style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
                  <h3>Votes Audit Trail</h3>
                  <button class="btn" onclick="adminJS.loadVotesForElection('${election._id}')">View All Votes</button>
                </div>
              </div>
            `;
          });
        }
        
        document.getElementById('admin-content').innerHTML = html;
        
        // Load charts for elections with votes
        elections.forEach(election => {
          if (election.candidates.reduce((sum, c) => sum + c.votes, 0) > 0) {
            adminJS.loadChart(election);
          }
        });
        
      } catch (err) {
        console.error('Error loading results:', err);
        adminJS.showError(`Failed to load results: ${err.message}`);
      }
    },
    
    loadVotesForElection: async (electionId) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }
        
        // First get election details
        let res = await fetch(`/api/admin/elections/${electionId}`, {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || `Failed to fetch election details (Status: ${res.status})`);
        }
        
        const election = await res.json();
        
        // Then get all votes for this election
        res = await fetch(`/api/admin/elections/${electionId}/votes`, {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || `Failed to fetch votes (Status: ${res.status})`);
        }
        
        const votes = await res.json();
        
        let html = `
          <h2>Votes for: ${election.title}</h2>
          <div class="breadcrumb">
            <a href="#" onclick="adminJS.loadResultsManagement(); return false;">< Back to Results</a>
          </div>
          
          <div class="card">
            <h3>Election Details</h3>
            <p><strong>Status:</strong> ${election.isActive ? 'Active' : 'Completed'}</p>
            <p><strong>Total Votes:</strong> ${votes.length}</p>
            <p><strong>Date Range:</strong> ${new Date(election.startDate).toLocaleDateString()} - ${new Date(election.endDate).toLocaleDateString()}</p>
          </div>
          
          <div class="votes-list">
            <h3>All Votes (${votes.length})</h3>
            ${votes.length === 0 ? 
              '<p>No votes recorded for this election.</p>' : 
              `<table class="votes-table">
                <thead>
                  <tr>
                    <th>Voter ID</th>
                    <th>Candidate</th>
                    <th>Timestamp</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${votes.map(vote => `
                    <tr>
                      <td>${vote.user ? vote.user.matricNumber : 'Unknown'}</td>
                      <td>${vote.candidate}</td>
                      <td>${new Date(vote.timestamp).toLocaleString()}</td>
                      <td>
                        <button class="btn btn-danger" 
                                onclick="adminFunctions.removeVote('${vote._id}', '${electionId}')">
                          Remove Vote
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>`}
          </div>
        `;
        
        document.getElementById('admin-content').innerHTML = html;
        
      } catch (err) {
        console.error('Error loading votes:', err);
        adminJS.showError(`Failed to load votes: ${err.message}`);
      }
    },
    
    removeVote: async (voteId, electionId) => {
      if (!confirm('Are you sure you want to remove this vote? This action cannot be undone!')) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }
        
        const res = await fetch(`/api/admin/votes/${voteId}`, {
          method: 'DELETE',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || `Failed to remove vote (Status: ${res.status})`);
        }
        
        alert('Vote removed successfully!');
        adminJS.loadVotesForElection(electionId);
      } catch (err) {
        console.error('Error removing vote:', err);
        adminJS.showError(`Failed to remove vote: ${err.message}`);
      }
    },
    
    loadVotersManagement: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }
        
        const res = await fetch('/api/admin/voters', {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || `Failed to fetch voter list (Status: ${res.status})`);
        }
        
        const voters = await res.json();
        
        let html = `
          <h2>Manage Voters</h2>
          <div class="search-bar">
            <input type="text" id="voter-search" class="form-control" placeholder="Search voters...">
          </div>
          
          <div class="voters-list">
            <h3>Registered Voters (${voters.length})</h3>
            ${voters.length === 0 ? 
              '<p>No voters registered yet.</p>' : 
              `<table class="voters-table">
                <thead>
                  <tr>
                    <th>Matric Number</th>
                    <th>University</th>
                    <th>Voted Elections</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${voters.map(voter => `
                    <tr>
                      <td>${voter.matricNumber}</td>
                      <td>${voter.university}</td>
                      <td>${voter.hasVoted ? voter.hasVoted.length : 0}</td>
                      <td>
                        <button class="btn btn-danger" 
                                onclick="adminJS.resetVoterVotes('${voter._id}')">
                          Reset Votes
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>`}
          </div>
        `;
        
        document.getElementById('admin-content').innerHTML = html;
        
        // Add search functionality
        const searchInput = document.getElementById('voter-search');
        if (searchInput) {
          searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.voters-table tbody tr');
            
            rows.forEach(row => {
              const text = row.textContent.toLowerCase();
              row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
          });
        }
        
      } catch (err) {
        console.error('Error loading voters:', err);
        adminJS.showError(`Failed to load voters: ${err.message}`);
      }
    },
    
    resetVoterVotes: async (voterId) => {
      if (!confirm('Are you sure you want to reset this voter\'s votes? This will allow them to vote again in all elections.')) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }
        
        const res = await fetch(`/api/admin/voters/${voterId}/reset-votes`, {
          method: 'PUT',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || `Failed to reset votes (Status: ${res.status})`);
        }
        
        alert('Voter\'s votes reset successfully!');
        adminJS.loadVotersManagement();
      } catch (err) {
        console.error('Error resetting votes:', err);
        adminJS.showError(`Failed to reset votes: ${err.message}`);
      }
    },
    
    loadChart: (election) => {
      // This would normally use Chart.js, but we'll simulate it for this example
      // In a real implementation, you'd include Chart.js and create actual charts
      
      setTimeout(() => {
        const chartElement = document.getElementById(`chart-${election._id}`);
        if (chartElement) {
          chartElement.innerHTML = `
            <div style="background: #f8f9fa; border-radius: 5px; padding: 15px; text-align: center; height: 100%;">
              <h4 style="margin-bottom: 10px;">Vote Distribution</h4>
              <div style="display: flex; flex-direction: column; height: 220px; justify-content: center;">
                ${election.candidates.map(c => `
                  <div style="display: flex; align-items: center; margin: 5px 0;">
                    <div style="width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.name}</div>
                    <div style="flex: 1; height: 20px; background: #eee; border-radius: 10px; margin: 0 10px; overflow: hidden;">
                      <div style="height: 100%; width: ${((c.votes / election.candidates.reduce((sum, c) => sum + c.votes, 0)) * 100).toFixed(1)}%; 
                                   background: ${adminJS.getColorForIndex(election.candidates.indexOf(c))}; 
                                   border-radius: 10px;"></div>
                    </div>
                    <div style="width: 50px; text-align: right;">${((c.votes / election.candidates.reduce((sum, c) => sum + c.votes, 0)) * 100).toFixed(1)}%</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
      }, 100);
    },
    
    getColorForIndex: (index) => {
      const colors = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', 
        '#9b59b6', '#1abc9c', '#d35400', '#34495e'
      ];
      return colors[index % colors.length];
    },
    
    showError: (message) => {
      let errorDiv = document.getElementById('admin-error');
      if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'admin-error';
        errorDiv.className = 'error';
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
          formContainer.insertBefore(errorDiv, formContainer.firstChild);
        }
      }
      errorDiv.innerHTML = message;
      errorDiv.style.display = 'block';
      
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }
  };

  // Initialize admin dashboard
  window.addEventListener('load', () => {
    // Small delay to ensure DOM is fully loaded
    setTimeout(() => {
      adminJS.init();
    }, 100);
  });
});
