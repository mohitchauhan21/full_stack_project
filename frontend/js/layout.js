// Apply theme immediately
if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

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
    
    const greetingLabel = user.role === 'doctor'
        ? 'Clinical Control Center'
        : user.role === 'caregiver'
        ? 'Caregiver Hub'
        : 'Personal Health Dashboard';

    const showGreeting = isPage('dashboard');

    let rawName = user.name.trim();
    if (rawName.toLowerCase().startsWith('dr. ')) rawName = rawName.substring(4);
    else if (rawName.toLowerCase().startsWith('dr ')) rawName = rawName.substring(3);
    
    const firstName = rawName.split(' ')[0];
    const greetingName = user.role === 'doctor' ? `Dr. ${firstName}` : firstName;

    const standardHeader = `
        <header class="flex items-center ${showGreeting ? 'justify-between' : 'justify-end'} mb-6 animate-fade-in">
            ${showGreeting ? `
            <div>
                <p class="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">${greetingLabel}</p>
                <h2 class="text-3xl font-display font-bold text-slate-800">Hello, <span class="text-primary">${greetingName}</span></h2>
            </div>
            ` : ''}
            <div class="flex items-center gap-4">
                <button id="theme-toggle" class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm border border-slate-100 dark:border-slate-700">
                    <i data-lucide="moon" class="w-5 h-5 block dark:hidden"></i>
                    <i data-lucide="sun" class="w-5 h-5 hidden dark:block text-amber-500"></i>
                </button>
                <a href="/profile.html" class="flex items-center gap-4 hover:opacity-80 transition-opacity">
                    <div class="text-right hidden sm:block">
                        <p class="text-sm font-bold text-slate-800 dark:text-white">${user.name}</p>
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
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    });

    // Theme Toggle Handler
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    });
};

// Auto-render if not on index or register
if (!window.location.pathname.includes('index') && !window.location.pathname.includes('register') && window.location.pathname !== '/' && window.location.pathname.endsWith('.html')) {
    document.addEventListener('DOMContentLoaded', renderSidebar);
}
