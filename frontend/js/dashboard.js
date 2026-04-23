const user = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', () => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    initDashboard();
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
});

async function initDashboard() {
    const container = document.getElementById('dashboard-app');

    if (user.role === 'doctor') {
        await renderDoctorView(container);
    } else if (user.role === 'caregiver') {
        await renderCaregiverView(container);
    } else {
        await renderPatientContainer(container);
        await renderPatientView();
    }
    lucide.createIcons();
}

async function renderPatientContainer(container) {
    container.innerHTML = `
        <div class="mb-10">
            <p class="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Personal Health Dashboard</p>
            <h2 class="text-4xl font-display font-bold text-slate-800">Hello, <span id="user-name">...</span></h2>
        </div>

        <!-- Task 8: Next Dose Section -->
        <div id="next-dose-hero" class="mb-10"></div>

        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12 lg:col-span-8 space-y-8">
                <section>
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-2xl font-display font-bold text-slate-800">Today's Schedule</h3>
                        <div id="schedule-meta" class="text-xs font-bold text-slate-400 uppercase tracking-widest"></div>
                    </div>
                    <!-- Task 4 & 10: Schedule List with Status -->
                    <div id="med-schedule" class="space-y-4"></div>
                </section>

            </div>

            <!-- Task 9: Weekly Progress Section -->
            <div class="col-span-12 lg:col-span-4 space-y-8">
                <div class="card-white">
                    <h4 class="text-lg font-display font-bold text-slate-800 mb-8">Weekly Progress</h4>
                    <div class="h-64">
                        <canvas id="weekly-progress-chart"></canvas>
                    </div>
                    <div class="mt-6 pt-6 border-t border-slate-50">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Goal</span>
                            <span id="daily-progress-pct" class="text-xs font-bold text-primary">0%</span>
                        </div>
                        <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div id="daily-progress-bar" class="bg-primary h-full transition-all duration-1000" style="width: 0%"></div>
                        </div>
                    </div>
                </div>

                <div class="card-white">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <i data-lucide="sparkles" class="w-6 h-6"></i>
                        </div>
                        <h4 class="text-lg font-display font-bold text-slate-800">Insights</h4>
                    </div>
                    <div id="patient-insights" class="space-y-4">
                        <p class="text-xs text-slate-400 italic">Analyzing your adherence patterns...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function renderPatientView() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const dateEl = document.getElementById('current-date');
    if (dateEl) dateEl.textContent = dateStr;

    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = user.name.split(' ')[0];

    try {
        const [meds, logs, stats] = await Promise.all([
            apiFetch('/medicines'),
            apiFetch('/logs'),
            apiFetch(`/logs/stats/${user.id || user._id}`)
        ]);

        const todayLogs = logs.filter(log => new Date(log.date).toDateString() === now.toDateString());

        // Task 7: Sort by proximity to current time
        const timeToMinutes = (t) => {
            const [time, modifier] = t.split(' ');
            let [hrs, mins] = time.split(':');
            if (hrs === '12') hrs = '00';
            if (modifier === 'PM') hrs = parseInt(hrs, 10) + 12;
            return parseInt(hrs, 10) * 60 + parseInt(mins, 10);
        };
        const currentMins = now.getHours() * 60 + now.getMinutes();

        const medsWithStatus = meds.map(med => {
            const log = todayLogs.find(l => l.medicine?._id === med._id || l.medicine === med._id);
            return { ...med, status: log ? log.status : 'pending', timeMins: timeToMinutes(med.time) };
        }).sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return a.timeMins - b.timeMins;
        });

        // Task 8: Render Hero Section
        const nextMed = medsWithStatus.find(m => m.status === 'pending');
        const heroEl = document.getElementById('next-dose-hero');
        if (heroEl && nextMed) {
            heroEl.innerHTML = `
                <div class="bg-primary rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-sky-200 group">
                    <div class="relative z-10 flex items-center justify-between">
                        <div class="flex items-center gap-8">
                            <div class="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center">
                                <i data-lucide="pill" class="w-10 h-10"></i>
                            </div>
                            <div>
                                <p class="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">Upcoming Dose</p>
                                <h3 class="text-4xl font-display font-bold">${nextMed.name}</h3>
                                <p class="text-lg mt-1 opacity-90">${nextMed.time} • ${nextMed.dosage || '1 Tablet'}</p>
                            </div>
                        </div>
                        <button onclick="logMed('${nextMed._id}', 'taken')" class="px-10 py-5 bg-white text-primary font-bold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">Take Now</button>
                    </div>
                    <div class="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                </div>
            `;
        } else if (heroEl) {
            heroEl.innerHTML = `
                <div class="bg-emerald-500 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-100 text-center">
                    <h3 class="text-3xl font-display font-bold">All caught up for now!</h3>
                    <p class="mt-2 opacity-90">You've taken all your scheduled medications so far today.</p>
                </div>
            `;
        }

        // Task 4 & 10: Render Schedule
        const scheduleEl = document.getElementById('med-schedule');
        if (scheduleEl) {
            if (medsWithStatus.length === 0) {
                scheduleEl.innerHTML = `
                    <div class="card-white flex flex-col items-center justify-center py-20 text-slate-400">
                        <i data-lucide="calendar-x-2" class="w-16 h-16 mb-4 opacity-10"></i>
                        <p class="font-display font-bold text-lg">No medications scheduled today</p>
                    </div>
                `;
            } else {
                scheduleEl.innerHTML = medsWithStatus.map(m => {
                    let statusColor = 'bg-amber-100 text-amber-600';
                    let statusLabel = 'Pending';
                    if (m.status === 'taken') { statusColor = 'bg-emerald-100 text-emerald-600'; statusLabel = 'Taken'; }
                    else if (m.status === 'skipped') { statusColor = 'bg-rose-100 text-rose-600'; statusLabel = 'Missed'; }

                    return `
                        <div class="card-white group hover:border-primary/30 transition-all">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-6">
                                    <div class="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                        <i data-lucide="clock" class="w-6 h-6"></i>
                                    </div>
                                    <div>
                                        <div class="flex items-center gap-3">
                                            <h4 class="text-lg font-display font-bold text-slate-800">${m.name}</h4>
                                            <span class="px-2 py-0.5 ${statusColor} text-[10px] font-bold uppercase rounded-md">${statusLabel}</span>
                                        </div>
                                        <p class="text-sm text-slate-400 font-medium">${m.time} • ${m.dosage || '1 Tablet'}</p>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    ${m.status === 'pending' ? `
                                        <button onclick="logMed('${m._id}', 'taken')" class="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"><i data-lucide="check"></i></button>
                                        <button onclick="logMed('${m._id}', 'skipped')" class="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><i data-lucide="x"></i></button>
                                        <button onclick="alert('Reminder set for 15 mins')" class="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"><i data-lucide="bell-ring"></i></button>
                                    ` : `
                                        <div class="w-10 h-10 flex items-center justify-center rounded-full ${m.status === 'taken' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}">
                                            <i data-lucide="${m.status === 'taken' ? 'check' : 'alert-circle'}" class="w-5 h-5"></i>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Task 9: Weekly Chart
        renderWeeklyProgress(stats);

        // Daily Progress Bar
        const takenCount = todayLogs.filter(l => l.status === 'taken').length;
        const totalCount = meds.length || 1;
        const pct = Math.round((takenCount / totalCount) * 100);
        const pctEl = document.getElementById('daily-progress-pct');
        const barEl = document.getElementById('daily-progress-bar');
        if (pctEl) pctEl.textContent = `${pct}%`;
        if (barEl) barEl.style.width = `${pct}%`;

        // Insights
        const insightsEl = document.getElementById('patient-insights');
        if (insightsEl) {
            if (pct === 100) {
                insightsEl.innerHTML = `
                    <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4 animate-fade-in">
                        <i data-lucide="award" class="text-emerald-500 w-5 h-5 shrink-0"></i>
                        <p class="text-xs text-emerald-700 font-medium">Perfect adherence today! Keep up the great work.</p>
                    </div>
                `;
            } else if (todayLogs.find(l => l.status === 'skipped')) {
                insightsEl.innerHTML = `
                    <div class="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex gap-4 animate-fade-in">
                        <i data-lucide="alert-triangle" class="text-rose-500 w-5 h-5 shrink-0"></i>
                        <p class="text-xs text-rose-700 font-medium">You missed a dose today. Consistency is key for your health.</p>
                    </div>
                `;
            } else {
                insightsEl.innerHTML = `
                    <div class="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4 animate-fade-in">
                        <i data-lucide="info" class="text-primary w-5 h-5 shrink-0"></i>
                        <p class="text-xs text-slate-600 font-medium">Remember to take your medications on time to maintain steady levels.</p>
                    </div>
                `;
            }
        }

        lucide.createIcons();
    } catch (err) { console.error('Patient view error:', err); }
}

function renderWeeklyProgress(stats) {
    const ctx = document.getElementById('weekly-progress-chart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.map(s => s.day),
            datasets: [{
                label: 'Adherence %',
                data: stats.map(s => s.percentage),
                backgroundColor: '#0ea5e9',
                borderRadius: 12,
                barThickness: 16
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 100, grid: { display: false }, ticks: { font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });
}

async function logVitals() {
    // Replace prompts with a proper modal later, but for Task 5 Phase 2 we keep it simple for now
    const hr = prompt('Heart Rate (BPM):');
    const systolic = prompt('Systolic BP (e.g. 120):');
    const diastolic = prompt('Diastolic BP (e.g. 80):');

    if (hr || (systolic && diastolic)) {
        try {
            await apiFetch('/vitals', {
                method: 'POST',
                body: JSON.stringify({
                    heartRate: parseInt(hr),
                    bloodPressure: { systolic: parseInt(systolic), diastolic: parseInt(diastolic) }
                })
            });
            initDashboard();
        } catch (err) { alert('Failed to log vitals'); }
    }
}

async function renderCaregiverView(container) {
    container.innerHTML = `
        <header class="flex items-center justify-between mb-10">
            <div>
                <h2 class="text-3xl font-display font-bold text-slate-800">Caregiver Hub</h2>
                <p class="text-slate-400 font-medium mt-1">Monitoring health for your linked family</p>
            </div>
            <div class="flex items-center gap-4">
                <button onclick="linkPatient()" class="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-sky-100 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                    <i data-lucide="plus"></i> Link Patient
                </button>
            </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <!-- Task 33: Caregiver Alert Section -->
            <div class="md:col-span-2 card-white p-8">
                <h4 class="text-lg font-display font-bold text-slate-800 flex items-center gap-2 mb-6">
                    <i data-lucide="bell" class="text-amber-500 w-5 h-5"></i> Family Health Alerts
                </h4>
                <div id="caregiver-alerts" class="space-y-4">
                    <p class="text-slate-400 italic text-sm">No new alerts.</p>
                </div>
            </div>
            
            <div class="card-white p-8 bg-slate-900 text-white flex flex-col justify-center">
                <p class="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Total Patients</p>
                <h3 class="text-5xl font-display font-bold" id="caretaker-patient-count">0</h3>
            </div>
        </div>

        <h3 class="text-xl font-display font-bold text-slate-800 mb-6">Linked Patients</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8" id="patient-grid">
            <div class="col-span-2 py-20 flex justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        </div>
    `;

    try {
        const patients = await apiFetch('/users/my-patients');
        document.getElementById('caretaker-patient-count').textContent = patients.length;

        const patientData = await Promise.all(patients.map(async p => {
            const [stats, logs] = await Promise.all([
                apiFetch(`/logs/stats/${p._id}`),
                apiFetch(`/logs/patient/${p._id}`)
            ]);
            const avg = stats.length > 0 ? Math.round(stats.reduce((acc, s) => acc + s.percentage, 0) / stats.length) : 0;
            const lastLog = logs[0];
            const missedToday = logs.some(l => l.status === 'skipped' && new Date(l.date).toDateString() === new Date().toDateString());

            return { ...p, adherence: avg, lastLog, missedToday };
        }));

        const grid = document.getElementById('patient-grid');
        if (patientData.length === 0) {
            grid.innerHTML = `<div class="col-span-2 card-white py-20 text-center text-slate-400 font-medium">No patients linked. Click "+ Link Patient" to start.</div>`;
        } else {
            grid.innerHTML = patientData.map(p => `
                <div class="card-white group hover:border-primary/30 transition-all">
                    <div class="flex items-center gap-6 mb-8">
                        <div class="relative">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}" class="w-16 h-16 rounded-2xl bg-slate-50">
                            ${p.missedToday ? `<div class="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full border-4 border-white animate-pulse"></div>` : ''}
                        </div>
                        <div>
                            <h4 class="text-xl font-display font-bold text-slate-800">${p.name}</h4>
                            <p class="text-slate-400 font-bold text-[10px] uppercase tracking-widest">General Wellness</p>
                        </div>
                    </div>
                    
                    <div class="space-y-6 mb-8">
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Adherence Rate</span>
                                <span class="text-sm font-bold ${p.adherence > 80 ? 'text-emerald-500' : 'text-amber-500'}">${p.adherence}%</span>
                            </div>
                            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div class="h-full ${p.adherence > 80 ? 'bg-emerald-500' : 'bg-amber-500'}" style="width: ${p.adherence}%"></div>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-3 text-xs">
                            <i data-lucide="clock" class="w-4 h-4 text-slate-300"></i>
                            <span class="text-slate-500">Last activity: <span class="text-slate-800 font-bold">${p.lastLog ? new Date(p.lastLog.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'None'}</span></span>
                        </div>
                    </div>

                    <!-- Task 30 & 31: Missed Dose Warning & Buttons -->
                    ${p.missedToday ? `
                        <div class="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-600 text-[10px] font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                            <i data-lucide="alert-triangle" class="w-4 h-4"></i> Missed today's medicine
                        </div>
                    ` : ''}

                    <div class="flex gap-2">
                        <button onclick="viewPatientFile('${p._id}', '${p.name}')" class="flex-1 py-3 bg-primary/5 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all">Details</button>
                        <a href="tel:1234567890" class="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-50 hover:text-emerald-500 transition-all"><i data-lucide="phone"></i></a>
                        <a href="mailto:${p.email}" class="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-sky-50 hover:text-sky-500 transition-all"><i data-lucide="message-square"></i></a>
                    </div>
                </div>
            `).join('');
        }

        // Task 33: Caregiver Alerts
        const alertsEl = document.getElementById('caregiver-alerts');
        const caregiverAlerts = [];
        patientData.forEach(p => {
            if (p.missedToday) caregiverAlerts.push({ p, msg: `${p.name} missed their dose today.` });
            if (p.adherence < 70) caregiverAlerts.push({ p, msg: `${p.name}'s weekly adherence is low (${p.adherence}%).` });
        });

        if (caregiverAlerts.length > 0) {
            alertsEl.innerHTML = caregiverAlerts.map(a => `
                <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-2 h-2 bg-rose-500 rounded-full"></div>
                        <p class="text-sm font-bold text-slate-800">${a.msg}</p>
                    </div>
                    <button onclick="viewPatientFile('${a.p._id}', '${a.p.name}')" class="text-xs font-bold text-primary">Check</button>
                </div>
            `).join('');
        }
        lucide.createIcons();
    } catch (err) { console.error('Caregiver view error:', err); }
}

