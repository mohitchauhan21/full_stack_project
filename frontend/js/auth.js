const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Login form submitted');
        
        const email = document.getElementById('login-email')?.value;
        const password = document.getElementById('login-password')?.value;

        try {
            const res = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            console.log('Login response:', res);

            if (res && res.token) {
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));
                window.location.href = '/dashboard.html';
            } else {
                alert(res?.msg || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            alert('An error occurred');
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Registration form submitted');
        
        const name = document.getElementById('reg-name')?.value;
        const email = document.getElementById('reg-email')?.value;
        const password = document.getElementById('reg-password')?.value;
        const role = document.getElementById('role-select')?.value;
        const age = document.getElementById('reg-age')?.value;
        const doctorName = document.getElementById('reg-doctor')?.value;
        
        const data = { name, email, password, role, age, doctorName };
        console.log('Registration data:', data);

        try {
            const res = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            console.log('Registration response:', res);

            if (res && res.token) {
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));
                window.location.href = '/dashboard.html';
            } else {
                alert(res?.msg || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            alert('An error occurred');
        }
    });
}
