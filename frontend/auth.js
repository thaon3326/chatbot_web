// Auth JavaScript
class AuthManager {
    constructor() {
        this.apiBase = '/api/auth';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkExistingAuth();
    }

    bindEvents() {
        // Form switching
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Form submissions
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    }

    showRegisterForm() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
        this.hideError();
    }

    showLoginForm() {
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
        this.hideError();
    }

    showLoading() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('authLoading').classList.remove('hidden');
        this.hideError();
    }

    hideLoading() {
        document.getElementById('authLoading').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('errorText').textContent = message;
        document.getElementById('errorMessage').classList.remove('hidden');
    }

    hideError() {
        document.getElementById('errorMessage').classList.add('hidden');
    }

    async handleLogin() {
        const formData = new FormData(document.getElementById('loginFormElement'));
        const loginData = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        if (!loginData.username || !loginData.password) {
            this.showError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${this.apiBase}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (response.ok) {
                // Lưu token và thông tin user
                localStorage.setItem('access_token', result.access_token);
                localStorage.setItem('user_info', JSON.stringify(result.user));
                
                // Chuyển hướng về trang chính
                window.location.href = '/';
            } else {
                this.hideLoading();
                this.showLoginForm();
                this.showError(result.detail || 'Đăng nhập thất bại');
            }
        } catch (error) {
            this.hideLoading();
            this.showLoginForm();
            this.showError('Lỗi kết nối. Vui lòng thử lại.');
            console.error('Login error:', error);
        }
    }

    async handleRegister() {
        const formData = new FormData(document.getElementById('registerFormElement'));
        const registerData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            full_name: formData.get('full_name') || null
        };

        const confirmPassword = formData.get('confirmPassword');

        // Validation
        if (!registerData.username || !registerData.email || !registerData.password) {
            this.showError('Vui lòng nhập đầy đủ thông tin bắt buộc');
            return;
        }

        if (registerData.password !== confirmPassword) {
            this.showError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (registerData.password.length < 6) {
            this.showError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${this.apiBase}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData)
            });

            const result = await response.json();

            if (response.ok) {
                // Đăng ký thành công, tự động đăng nhập
                this.hideLoading();
                this.showLoginForm();
                this.showError('Đăng ký thành công! Vui lòng đăng nhập.');
                
                // Tự động điền username
                document.getElementById('loginUsername').value = registerData.username;
            } else {
                this.hideLoading();
                this.showRegisterForm();
                this.showError(result.detail || 'Đăng ký thất bại');
            }
        } catch (error) {
            this.hideLoading();
            this.showRegisterForm();
            this.showError('Lỗi kết nối. Vui lòng thử lại.');
            console.error('Register error:', error);
        }
    }

    checkExistingAuth() {
        const token = localStorage.getItem('access_token');
        if (token) {
            // Kiểm tra token còn hợp lệ không
            this.verifyToken(token);
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch(`${this.apiBase}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Token hợp lệ, chuyển về trang chính
                window.location.href = '/';
            } else {
                // Token không hợp lệ, xóa khỏi localStorage
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_info');
            }
        } catch (error) {
            console.error('Token verification error:', error);
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_info');
        }
    }
}

// Khởi tạo AuthManager khi trang load
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});