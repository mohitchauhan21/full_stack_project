const medicineList = document.getElementById('medicine-list');
const addMedForm = document.getElementById('add-med-form');
let currentFilter = 'active';

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user.role === 'doctor') {
        initDoctorMode();
    }
    loadMedicines();
    renderAdherenceGauge();
    initDaySelectors();
    initFilters();
    syncProfileAvatar();
});

async function initDoctorMode() {
    const container = document.getElementById('patient-select-container');
    const select = document.getElementById('assign-patient');
    if (container && select) {
        container.classList.remove('hidden');
        try {
            const patients = await apiFetch('/users/patients');
            patients.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p._id;
                opt.textContent = `${p.name} (${p.email})`;
                select.appendChild(opt);
            });
        } catch (err) { console.error('Failed to load patients', err); }
    }
}

function syncProfileAvatar() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.querySelectorAll('img[alt="Profile"]').forEach(img => {
            img.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;
        });
    }
}

function initDaySelectors() {
    const dayBtns = document.querySelectorAll('#add-med-form button[type="button"].flex-1');
    dayBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('bg-primary');
            btn.classList.toggle('text-white');
            btn.classList.toggle('bg-slate-50');
            btn.classList.toggle('text-slate-400');
            btn.classList.toggle('border-primary');
        });
    });
}

function initFilters() {
    const filterBtns = document.querySelectorAll('.flex.bg-white.p-1.rounded-xl button');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('bg-primary', 'text-white');
                b.classList.add('text-slate-400');
            });
            btn.classList.add('bg-primary', 'text-white');
            btn.classList.remove('text-slate-400');
            currentFilter = btn.textContent.trim().toLowerCase();
            loadMedicines();
        });
    });
}

async function loadMedicines() {
    medicineList.innerHTML = `
        <div class="flex items-center justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
    `;

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const medicines = await apiFetch('/medicines');

        // If doctor, show all medicines or maybe we should filter by selected patient
        // For now, doctors see all prescriptions they've created
        const filtered = medicines.filter(med => (med.status || 'active') === currentFilter);

        medicineList.innerHTML = '';

        if (filtered.length === 0) {
            medicineList.innerHTML = `
                <div class="card-white flex flex-col items-center justify-center py-20 text-slate-400">
                    <i data-lucide="package-open" class="w-16 h-16 mb-4 opacity-10"></i>
                    <p class="text-lg font-display font-bold">No ${currentFilter} medications</p>
                    <p class="text-sm">Prescriptions will appear here.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        filtered.forEach(med => {
            const card = document.createElement('div');
            card.className = 'card-white group hover:border-primary/30 transition-all duration-300';
            card.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-6">
                        <div class="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                            <i data-lucide="pill" class="w-8 h-8"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-3">
                                <h4 class="text-xl font-display font-bold text-slate-800">${med.name}</h4>
                                <span class="px-2 py-0.5 ${getStatusColor(med.status)} text-[10px] font-bold uppercase rounded-md">${med.status || 'Active'}</span>
                                ${user.role === 'doctor' && med.user ? `<span class="text-[10px] text-slate-400 font-bold uppercase">For: ${med.user.name || 'Patient'}</span>` : ''}
                            </div>
                            <div class="flex items-center gap-6 mt-2">
                                <p class="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                                    <span class="font-bold text-slate-800">${med.dosage || '500mg'}</span> • Oral Tablet
                                </p>
                                <p class="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                                    <i data-lucide="clock" class="w-4 h-4 text-slate-300"></i> ${med.time}
                                </p>
                                <p class="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                                    <i data-lucide="calendar" class="w-4 h-4 text-slate-300"></i> ${med.frequency}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-4">
                        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="deleteMedicine('${med._id}')" class="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                <i data-lucide="trash-2" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            medicineList.appendChild(card);
        });
        lucide.createIcons();
    } catch (err) {
        medicineList.innerHTML = '<div class="p-8 text-center text-rose-500 font-bold">Failed to load medicines. Please try again.</div>';
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'on hold': return 'bg-amber-100 text-amber-600';
        case 'completed': return 'bg-slate-100 text-slate-500';
        default: return 'bg-emerald-100 text-emerald-600';
    }
}

addMedForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));

    // Task 24 & 25: Mandatory Fields and Validation
    const name = document.getElementById('med-name').value;
    const time = document.getElementById('med-time').value;
    const dosage = document.getElementById('med-dosage').value;
    const patientId = document.getElementById('assign-patient')?.value;
    const frequency = document.getElementById('med-frequency')?.value || 'Daily';

    if (!name || !time || (user.role === 'doctor' && !patientId)) {
        alert('Please fill in all mandatory fields.');
        return;
    }

    // Simple time validation (HH:MM AM/PM)
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i;
    if (!timeRegex.test(time)) {
        alert('Please enter a valid time (e.g., 08:00 AM)');
        return;
    }

    const data = { name, time, dosage, frequency, status: 'active' };
    if (user.role === 'doctor') data.user = patientId;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="animate-spin inline-block w-4 h-4 mr-2" data-lucide="loader-2"></i> Scheduling...';
    lucide.createIcons();

    try {
        const res = await apiFetch('/medicines', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (res._id) {
            // Task 26: Success Message
            submitBtn.innerHTML = '<i data-lucide="check" class="inline-block w-4 h-4 mr-2"></i> Scheduled!';
            submitBtn.classList.remove('bg-primary');
            submitBtn.classList.add('bg-emerald-500');
            lucide.createIcons();

            setTimeout(() => {
                addMedForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                submitBtn.classList.remove('bg-emerald-500');
                submitBtn.classList.add('bg-primary');
                lucide.createIcons();
                loadMedicines();
            }, 1500);
        } else {
            alert(res.msg || 'Failed to add medicine');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    } catch (err) {
        alert('Error adding medicine');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

async function deleteMedicine(id) {
    if (!confirm('Are you sure you want to remove this medicine?')) return;
    try {
        await apiFetch(`/medicines/${id}`, { method: 'DELETE' });
        loadMedicines();
    } catch (err) {
        alert('Error deleting medicine');
    }
}

async function renderAdherenceGauge() {
    const ctx = document.getElementById('adherence-gauge');
    if (!ctx) return;
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user.role === 'doctor') {
            ctx.parentElement.parentElement.classList.add('hidden');
            return;
        }
        const stats = await apiFetch(`/logs/stats/${user.id || user._id}`);
        const avg = stats.length > 0 ? stats.reduce((acc, s) => acc + s.percentage, 0) / stats.length : 0;
        const score = Math.round(avg);
        new Chart(ctx, {
            type: 'doughnut',
            data: { datasets: [{ data: [score, 100 - score], backgroundColor: ['#10b981', '#f1f5f9'], borderWidth: 0 }] },
            options: { cutout: '80%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
        });
        const pctText = ctx.parentElement.querySelector('span');
        if (pctText) pctText.textContent = `${score}%`;
    } catch (err) { console.error('Gauge error:', err); }
}

// Handle header logout
document.getElementById('header-logout')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});
