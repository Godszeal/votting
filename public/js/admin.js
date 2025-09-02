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
      document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
          document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
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
          <div class="admin-header">
            <h1 class="admin-title">Elections Management</h1>
            <button id="create-election-btn" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create New Election
            </button>
          </div>
          
          <div class="election-list">
        `;
        
        if (elections.length === 0) {
          html += `
            <div class="card text-center" style="padding: 3rem; grid-column: 1 / -1;">
              <div style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem;">🗳️</div>
              <h2 style="margin-bottom: 1rem;">No Elections Created</h2>
              <p style="color: var(--gray); max-width: 500px; margin: 0 auto 1.5rem;">
                Get started by creating your first election. You can set up voting for specific faculties or departments.
              </p>
              <button id="create-first-election" class="btn btn-primary btn-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Create Your First Election
              </button>
            </div>
          `;
        } else {
          elections.forEach(election => {
            const statusClass = election.isActive ? 'status-active' : 'status-inactive';
            const statusText = election.isActive ? 'Active' : 'Inactive';
            const endDate = new Date(election.endDate).toLocaleString();
            
            // Format restriction badges
            let restrictionBadges = '';
            if (election.facultyRestriction) {
              restrictionBadges += `
                <span class="election-restriction">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  ${election.facultyRestriction} Faculty
                </span>
              `;
            }
            
            if (election.departmentRestrictions && election.departmentRestrictions.length > 0) {
              restrictionBadges += `
                <span class="election-restriction" style="background-color: var(--secondary);">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  ${election.departmentRestrictions.join(', ')}
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
            
            html += `
              <div class="election-item">
                <div class="election-item-content">
                  <div class="election-item-title">${election.title}</div>
                  <div class="election-item-description">${election.description}</div>
                  
                  <div class="election-item-meta">
                    <div class="election-item-date">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      Ends: ${endDate}
                    </div>
                    <div>
                      ${restrictionBadges}
                    </div>
                  </div>
                  
                  <div class="election-item-status ${statusClass}">
                    ${statusText}
                  </div>
                </div>
                <div class="election-actions">
                  <button class="btn btn-secondary btn-sm" onclick="adminFunctions.editElection('${election._id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="adminFunctions.deleteElection('${election._id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Delete
                  </button>
                  <button class="btn ${election.isActive ? 'btn-danger' : 'btn-success'} btn-sm" 
                          onclick="adminFunctions.toggleElection('${election._id}', ${!election.isActive})">
                    ${election.isActive ? 
                      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                         <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                         <line x1="15" y1="9" x2="9" y2="15"></line>
                         <line x1="9" y1="9" x2="15" y2="15"></line>
                       </svg> End` :
                      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                         <polyline points="22 11.08 22 17 16 23 8 23 2 17 2 11.08 7 6"></polyline>
                         <polyline points="2 17 15 4 19 8 22 11.08"></polyline>
                         <line x1="2" y1="12" x2="22" y2="12"></line>
                       </svg> Activate`}
                  </button>
                  <button class="btn btn-outline btn-sm" 
                          onclick="adminFunctions.copyVotingLink('${election.votingLink}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy Link
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
        
        // Add event listener for "Create Your First Election" button
        const firstElectionBtn = document.getElementById('create-first-election');
        if (firstElectionBtn) {
          firstElectionBtn.addEventListener('click', adminJS.showCreateElectionForm);
        }
        
      } catch (err) {
        console.error('Error loading elections:', err);
        adminJS.showError(`Failed to load elections: ${err.message}`);
      }
    },
    
    showCreateElectionForm: () => {
      let candidateInputs = `
        <div class="candidate-inputs">
          <div class="candidate-input">
            <input type="text" class="candidate-name form-control" placeholder="Candidate Name" required>
            <button type="button" class="remove-candidate" title="Remove candidate">&times;</button>
          </div>
        </div>
      `;
      
      const html = `
        <div class="form-container">
          <h2 class="form-title">Create New Election</h2>
          
          <form id="create-election-form">
            <div class="form-group">
              <label class="form-label" for="title">Election Title</label>
              <input type="text" id="title" class="form-control" placeholder="E.g., Student Union President Election" required>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="description">Description</label>
              <textarea id="description" class="form-control" rows="3" placeholder="Describe the election and its importance" required></textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label">Candidates <small>(minimum 2)</small></label>
              ${candidateInputs}
              <button type="button" class="add-candidate">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Candidate
              </button>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="facultyRestriction">Faculty Restriction</label>
              <select id="facultyRestriction" class="form-control form-select">
                <option value="">No Faculty Restriction (All Faculties)</option>
                <option value="Faculty of Computing and Informatics">Faculty of Computing and Informatics</option>
                <option value="Engineering">Engineering</option>
                <option value="Sciences">Sciences</option>
                <option value="Arts & Humanities">Arts & Humanities</option>
                <option value="Social Sciences">Social Sciences</option>
                <option value="Medicine">Medicine</option>
                <option value="Law">Law</option>
                <option value="Business Administration">Business Administration</option>
                <option value="Education">Education</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="departmentRestrictions">Department Restrictions</label>
              <select id="departmentRestrictions" class="form-control form-select" multiple>
                <!-- Options will be populated based on faculty selection -->
              </select>
              <small class="text-gray">Hold Ctrl/Cmd to select multiple departments</small>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="endDate">End Date & Time</label>
              <input type="datetime-local" id="endDate" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" id="isActive" checked style="margin-right: 0.5rem;">
                Start Election Immediately
              </label>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-outline" id="cancel-btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Election</button>
            </div>
          </form>
        </div>
      `;
      
      document.getElementById('admin-content').innerHTML = html;
      
      // Set default end date to 7 days from now
      const now = new Date();
      now.setDate(now.getDate() + 7);
      document.getElementById('endDate').value = now.toISOString().slice(0, 16);
      
      // Faculty to department mapping
      const facultyDepartments = {
        'Faculty of Computing and Informatics': [
          'Computer Science',
          'Information System Science',
          'Cyber Security',
          ],
        'Engineering': [
          'Computer Science',
          'Electrical Engineering',
          'Mechanical Engineering',
          'Civil Engineering',
          'Chemical Engineering'
        ],
        'Sciences': [
          'Physics',
          'Chemistry',
          'Mathematics',
          'Biology',
          'Geology'
        ],
        'Arts & Humanities': [
          'English',
          'History',
          'Philosophy',
          'Linguistics',
          'Theatre Arts'
        ],
        'Social Sciences': [
          'Economics',
          'Political Science',
          'Sociology',
          'Psychology',
          'Geography'
        ],
        'Medicine': [
          'Medicine',
          'Nursing',
          'Dentistry',
          'Pharmacy',
          'Public Health'
        ],
        'Law': [
          'Law'
        ],
        'Business Administration': [
          'Accounting',
          'Finance',
          'Marketing',
          'Management',
          'Human Resources'
        ],
        'Education': [
          'Primary Education',
          'Secondary Education',
          'Adult Education',
          'Special Education',
          'Curriculum Studies'
        ]
      };
      
      // Handle faculty selection change
      const facultyRestriction = document.getElementById('facultyRestriction');
      const departmentRestrictions = document.getElementById('departmentRestrictions');
      
      facultyRestriction.addEventListener('change', function() {
        departmentRestrictions.innerHTML = '';
        
        const selectedFaculty = this.value;
        if (selectedFaculty && facultyDepartments[selectedFaculty]) {
          facultyDepartments[selectedFaculty].forEach(department => {
            const option = document.createElement('option');
            option.value = department;
            option.textContent = department;
            departmentRestrictions.appendChild(option);
          });
        }
      });
      
      // Add event listeners
      document.querySelector('.add-candidate').addEventListener('click', () => {
        const container = document.querySelector('.candidate-inputs');
        const newInput = document.createElement('div');
        newInput.className = 'candidate-inputs';
        newInput.innerHTML = `
          <div class="candidate-input">
            <input type="text" class="candidate-name form-control" placeholder="Candidate Name" required>
            <button type="button" class="remove-candidate" title="Remove candidate">&times;</button>
          </div>
        `;
        container.appendChild(newInput);
        
        // Add remove functionality
        newInput.querySelector('.remove-candidate').addEventListener('click', () => {
          newInput.remove();
        });
      });
      
      document.querySelectorAll('.remove-candidate').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.target.closest('.candidate-inputs').remove();
        });
      });
      
      document.getElementById('create-election-form').addEventListener('submit', adminJS.handleCreateElection);
      
      document.getElementById('cancel-btn').addEventListener('click', () => {
        adminJS.loadElectionsManagement();
      });
    },
    
    handleCreateElection: async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      const endDate = document.getElementById('endDate').value;
      const isActive = document.getElementById('isActive').checked;
      const facultyRestriction = document.getElementById('facultyRestriction').value || null;
      
      // Get selected departments
      const departmentRestrictions = [];
      const selectedOptions = document.getElementById('departmentRestrictions').selectedOptions;
      for (let i = 0; i < selectedOptions.length; i++) {
        departmentRestrictions.push(selectedOptions[i].value);
      }
      
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
            isActive,
            facultyRestriction,
            departmentRestrictions
          })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || `Failed to create election (Status: ${res.status})`);
        }
        
        adminJS.showSuccess('Election created successfully!');
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
              <div class="candidate-input">
                <input type="text" class="candidate-name form-control" value="${candidate.name.replace(/"/g, '&quot;')}" required>
                ${index > 0 ? 
                  `<button type="button" class="remove-candidate" title="Remove candidate">&times;</button>` : 
                  ''}
              </div>
            </div>
          `;
        });
        
        // Faculty to department mapping
        const facultyDepartments = {
          'Faculty of Computing and Informatics': [
          'Computer Science',
          'Information System Science',
          'Cyber Security',
          ],
          'Engineering': [
            'Computer Science',
            'Electrical Engineering',
            'Mechanical Engineering',
            'Civil Engineering',
            'Chemical Engineering'
          ],
          'Sciences': [
            'Physics',
            'Chemistry',
            'Mathematics',
            'Biology',
            'Geology'
          ],
          'Arts & Humanities': [
            'English',
            'History',
            'Philosophy',
            'Linguistics',
            'Theatre Arts'
          ],
          'Social Sciences': [
            'Economics',
            'Political Science',
            'Sociology',
            'Psychology',
            'Geography'
          ],
          'Medicine': [
            'Medicine',
            'Nursing',
            'Dentistry',
            'Pharmacy',
            'Public Health'
          ],
          'Law': [
            'Law'
          ],
          'Business Administration': [
            'Accounting',
            'Finance',
            'Marketing',
            'Management',
            'Human Resources'
          ],
          'Education': [
            'Primary Education',
            'Secondary Education',
            'Adult Education',
            'Special Education',
            'Curriculum Studies'
          ]
        };
        
        const html = `
          <div class="form-container">
            <h2 class="form-title">Edit Election: ${election.title}</h2>
            
            <form id="edit-election-form">
              <input type="hidden" id="election-id" value="${election._id}">
              
              <div class="form-group">
                <label class="form-label" for="title">Election Title</label>
                <input type="text" id="title" class="form-control" value="${election.title.replace(/"/g, '&quot;')}" required>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="description">Description</label>
                <textarea id="description" class="form-control" rows="3" required>${election.description}</textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">Candidates</label>
                ${candidateInputs}
                <button type="button" class="add-candidate">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Candidate
                </button>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="facultyRestriction">Faculty Restriction</label>
                <select id="facultyRestriction" class="form-control form-select">
                  <option value="" ${!election.facultyRestriction ? 'selected' : ''}>No Faculty Restriction (All Faculties)</option>
                  <option value="Engineering" ${election.facultyRestriction === 'Engineering' ? 'selected' : ''}>Engineering</option>
                  <option value="Sciences" ${election.facultyRestriction === 'Sciences' ? 'selected' : ''}>Sciences</option>
                  <option value="Arts & Humanities" ${election.facultyRestriction === 'Arts & Humanities' ? 'selected' : ''}>Arts & Humanities</option>
                  <option value="Social Sciences" ${election.facultyRestriction === 'Social Sciences' ? 'selected' : ''}>Social Sciences</option>
                  <option value="Medicine" ${election.facultyRestriction === 'Medicine' ? 'selected' : ''}>Medicine</option>
                  <option value="Law" ${election.facultyRestriction === 'Law' ? 'selected' : ''}>Law</option>
                  <option value="Business Administration" ${election.facultyRestriction === 'Business Administration' ? 'selected' : ''}>Business Administration</option>
                  <option value="Education" ${election.facultyRestriction === 'Education' ? 'selected' : ''}>Education</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="departmentRestrictions">Department Restrictions</label>
                <select id="departmentRestrictions" class="form-control form-select" multiple>
                  <!-- Options will be populated based on faculty selection -->
                </select>
                <small class="text-gray">Hold Ctrl/Cmd to select multiple departments</small>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="endDate">End Date & Time</label>
                <input type="datetime-local" id="endDate" class="form-control" 
                       value="${new Date(election.endDate).toISOString().slice(0, 16)}" required>
              </div>
              
              <div class="form-group">
                <label class="form-label">
                  <input type="checkbox" id="isActive" ${election.isActive ? 'checked' : ''} style="margin-right: 0.5rem;">
                  Election is Active
                </label>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn btn-outline" id="cancel-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Election</button>
              </div>
            </form>
          </div>
        `;
        
        document.getElementById('admin-content').innerHTML = html;
        
        // Populate departments based on faculty
        const facultyRestriction = document.getElementById('facultyRestriction');
        const departmentRestrictions = document.getElementById('departmentRestrictions');
        
        // Function to populate departments
        const populateDepartments = () => {
          departmentRestrictions.innerHTML = '';
          
          const selectedFaculty = facultyRestriction.value;
          if (selectedFaculty && facultyDepartments[selectedFaculty]) {
            facultyDepartments[selectedFaculty].forEach(department => {
              const option = document.createElement('option');
              option.value = department;
              option.textContent = department;
              
              // Check if this department is in the election's restrictions
              if (election.departmentRestrictions && election.departmentRestrictions.includes(department)) {
                option.selected = true;
              }
              
              departmentRestrictions.appendChild(option);
            });
          }
        };
        
        // Initial population
        populateDepartments();
        
        // Update departments when faculty changes
        facultyRestriction.addEventListener('change', populateDepartments);
        
        // Add event listeners
        document.querySelector('.add-candidate').addEventListener('click', () => {
          const container = document.querySelector('.candidate-inputs').parentElement;
          const newInput = document.createElement('div');
          newInput.className = 'candidate-inputs';
          newInput.innerHTML = `
            <div class="candidate-input">
              <input type="text" class="candidate-name form-control" placeholder="Candidate Name" required>
              <button type="button" class="remove-candidate" title="Remove candidate">&times;</button>
            </div>
          `;
          container.appendChild(newInput);
          
          newInput.querySelector('.remove-candidate').addEventListener('click', () => {
            newInput.remove();
          });
        });
        
        document.querySelectorAll('.remove-candidate').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.target.closest('.candidate-inputs').remove();
          });
        });
        
        document.getElementById('edit-election-form').addEventListener('submit', adminJS.handleUpdateElection);
        
        document.getElementById('cancel-btn').addEventListener('click', () => {
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
      const facultyRestriction = document.getElementById('facultyRestriction').value || null;
      
      // Get selected departments
      const departmentRestrictions = [];
      const selectedOptions = document.getElementById('departmentRestrictions').selectedOptions;
      for (let i = 0; i < selectedOptions.length; i++) {
        departmentRestrictions.push(selectedOptions[i].value);
      }
      
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
          body: JSON.stringify({ 
            title, 
            description, 
            candidates, 
            endDate,
            isActive,
            facultyRestriction,
            departmentRestrictions
          })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || `Failed to update election (Status: ${res.status})`);
        }
        
        adminJS.showSuccess('Election updated successfully!');
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
        
        adminJS.showSuccess('Election deleted successfully!');
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
        
        adminJS.showSuccess(`Election ${isActive ? 'activated' : 'ended'} successfully!`);
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
        
        let html = `
          <div class="admin-header">
            <h1 class="admin-title">Election Results & Analytics</h1>
          </div>
          
          <div class="results-grid">
        `;
        
        if (elections.length === 0) {
          html += `
            <div class="card text-center" style="padding: 3rem; grid-column: 1 / -1;">
              <div style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem;">📊</div>
              <h2 style="margin-bottom: 1rem;">No Election Results Available</h2>
              <p style="color: var(--gray); max-width: 500px; margin: 0 auto;">
                Create elections to start collecting votes and viewing results.
              </p>
            </div>
          `;
        } else {
          elections.forEach(election => {
            const totalVotes = election.candidates.reduce((sum, c) => sum + c.votes, 0);
            
            // Format restriction badges
            let restrictionBadges = '';
            if (election.facultyRestriction) {
              restrictionBadges += `
                <span class="election-restriction">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  ${election.facultyRestriction} Faculty
                </span>
              `;
            }
            
            if (election.departmentRestrictions && election.departmentRestrictions.length > 0) {
              restrictionBadges += `
                <span class="election-restriction" style="background-color: var(--secondary);">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  ${election.departmentRestrictions.join(', ')}
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
            
            html += `
              <div class="result-card">
                <div class="result-header">
                  <div>
                    <h3 class="result-title">${election.title}</h3>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                      ${restrictionBadges}
                      <span class="result-status ${election.isActive ? 'status-active' : 'status-inactive'}">
                        ${election.isActive ? 'Active' : 'Completed'}
                      </span>
                    </div>
                  </div>
                  <button class="btn btn-secondary" onclick="adminFunctions.editElection('${election._id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                </div>
                
                <div class="result-body">
                  <p style="color: var(--gray); margin-bottom: 1.5rem;">${election.description}</p>
                  
                  <div class="results-stats">
                    <div class="stat-card">
                      <div class="stat-value">${totalVotes}</div>
                      <div class="stat-label">Total Votes</div>
                    </div>
                    
                    <div class="stat-card">
                      <div class="stat-value">${election.candidates.length}</div>
                      <div class="stat-label">Candidates</div>
                    </div>
                    
                    <div class="stat-card">
                      <div class="stat-value">${election.isActive ? 'Ongoing' : 'Completed'}</div>
                      <div class="stat-label">Status</div>
                    </div>
                  </div>
                  
                  <div class="candidate-results" style="margin-top: 1.5rem;">
                    ${election.candidates.map(c => `
                      <div class="candidate-result">
                        <div class="candidate-name">
                          <span>${c.name}</span>
                          <span>${c.votes} votes (${totalVotes > 0 ? ((c.votes/totalVotes)*100).toFixed(1) : 0}%)</span>
                        </div>
                        <div class="progress-bar">
                          <div class="progress" style="width: ${totalVotes > 0 ? ((c.votes/totalVotes)*100).toFixed(1) : 0}%"></div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                  
                  <div class="audit-section">
                    <button class="btn btn-primary" onclick="adminJS.loadVotesForElection('${election._id}')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      View All Votes
                    </button>
                  </div>
                </div>
              </div>
            `;
          });
        }
        
        html += '</div>';
        
        document.getElementById('admin-content').innerHTML = html;
        
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
        
        // Format restriction badges
        let restrictionBadges = '';
        if (election.facultyRestriction) {
          restrictionBadges += `
            <span class="election-restriction">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              ${election.facultyRestriction} Faculty
            </span>
          `;
        }
        
        if (election.departmentRestrictions && election.departmentRestrictions.length > 0) {
          restrictionBadges += `
            <span class="election-restriction" style="background-color: var(--secondary);">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              ${election.departmentRestrictions.join(', ')}
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
        
        let html = `
          <div class="admin-header">
            <div>
              <h1 class="admin-title">Votes for: ${election.title}</h1>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                ${restrictionBadges}
                <span class="result-status ${election.isActive ? 'status-active' : 'status-inactive'}">
                  ${election.isActive ? 'Active' : 'Completed'}
                </span>
              </div>
            </div>
            <button class="btn btn-outline" onclick="adminJS.loadResultsManagement()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Results
            </button>
          </div>
          
          <div class="card" style="margin-bottom: 1.5rem;">
            <div class="card-header">
              <h3 class="card-title">Election Details</h3>
            </div>
            <div class="card-body">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                <div>
                  <p style="color: var(--gray); margin-bottom: 0.25rem;">Status</p>
                  <p>${election.isActive ? 'Active' : 'Completed'}</p>
                </div>
                <div>
                  <p style="color: var(--gray); margin-bottom: 0.25rem;">Total Votes</p>
                  <p>${votes.length}</p>
                </div>
                <div>
                  <p style="color: var(--gray); margin-bottom: 0.25rem;">Date Range</p>
                  <p>${new Date(election.startDate).toLocaleDateString()} - ${new Date(election.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">All Votes (${votes.length})</h3>
            </div>
            <div class="card-body">
              ${votes.length === 0 ? 
                '<p>No votes recorded for this election.</p>' : 
                `<div class="table-responsive">
                  <table class="voters-table">
                    <thead>
                      <tr>
                        <th>Matric Number</th>
                        <th>Faculty</th>
                        <th>Department</th>
                        <th>Candidate</th>
                        <th>Timestamp</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${votes.map(vote => `
                        <tr>
                          <td>${vote.user ? vote.user.matricNumber : 'Unknown'}</td>
                          <td>${vote.user ? vote.user.faculty : 'N/A'}</td>
                          <td>${vote.user ? vote.user.department : 'N/A'}</td>
                          <td>${vote.candidate}</td>
                          <td>${new Date(vote.timestamp).toLocaleString()}</td>
                          <td>
                            <button class="btn btn-danger btn-sm" 
                                    onclick="adminFunctions.removeVote('${vote._id}', '${electionId}')">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>`}
            </div>
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
        
        adminJS.showSuccess('Vote removed successfully!');
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
          <div class="admin-header">
            <h1 class="admin-title">Manage Voters</h1>
          </div>
          
          <div class="card" style="margin-bottom: 1.5rem;">
            <div class="card-body">
              <div class="search-bar">
                <input type="text" id="voter-search" class="form-control" placeholder="Search voters by matric number, faculty, or department...">
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Registered Voters (${voters.length})</h3>
            </div>
            <div class="card-body">
              ${voters.length === 0 ? 
                '<p>No voters registered yet.</p>' : 
                `<div class="table-responsive">
                  <table class="voters-table">
                    <thead>
                      <tr>
                        <th>Matric Number</th>
                        <th>Faculty</th>
                        <th>Department</th>
                        <th>Voted Elections</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${voters.map(voter => `
                        <tr>
                          <td>${voter.matricNumber}</td>
                          <td>${voter.faculty}</td>
                          <td>${voter.department}</td>
                          <td>${voter.hasVoted ? voter.hasVoted.length : 0}</td>
                          <td>
                            <button class="btn btn-danger" 
                                    onclick="adminJS.resetVoterVotes('${voter._id}')">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                                <line x1="16" y1="8" x2="2" y2="22"></line>
                                <line x1="17.5" y1="15" x2="9" y2="15"></line>
                              </svg>
                              Reset Votes
                            </button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>`}
            </div>
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
        
        adminJS.showSuccess('Voter\'s votes reset successfully!');
        adminJS.loadVotersManagement();
      } catch (err) {
        console.error('Error resetting votes:', err);
        adminJS.showError(`Failed to reset votes: ${err.message}`);
      }
    },
    
    copyVotingLink: async (link) => {
      try {
        await navigator.clipboard.writeText(link);
        
        // Show success message
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Voting link copied to clipboard!
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
        }, 3000);
      } catch (err) {
        console.error('Error copying voting link:', err);
        
        // Show error message
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger';
        alertDiv.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Failed to copy voting link
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
    },
    
    showSuccess: (message) => {
      adminJS.showAlert(message, 'success');
    },
    
    showError: (message) => {
      adminJS.showAlert(message, 'danger');
    },
    
    showAlert: (message, type) => {
      let alertDiv = document.getElementById('admin-alert');
      if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.id = 'admin-alert';
        alertDiv.className = `alert alert-${type}`;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.maxWidth = '400px';
        alertDiv.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        document.body.appendChild(alertDiv);
      }
      
      alertDiv.className = `alert alert-${type}`;
      alertDiv.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;">
          ${type === 'success' ? 
            `<polyline points="20 6 9 17 4 12"></polyline>` : 
            `<circle cx="12" cy="12" r="10"></circle>
             <line x1="12" y1="8" x2="12" y2="12"></line>
             <line x1="12" y1="16" x2="12.01" y2="16"></line>`}
        </svg>
        ${message}
      `;
      
      alertDiv.style.display = 'flex';
      
      setTimeout(() => {
        alertDiv.style.display = 'none';
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
