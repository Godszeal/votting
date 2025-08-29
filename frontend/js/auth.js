document.addEventListener('DOMContentLoaded', () => {
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Reset error messages
            document.getElementById('matricNumberError').textContent = '';
            document.getElementById('passwordError').textContent = '';
            
            const matricNumber = document.getElementById('matricNumber').value;
            const password = document.getElementById('password').value;
            let isValid = true;
            
            // Validate matric number
            if (!/^\d{10}$/.test(matricNumber)) {
                document.getElementById('matricNumberError').textContent = 'Matric number must be exactly 10 digits';
                isValid = false;
            }
            
            // Validate password
            if (password.length < 6) {
                document.getElementById('passwordError').textContent = 'Password must be at least 6 characters';
                isValid = false;
            }
            
            if (!isValid) return;
            
            try {
                // Show loading state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                submitBtn.disabled = true;
                
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ matricNumber, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Save token to localStorage
                    localStorage.setItem('token', data.token);
                    
                    // Redirect based on user role
                    if (data.user.role === 'admin') {
                        window.location.href = 'admin/dashboard.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    // Handle specific error messages
                    if (data.error.includes('Invalid credentials')) {
                        document.getElementById('passwordError').textContent = 'Invalid credentials. Please try again.';
                    } else {
                        document.getElementById('matricNumberError').textContent = data.error || 'Login failed. Please try again.';
                    }
                    
                    // Reset button state
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Login error:', error);
                document.getElementById('matricNumberError').textContent = 'Network error. Please check your connection.';
                
                // Reset button state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Reset error messages
            document.querySelectorAll('.error-message').forEach(el => {
                el.textContent = '';
                el.style.display = 'none';
            });
            
            const matricNumber = document.getElementById('matricNumber').value;
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const faculty = document.getElementById('faculty').value;
            const department = document.getElementById('department').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            let isValid = true;
            
            // Validate matric number
            if (!/^\d{10}$/.test(matricNumber)) {
                document.getElementById('matricNumberError').textContent = 'Matric number must be exactly 10 digits';
                document.getElementById('matricNumberError').style.display = 'block';
                isValid = false;
            }
            
            // Validate username
            if (username.length < 3) {
                document.getElementById('usernameError').textContent = 'Username must be at least 3 characters';
                document.getElementById('usernameError').style.display = 'block';
                isValid = false;
            }
            
            // Validate email
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(email)) {
                document.getElementById('emailError').textContent = 'Please enter a valid email address';
                document.getElementById('emailError').style.display = 'block';
                isValid = false;
            }
            
            // Validate faculty and department
            if (!faculty) {
                document.getElementById('facultyError').textContent = 'Please select a faculty';
                document.getElementById('facultyError').style.display = 'block';
                isValid = false;
            }
            
            if (!department) {
                document.getElementById('departmentError').textContent = 'Please select a department';
                document.getElementById('departmentError').style.display = 'block';
                isValid = false;
            }
            
            // Validate password
            if (password.length < 6) {
                document.getElementById('passwordError').textContent = 'Password must be at least 6 characters';
                document.getElementById('passwordError').style.display = 'block';
                isValid = false;
            }
            
            // Validate password match
            if (password !== confirmPassword) {
                document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
                document.getElementById('confirmPasswordError').style.display = 'block';
                isValid = false;
            }
            
            if (!isValid) return;
            
            try {
                // Show loading state
                const submitBtn = signupForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
                submitBtn.disabled = true;
                
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        matricNumber,
                        username,
                        email,
                        faculty,
                        department,
                        password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Save token to localStorage
                    localStorage.setItem('token', data.token);
                    
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    // Handle specific error messages
                    if (data.error.includes('matricNumber')) {
                        document.getElementById('matricNumberError').textContent = 'This matric number is already registered';
                        document.getElementById('matricNumberError').style.display = 'block';
                    } else if (data.error.includes('email')) {
                        document.getElementById('emailError').textContent = 'This email is already registered';
                        document.getElementById('emailError').style.display = 'block';
                    } else if (data.error.includes('username')) {
                        document.getElementById('usernameError').textContent = 'This username is already taken';
                        document.getElementById('usernameError').style.display = 'block';
                    } else {
                        document.getElementById('matricNumberError').textContent = data.error || 'Registration failed. Please try again.';
                        document.getElementById('matricNumberError').style.display = 'block';
                    }
                    
                    // Reset button state
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Registration error:', error);
                document.getElementById('matricNumberError').textContent = 'Network error. Please check your connection.';
                document.getElementById('matricNumberError').style.display = 'block';
                
                // Reset button state
                const submitBtn = signupForm.querySelector('button[type="submit"]');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Forgot password form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const matricNumber = document.getElementById('matricNumber').value;
            const username = document.getElementById('username').value;
            let isValid = true;
            
            // Reset error messages
            document.getElementById('matricNumberError').textContent = '';
            document.getElementById('matricNumberError').style.display = 'none';
            document.getElementById('usernameError').textContent = '';
            document.getElementById('usernameError').style.display = 'none';
            
            // Validate matric number
            if (!/^\d{10}$/.test(matricNumber)) {
                document.getElementById('matricNumberError').textContent = 'Matric number must be exactly 10 digits';
                document.getElementById('matricNumberError').style.display = 'block';
                isValid = false;
            }
            
            // Validate username
            if (username.length < 3) {
                document.getElementById('usernameError').textContent = 'Username must be at least 3 characters';
                document.getElementById('usernameError').style.display = 'block';
                isValid = false;
            }
            
            if (!isValid) return;
            
            try {
                // Show loading state
                const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                submitBtn.disabled = true;
                
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ matricNumber, username })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Show success message
                    const successMsg = document.createElement('div');
                    successMsg.className = 'success-message';
                    successMsg.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <span>Password reset link has been sent to your email. Please check your inbox.</span>
                    `;
                    forgotPasswordForm.insertBefore(successMsg, forgotPasswordForm.firstChild);
                    
                    // Disable form
                    forgotPasswordForm.querySelectorAll('input, button').forEach(el => {
                        el.disabled = true;
                    });
                } else {
                    document.getElementById('matricNumberError').textContent = data.error || 'User not found. Please check your details.';
                    document.getElementById('matricNumberError').style.display = 'block';
                    
                    // Reset button state
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Password reset error:', error);
                document.getElementById('matricNumberError').textContent = 'Network error. Please check your connection.';
                document.getElementById('matricNumberError').style.display = 'block';
                
                // Reset button state
                const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Reset password form
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            let isValid = true;
            
            // Reset error messages
            document.getElementById('newPasswordError').textContent = '';
            document.getElementById('newPasswordError').style.display = 'none';
            document.getElementById('confirmPasswordError').textContent = '';
            document.getElementById('confirmPasswordError').style.display = 'none';
            
            // Validate new password
            if (newPassword.length < 6) {
                document.getElementById('newPasswordError').textContent = 'Password must be at least 6 characters';
                document.getElementById('newPasswordError').style.display = 'block';
                isValid = false;
            }
            
            // Validate password match
            if (newPassword !== confirmPassword) {
                document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
                document.getElementById('confirmPasswordError').style.display = 'block';
                isValid = false;
            }
            
            if (!isValid) return;
            
            try {
                // Show loading state
                const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting password...';
                submitBtn.disabled = true;
                
                // Get token from URL
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');
                
                const response = await fetch('/api/auth/reset-password', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ password: newPassword })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Show success message
                    const successMsg = document.createElement('div');
                    successMsg.className = 'success-message';
                    successMsg.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <span>Password reset successful! You can now login with your new password.</span>
                    `;
                    resetPasswordForm.insertBefore(successMsg, resetPasswordForm.firstChild);
                    
                    // Redirect after 3 seconds
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 3000);
                } else {
                    document.getElementById('newPasswordError').textContent = data.error || 'Failed to reset password. Please try again.';
                    document.getElementById('newPasswordError').style.display = 'block';
                    
                    // Reset button state
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Password reset error:', error);
                document.getElementById('newPasswordError').textContent = 'Network error. Please check your connection.';
                document.getElementById('newPasswordError').style.display = 'block';
                
                // Reset button state
                const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
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
});
