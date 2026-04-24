const renderSidebar = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const isPage = (name) => window.location.pathname.includes(name);

    const getNavLinks = (role) => {
        const links = [
            { href: '/dashboard.html', label: 'Dashboard', icon: 'layout-dashboard', id: 'dashboard' }
        ];

        if (role === 'doctor' || role === 'patient') {
            links.push({ href: '/medicines.html', label: 'Medication', icon: 'pill', id: 'medicines' });
        }

        if (role !== 'doctor') {
            links.push({ href: '/history.html', label: 'History', icon: 'activity', id: 'history' });
        }
        links.push({ href: '/profile.html', label: 'My Profile', icon: 'user', id: 'profile' });

        return links;
    };

    const navLinks = getNavLinks(user.role);

    const sidebarHTML = `
        <div class="sidebar">
            <div class="mb-12 px-4">
                <a href="/dashboard.html" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <i data-lucide="activity" class="w-6 h-6"></i>
                    </div>
                    <h1 class="text-2xl font-display font-bold text-slate-800 tracking-tight">MedRemind</h1>
                </a>
            </div>

            <nav class="flex flex-col gap-2">
                ${navLinks.map(link => `
                    <a href="${link.href}" class="nav-link ${isPage(link.id) ? 'active' : ''}">
                        <i data-lucide="${link.icon}"></i>
                        <span>${link.label}</span>
                    </a>
                `).join('')}
            </nav>

            <div class="mt-auto px-4">
                
                <button id="global-logout" class="w-full flex items-center justify-center gap-3 py-4 text-slate-500 hover:text-danger hover:bg-rose-50 rounded-2xl transition-all text-sm font-bold">
                    <i data-lucide="log-out" class="w-5 h-5"></i>
                    Logout
                </button>
            </div>
        </div>

        <nav class="mobile-nav">
            ${navLinks.map(link => `
                <a href="${link.href}" class="mobile-nav-link ${isPage(link.id) ? 'active' : ''}">
                    <i data-lucide="${link.icon}" class="w-6 h-6"></i>
                    <span>${link.label.split(' ')[0]}</span>
                </a>
            `).join('')}
        </nav>
    `;

    // Wrap content
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = '';
    
    const appContainer = document.createElement('div');
    appContainer.className = 'app-container';
    appContainer.innerHTML = sidebarHTML;

    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';
    
    // Task 35: Standard Header
    const standardHeader = `
        <header class="flex items-center justify-between mb-12 animate-fade-in">
            <div class="relative hidden lg:block">
                <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300"></i>
                <input type="text" placeholder="Search medical records..." class="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl w-96 outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm">
            </div>
            
            <div class="flex items-center gap-6">
                <a href="/profile.html" class="flex items-center gap-4 hover:opacity-80 transition-opacity">
                    <div class="text-right hidden sm:block">
                        <p class="text-sm font-bold text-slate-800">${user.name}</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${user.role}</p>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-white border-2 border-white shadow-md overflow-hidden hover:scale-105 transition-all cursor-pointer">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}" class="w-full h-full object-cover">
                    </div>
                </a>
            </div>
        </header>
    `;

    mainContent.innerHTML = standardHeader + `<div class="content-body">${originalContent}</div>`;
    appContainer.appendChild(mainContent);
    document.body.appendChild(appContainer);
    
    // Re-initialize icons
    if (window.lucide) lucide.createIcons();

    // Global Logout handler
    document.getElementById('global-logout')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/index.html';
    });
};

// Auto-render if not on index or register
if (!window.location.pathname.includes('index') && !window.location.pathname.includes('register') && window.location.pathname !== '/' && window.location.pathname.endsWith('.html')) {
    document.addEventListener('DOMContentLoaded', renderSidebar);
}
