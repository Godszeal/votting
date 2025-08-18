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
                
      
