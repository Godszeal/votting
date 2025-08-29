document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav ul');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Faculty selection dropdown - populate departments
    const facultySelect = document.getElementById('faculty');
    const departmentSelect = document.getElementById('department');
    
    if (facultySelect && departmentSelect) {
        const departmentsByFaculty = {
            'Engineering': ['All Departments', 'Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering'],
            'Science': ['All Departments', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Geology'],
            'Arts': ['All Departments', 'English', 'History', 'Philosophy', 'Theatre Arts', 'Fine Arts'],
            'Medicine': ['All Departments', 'Medicine', 'Dentistry', 'Nursing', 'Pharmacy', 'Public Health'],
            'Business': ['All Departments', 'Accounting', 'Finance', 'Marketing', 'Management', 'Economics']
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

    // Check if user is authenticated for protected pages
    const protectedPages = ['dashboard.html', 'vote.html', 'profile.html', 'admin/'];
    const currentPath = window.location.pathname;
    const isProtectedPage = protectedPages.some(page => currentPath.includes(page));
    
    if (isProtectedPage) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
        }
    }
    
    // Password visibility toggle
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });
    
    // Handle logout across all pages
    const logoutBtns = document.querySelectorAll('.logout, .logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
        });
    });
    
    // Auto-logout after 30 minutes of inactivity
    let inactivityTimer;
    
    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login.html') {
                alert('You have been logged out due to inactivity.');
                window.location.href = 'login.html';
            }
        }, 30 * 60 * 1000); // 30 minutes
    };
    
    // Reset timer on user activity
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);
    
    // Initialize timer
    resetInactivityTimer();
});