async function linkPatient() {
    const email = prompt('Enter the patient email address:');
    if (!email) return;

    try {
        const res = await apiFetch('/users/link-patient', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        if (res.msg) {
            alert(res.msg);
            initDashboard();
        }
    } catch (err) {
        alert('Failed to link patient. Please ensure the email is correct.');
    }
}

async function renderDoctorView(container) {
    container.innerHTML = `
        <header class="flex items-center justify-between mb-12">
            <div>
                <h2 class="text-3xl font-display font-bold text-slate-800">Clinical Control Center</h2>
                <p class="text-slate-400 font-medium mt-1" id="doc-subtitle">Medical Director: ${user.name}</p>
            </div>
            <div class="flex items-center gap-4">
                <button onclick="addNewPrescription()" class="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-sky-100 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                    <i data-lucide="plus"></i> New Prescription
                </button>
            </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <!-- Task 20: Intelligent Alerts -->
            <div class="md:col-span-2 card-white p-8">
                <div class="flex items-center justify-between mb-8">
                    <h4 class="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
                        <i data-lucide="bell-ring" class="text-rose-500 w-5 h-5"></i> Critical Care Alerts
                    </h4>
                </div>
                <div id="doctor-alerts" class="space-y-4">
                    <div class="animate-pulse flex space-x-4">
                        <div class="rounded-full bg-slate-100 h-10 w-10"></div>
                        <div class="flex-1 space-y-2 py-1">
                            <div class="h-2 bg-slate-100 rounded"></div>
                            <div class="h-2 bg-slate-100 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card-white p-8 bg-primary text-white">
                <h4 class="text-lg font-display font-bold mb-6">Directory Overview</h4>
                <div class="space-y-6">
                    <div>
                        <p class="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Active Patients</p>
                        <h5 class="text-4xl font-display font-bold" id="doc-patient-count">--</h5>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Overall Adherence</p>
                        <h5 class="text-4xl font-display font-bold" id="doc-avg-adherence">--%</h5>
                    </div>
                </div>
            </div>
        </div>

        <div class="card-white overflow-hidden p-0">
            <div class="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <h3 class="text-xl font-display font-bold text-slate-800">Patient Directory</h3>
                <div class="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>Low Risk</span>
                    <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span>Med Risk</span>
                    <div class="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span>High Risk</span>
                    <div class="w-3 h-3 rounded-full bg-rose-500"></div>
                </div>
            </div>
            
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-slate-50/20">
                        <th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                        <th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Adherence</th>
                        <th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Missed</th>
                        <th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Level</th>
                        <th class="px-8 py-4 text-right"></th>
                    </tr>
                </thead>
                <tbody id="doctor-patient-list" class="divide-y divide-slate-50"></tbody>
            </table>
        </div>
    `;

    try {
        const patients = await apiFetch('/users/patients');
        document.getElementById('doc-patient-count').textContent = patients.length;

        const patientData = await Promise.all(patients.map(async p => {
            const [stats, logs] = await Promise.all([
                apiFetch(`/logs/stats/${p._id}`),
                apiFetch(`/logs/patient/${p._id}`)
            ]);
            const avg = stats.length > 0 ? Math.round(stats.reduce((acc, s) => acc + s.percentage, 0) / stats.length) : 0;
            const lastMissed = logs.find(l => l.status === 'skipped');

            // Task 18: Risk Level Logic
            let risk = 'Low';
            let riskColor = 'text-emerald-500 bg-emerald-50';
            if (avg < 50) { risk = 'High'; riskColor = 'text-rose-500 bg-rose-50'; }
            else if (avg < 80) { risk = 'Medium'; riskColor = 'text-amber-500 bg-amber-50'; }

            return { ...p, adherence: avg, lastMissed, risk, riskColor, logs };
        }));

        const overallAvg = Math.round(patientData.reduce((acc, p) => acc + p.adherence, 0) / (patientData.length || 1));
        document.getElementById('doc-avg-adherence').textContent = overallAvg;

        const list = document.getElementById('doctor-patient-list');
        list.innerHTML = patientData.map(p => `
            <tr onclick="viewPatientFile('${p._id}', '${p.name}')" class="hover:bg-slate-50/50 transition-all group border-b border-slate-50/50 cursor-pointer">
                <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shadow-sm">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}" class="w-full h-full object-cover">
                        </div>
                        <div>
                            <p class="font-bold text-slate-800 text-lg">${p.name}</p>
                            <p class="text-xs text-slate-400 font-medium">${p.email}</p>
                        </div>
                    </div>
                </td>
                <td class="px-8 py-6">
                    <div class="flex flex-col items-center gap-2">
                        <span class="text-sm font-bold text-slate-700">${p.adherence}%</span>
                        <div class="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div class="bg-primary h-full transition-all duration-500" style="width: ${p.adherence}%"></div>
                        </div>
                    </div>
                </td>
                <td class="px-8 py-6">
                    <p class="text-sm font-bold text-slate-500">
                        ${p.lastMissed ? new Date(p.lastMissed.date).toLocaleDateString() : 'None Recorded'}
                    </p>
                </td>
                <td class="px-8 py-6">
                    <span class="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${p.riskColor} ring-1 ring-inset ${p.risk === 'High' ? 'ring-rose-200' : p.risk === 'Medium' ? 'ring-amber-200' : 'ring-emerald-200'}">${p.risk}</span>
                </td>
                <td class="px-8 py-6 text-right">
                    <button class="text-primary font-bold text-sm hover:text-primary-dark transition-colors">View Record</button>
                </td>
            </tr>
        `).join('');

        // Task 20 & 21: Render Intelligent Alerts
        const alertsEl = document.getElementById('doctor-alerts');
        const alerts = [];
        patientData.forEach(p => {
            if (p.adherence < 60) alerts.push({ patient: p, type: 'Adherence', msg: `${p.name} adherence dropped below 60% (${p.adherence}%)` });
            const missedCount = p.logs.filter(l => l.status === 'skipped' && (new Date() - new Date(l.date)) < 3 * 24 * 60 * 60 * 1000).length;
            if (missedCount >= 3) alerts.push({ patient: p, type: 'Missed Doses', msg: `${p.name} missed ${missedCount} doses in the last 3 days` });

            // Task 20: Inactive for 2 days
            const lastLog = p.logs[0];
            if (lastLog && (new Date() - new Date(lastLog.date)) > 2 * 24 * 60 * 60 * 1000) {
                alerts.push({ patient: p, type: 'Inactive', msg: `${p.name} has been inactive for 2+ days` });
            }
        });

        if (alerts.length === 0) {
            alertsEl.innerHTML = '<p class="text-slate-400 italic text-center py-4">No critical alerts detected today.</p>';
        } else {
            alertsEl.innerHTML = alerts.map(a => `
                <div onclick="viewPatientFile('${a.patient._id}', '${a.patient.name}')" class="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between cursor-pointer hover:border-rose-200 transition-all group">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                            <i data-lucide="alert-circle"></i>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-slate-800">${a.msg}</p>
                            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">${a.type}</p>
                        </div>
                    </div>
                    <i data-lucide="chevron-right" class="text-slate-300 group-hover:text-primary transition-all"></i>
                </div>
            `).join('');
        }
        lucide.createIcons();
    } catch (err) { console.error('Doctor view error:', err); }
}

// Explicitly expose to window to ensure HTML onclick can find it
window.viewPatientFile = async function (patientId, patientName) {
    console.log('Viewing patient file:', patientId, patientName);

    // Show loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in';
    overlay.id = 'patient-file-modal';
    overlay.innerHTML = '<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>';
    document.body.appendChild(overlay);

    try {
        const [meds, logs, stats, vitals] = await Promise.all([
            apiFetch(`/medicines/patient/${patientId}`).catch(() => []),
            apiFetch(`/logs/patient/${patientId}`).catch(() => []),
            apiFetch(`/logs/stats/${patientId}`).catch(() => []),
            apiFetch(`/vitals/stats/${patientId}`).catch(() => [])
        ]);

        console.log('Data fetched:', { meds, logs, stats, vitals });

        const avgAdherence = (stats && stats.length > 0) ? Math.round(stats.reduce((acc, s) => acc + s.percentage, 0) / stats.length) : 0;
        const latestVitals = (vitals && vitals.length > 0) ? vitals[0] : { heartRate: '--', bloodPressure: { systolic: '--', diastolic: '--' } };

        overlay.innerHTML = `
            <div class="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-slide-up border border-slate-100">
                <!-- Modal Header -->
                <div class="p-10 border-b border-slate-50 flex items-center justify-between">
                    <div class="flex items-center gap-6">
                        <div class="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shadow-sm">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${patientName}" class="w-full h-full rounded-xl object-cover">
                        </div>
                        <div>
                            <h3 class="text-4xl font-display font-bold text-[#1e293b]">${patientName}</h3>
                            <p class="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Patient Clinical Record</p>
                        </div>
                    </div>
                    <button onclick="document.getElementById('patient-file-modal').remove()" class="w-12 h-12 hover:bg-slate-50 rounded-2xl text-slate-400 flex items-center justify-center transition-all">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>

                <!-- Modal Content -->
                <div class="flex-1 overflow-y-auto p-10 pt-4 space-y-12">
                    <!-- Quick Stats Row -->
                    <div class="grid grid-cols-3 gap-8">
                        <div class="bg-[#ecfdf5] p-8 rounded-[2rem] border border-[#d1fae5] shadow-sm">
                            <p class="text-[11px] font-bold text-[#059669] uppercase tracking-wider mb-2">Avg Adherence</p>
                            <h4 class="text-5xl font-display font-bold text-[#059669]">${avgAdherence}%</h4>
                        </div>
                        <div class="bg-[#fff1f2] p-8 rounded-[2rem] border border-[#ffe4e6] shadow-sm">
                            <p class="text-[11px] font-bold text-[#e11d48] uppercase tracking-wider mb-2">Heart Rate</p>
                            <h4 class="text-5xl font-display font-bold text-[#e11d48]">${latestVitals.heartRate || '--'} <span class="text-sm font-bold opacity-60">BPM</span></h4>
                        </div>
                        <div class="bg-[#f0f9ff] p-8 rounded-[2rem] border border-[#e0f2fe] shadow-sm">
                            <p class="text-[11px] font-bold text-[#0284c7] uppercase tracking-wider mb-2">Blood Pressure</p>
                            <h4 class="text-5xl font-display font-bold text-[#0284c7]">${latestVitals.bloodPressure?.systolic || '--'}/${latestVitals.bloodPressure?.diastolic || '--'} <span class="text-sm font-bold opacity-60">mmHg</span></h4>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-16">
                        <!-- Active Medications -->
                        <div>
                            <h4 class="text-xl font-display font-bold text-[#1e293b] mb-8 flex items-center gap-3">
                                <i data-lucide="pill" class="text-primary w-6 h-6"></i> Current Prescriptions
                            </h4>
                            <div class="space-y-4">
                                ${meds && meds.length > 0 ? meds.map(m => `
                                    <div class="p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                                        <div>
                                            <p class="text-lg font-bold text-[#334155] mb-1">${m.name}</p>
                                            <p class="text-xs text-slate-400 font-bold uppercase tracking-wider">${m.time} • ${m.dosage || 'N/A'}</p>
                                        </div>
                                        <span class="text-[9px] font-bold uppercase px-3 py-1.5 bg-[#ecfdf5] text-[#059669] rounded-full border border-[#d1fae5]">Active</span>
                                    </div>
                                `).join('') : '<p class="text-slate-400 text-sm italic">No active prescriptions.</p>'}
                            </div>
                        </div>

                        <!-- Recent Activity -->
                        <div>
                            <h4 class="text-xl font-display font-bold text-[#1e293b] mb-8 flex items-center gap-3">
                                <i data-lucide="activity" class="text-primary w-6 h-6"></i> Recent Logs
                            </h4>
                            <div class="space-y-6">
                                ${logs && logs.length > 0 ? logs.slice(0, 5).map(l => `
                                    <div class="flex items-center gap-4 group">
                                        <div class="w-2.5 h-2.5 rounded-full ${l.status === 'taken' ? 'bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.3)]'}"></div>
                                        <div class="flex-1">
                                            <p class="text-sm font-bold text-[#334155]">${l.medicine?.name || 'Unknown'}</p>
                                            <p class="text-[10px] text-slate-400 font-medium uppercase mt-1">${new Date(l.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                                        </div>
                                        <span class="text-[10px] font-black tracking-widest ${l.status === 'taken' ? 'text-[#059669]' : 'text-[#b91c1c]'} uppercase">${l.status}</span>
                                    </div>
                                `).join('') : '<p class="text-slate-400 text-sm italic">No recent activity.</p>'}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="p-10 border-t border-slate-50 bg-slate-50/20 flex justify-end gap-6">
                    <button onclick="document.getElementById('patient-file-modal').remove()" class="px-10 py-5 bg-white border border-slate-200 text-[#475569] rounded-[1.25rem] font-bold hover:bg-slate-50 transition-all text-sm">Close Record</button>
                    <button onclick="document.getElementById('patient-file-modal').remove(); addNewPrescription()" class="px-10 py-5 bg-primary text-white rounded-[1.25rem] font-bold shadow-lg shadow-sky-100 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm">Adjust Prescription</button>
                </div>
            </div>
        `;
        lucide.createIcons();
    } catch (err) {
        console.error('Error in viewPatientFile:', err);
        overlay.innerHTML = `
            <div class="bg-white p-12 rounded-[2rem] shadow-xl text-center max-w-sm">
                <div class="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i data-lucide="alert-circle" class="w-8 h-8"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-800 mb-2">Load Failed</h3>
                <p class="text-slate-500 text-sm mb-6">Could not retrieve clinical records for this patient.</p>
                <button onclick="document.getElementById('patient-file-modal').remove()" class="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Dismiss</button>
            </div>
        `;
        lucide.createIcons();
    }
}

window.linkPatient = async function () {
    const email = prompt('Enter patient email:');
    if (email) {
        try {
            await apiFetch('/users/link-patient', { method: 'POST', body: JSON.stringify({ email }) });
            initDashboard();
        } catch (err) { alert('Patient not found'); }
    }
}

window.addNewPrescription = async function () {
    // Create Modal Overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in';
    modal.id = 'prescription-modal';

    const patients = await apiFetch('/users/patients');

    modal.innerHTML = `
        <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
            <div class="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                    <h3 class="text-2xl font-display font-bold text-slate-800">New Prescription</h3>
                    <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Clinical Authorization</p>
                </div>
                <button onclick="document.getElementById('prescription-modal').remove()" class="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><i data-lucide="x"></i></button>
            </div>
            
            <form id="modal-prescription-form" class="p-8 space-y-6">
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Select Patient</label>
                    <select id="modal-patient" class="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" required>
                        <option value="">Choose a patient...</option>
                        ${patients.map(p => `<option value="${p._id}">${p.name} (${p.email})</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Medication Name</label>
                    <input type="text" id="modal-med-name" placeholder="e.g. Metformin" class="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" required>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Time</label>
                        <input type="text" id="modal-med-time" placeholder="08:00 AM" class="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" required>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Dosage</label>
                        <input type="text" id="modal-med-dosage" placeholder="500mg" class="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                    </div>
                </div>
                <button type="submit" class="w-full py-5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-sky-100 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Authorize Prescription
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();

    const form = document.getElementById('modal-prescription-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        const data = {
            user: document.getElementById('modal-patient').value,
            name: document.getElementById('modal-med-name').value,
            time: document.getElementById('modal-med-time').value,
            dosage: document.getElementById('modal-med-dosage').value,
            frequency: 'Daily'
        };

        try {
            await apiFetch('/medicines', { method: 'POST', body: JSON.stringify(data) });
            alert('Prescription authorized successfully!');
            modal.remove();
            initDashboard();
        } catch (err) {
            alert('Clinical authorization failed.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Authorize Prescription';
        }
    });
}

window.logMed = async function (id, status) {
    try {
        await apiFetch('/logs', { method: 'POST', body: JSON.stringify({ medicineId: id, status }) });
        initDashboard();
    } catch (err) { console.error(err); }
}
