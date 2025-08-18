// Admin-specific functionality
document.addEventListener('DOMContentLoaded', () => {
  // Only run if we're on the admin dashboard
  if (window.location.pathname.includes('admin-dashboard')) {
    setupAdminNavigation();
    loadElectionsManagement();
  }
});

function setupAdminNavigation() {
  document.querySelectorAll('.sidebar li').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.sidebar li').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      const view = item.dataset.view;
      if (view === 'elections') {
        loadElectionsManagement();
      } else if (view === 'results') {
        loadResultsManagement();
      }
    });
  });
}

async function loadElectionsManagement() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/elections', {
      headers: {
        'x-auth-token': token
      }
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch elections');
    }
    
    const elections = await res.json();
    
    let html = `
      <h2>Manage Elections</h2>
      <button id="create-election-btn" class="btn">Create New Election</button>
      <div class="election-list">
    `;
    
    elections.forEach(election => {
      const statusClass = election.isActive ? 'status-active' : 'status-inactive';
      const statusText = election.isActive ? 'Active' : 'Inactive';
      
      html += `
        <div class="election-item">
          <div>
            <h3>${election.title}</h3>
            <p>${new Date(election.startDate).toLocaleDateString()} - ${new Date(election.endDate).toLocaleDateString()}</p>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="election-actions">
            <button class="btn" onclick="editElection('${election._id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteElection('${election._id}')">Delete</button>
            <button class="btn ${election.isActive ? 'btn-danger' : 'btn-success'}" 
                    onclick="toggleElection('${election._id}', ${!election.isActive})">
              ${election.isActive ? 'End' : 'Activate'}
            </button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    document.getElementById('admin-content').innerHTML = html;
    
    // Add event listener for create button
    document.getElementById('create-election-btn').addEventListener('click', showCreateElectionForm);
    
  } catch (err) {
    console.error('Error loading elections:', err);
    showAdminError('Failed to load elections. Please try again.');
  }
}

function showCreateElectionForm() {
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
        <textarea id="description" class="form-control" required></textarea>
      </div>
      <div class="form-group">
        <label>Candidates</label>
        ${candidateInputs}
        <button type="button" class="add-candidate">Add Candidate</button>
      </div>
      <div class="form-group">
        <label for="endDate">End Date</label>
        <input type="datetime-local" id="endDate" class="form-control" required>
      </div>
      <button type="submit" class="btn">Create Election</button>
    </form>
  `;
  
  document.getElementById('admin-content').innerHTML = html;
  
  // Add event listeners
  document.querySelector('.add-candidate').addEventListener('click', () => {
    const container = document.querySelector('.candidate-inputs');
    const newInput = document.createElement('div');
    newInput.className = 'candidate-inputs';
    newInput.innerHTML = `
      <input type="text" class="candidate-name" placeholder="Candidate Name" required>
      <button type="button" class="remove-candidate">&times;</button>
    `;
    container.appendChild(newInput);
    
    // Add remove functionality
    newInput.querySelector('.remove-candidate').addEventListener('click', () => {
      newInput.remove();
    });
  });
  
  document.getElementById('create-election-form').addEventListener('submit', handleCreateElection);
}

async function handleCreateElection(e) {
  e.preventDefault();
  
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const endDate = document.getElementById('endDate').value;
  const candidateInputs = document.querySelectorAll('.candidate-name');
  
  const candidates = Array.from(candidateInputs)
    .map(input => input.value.trim())
    .filter(name => name);
  
  if (candidates.length < 2) {
    showAdminError('At least 2 candidates are required');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/elections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ title, description, candidates, endDate })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to create election');
    }
    
    alert('Election created successfully!');
    loadElectionsManagement();
  } catch (err) {
    console.error('Error creating election:', err);
    showAdminError(`Failed to create election: ${err.message}`);
  }
}

window.editElection = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/elections/${id}`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch election details');
    }
    
    const election = await res.json();
    
    let candidateInputs = '';
    election.candidates.forEach((candidate, index) => {
      candidateInputs += `
        <div class="candidate-inputs">
          <input type="text" class="candidate-name" value="${candidate.name}" required>
          ${index > 0 ? '<button type="button" class="remove-candidate">&times;</button>' : ''}
        </div>
      `;
    });
    
    const html = `
      <h2>Edit Election</h2>
      <form id="edit-election-form">
        <input type="hidden" id="election-id" value="${election._id}">
        <div class="form-group">
          <label for="title">Election Title</label>
          <input type="text" id="title" class="form-control" value="${election.title}" required>
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" class="form-control" required>${election.description}</textarea>
        </div>
        <div class="form-group">
          <label>Candidates</label>
          ${candidateInputs}
          <button type="button" class="add-candidate">Add Candidate</button>
        </div>
        <div class="form-group">
          <label for="endDate">End Date</label>
          <input type="datetime-local" id="endDate" class="form-control" 
                 value="${new Date(election.endDate).toISOString().slice(0, 16)}" required>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="isActive" ${election.isActive ? 'checked' : ''}>
            Active
          </label>
        </div>
        <button type="submit" class="btn">Update Election</button>
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
        <button type="button" class="remove-candidate">&times;</button>
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
    
    document.getElementById('edit-election-form').addEventListener('submit', handleUpdateElection);
    
  } catch (err) {
    console.error('Error loading election:', err);
    showAdminError(`Failed to load election: ${err.message}`);
  }
};

async function handleUpdateElection(e) {
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
    showAdminError('At least 2 candidates are required');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/elections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ title, description, candidates, endDate, isActive })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update election');
    }
    
    alert('Election updated successfully!');
    loadElectionsManagement();
  } catch (err) {
    console.error('Error updating election:', err);
    showAdminError(`Failed to update election: ${err.message}`);
  }
}

window.deleteElection = async (id) => {
  if (!confirm('Are you sure you want to delete this election?')) return;
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/elections/${id}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token
      }
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to delete election');
    }
    
    alert('Election deleted successfully!');
    loadElectionsManagement();
  } catch (err) {
    console.error('Error deleting election:', err);
    showAdminError(`Failed to delete election: ${err.message}`);
  }
};

window.toggleElection = async (id, isActive) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/elections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ isActive })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || `Failed to ${isActive ? 'activate' : 'end'} election`);
    }
    
    alert(`Election ${isActive ? 'activated' : 'ended'} successfully!`);
    loadElectionsManagement();
  } catch (err) {
    console.error('Error toggling election status:', err);
    showAdminError(`Failed to ${isActive ? 'activate' : 'end'} election: ${err.message}`);
  }
};

async function loadResultsManagement() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/elections', {
      headers: {
        'x-auth-token': token
      }
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch election results');
    }
    
    const elections = await res.json();
    
    let html = '<h2>Election Results</h2>';
    
    elections.forEach(election => {
      const totalVotes = election.candidates.reduce((sum, c) => sum + c.votes, 0);
      
      html += `
        <div class="card">
          <h3>${election.title} ${election.isActive ? '(Active)' : '(Completed)'}</h3>
          <p>${new Date(election.startDate).toLocaleDateString()} - ${new Date(election.endDate).toLocaleDateString()}</p>
          <p>Total Votes: ${totalVotes}</p>
          <div class="results">
            ${election.candidates.map(c => `
              <div>
                <strong>${c.name}:</strong> ${c.votes} votes (${totalVotes > 0 ? ((c.votes/totalVotes)*100).toFixed(1) : 0}%)
                <div class="progress-bar">
                  <div class="progress" style="width: ${totalVotes > 0 ? ((c.votes/totalVotes)*100).toFixed(1) : 0}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
    
    document.getElementById('admin-content').innerHTML = html;
    
  } catch (err) {
    console.error('Error loading results:', err);
    showAdminError(`Failed to load results: ${err.message}`);
  }
}

function showAdminError(message) {
  let errorDiv = document.getElementById('admin-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'admin-error';
    errorDiv.className = 'error';
    document.getElementById('admin-content').prepend(errorDiv);
  }
  errorDiv.innerHTML = message;
  errorDiv.classList.remove('hidden');
  
  setTimeout(() => {
    errorDiv.classList.add('hidden');
  }, 5000);
}