document.addEventListener('DOMContentLoaded', loadHistory);

async function loadHistory() {
    const user = JSON.parse(localStorage.getItem('user'));
    const historyList = document.getElementById('history-list');

    // Task 14: Loading State
    historyList.innerHTML = `
        <tr>
            <td colspan="4" class="px-8 py-20 text-center text-slate-400">
                <div class="flex flex-col items-center gap-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p class="font-medium">Syncing history logs...</p>
                </div>
            </td>
        </tr>
    `;

    try {
        let logs = [];
        if (user.role === 'caregiver') {
            const patients = await apiFetch('/users/my-patients');
            const logPromises = patients.map(p => apiFetch(`/logs/patient/${p._id}`));
            const allPatientLogs = await Promise.all(logPromises);
            logs = allPatientLogs.flat();
        } else {
            logs = await apiFetch('/logs');
        }

        // Apply Filters (Task 13)
        const nameFilter = document.getElementById('filter-name')?.value.toLowerCase();
        const statusFilter = document.getElementById('filter-status')?.value;
        const dateFilter = document.getElementById('filter-date')?.value;

        let filtered = logs;

        if (nameFilter) {
            filtered = filtered.filter(l => l.medicine?.name.toLowerCase().includes(nameFilter));
        }

        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(l => l.status === statusFilter);
        }

        if (dateFilter && dateFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(l => {
                const logDate = new Date(l.date);
                if (dateFilter === 'today') return logDate.toDateString() === now.toDateString();
                if (dateFilter === 'week') {
                    const weekAgo = new Date();
                    weekAgo.setDate(now.getDate() - 7);
                    return logDate >= weekAgo;
                }
                if (dateFilter === 'month') {
                    const monthAgo = new Date();
                    monthAgo.setMonth(now.getMonth() - 1);
                    return logDate >= monthAgo;
                }
                return true;
            });
        }

        historyList.innerHTML = '';

        // Task 15: Empty State
        if (filtered.length === 0) {
            historyList.innerHTML = `
                <tr>
                    <td colspan="4" class="px-8 py-20 text-center text-slate-400">
                        <div class="flex flex-col items-center gap-4">
                            <i data-lucide="database-zap" class="w-12 h-12 opacity-10"></i>
                            <p class="font-medium italic">No history available for the selected filters</p>
                        </div>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }

        const isClinical = user.role === 'doctor' || user.role === 'caregiver';

        filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(log => {
            const dateObj = new Date(log.date);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const isTaken = log.status === 'taken';
            const row = document.createElement('tr');
            row.className = 'hover:bg-slate-50/50 transition-all group';

            row.innerHTML = `
                <td class="px-8 py-6">
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-slate-800">${dateStr}</span>
                        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">${timeStr}</span>
                    </div>
                </td>
                <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl ${isTaken ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'} flex items-center justify-center shrink-0">
                            <i data-lucide="${isTaken ? 'check' : 'alert-circle'}" class="w-5 h-5"></i>
                        </div>
                        <span class="font-bold text-slate-700">${log.medicine ? log.medicine.name : 'System Log'}</span>
                    </div>
                </td>
                <td class="px-8 py-6">
                    <span class="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${isTaken ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}">
                        ${log.status === 'taken' ? 'Taken' : 'Missed'}
                    </span>
                </td>
                <td class="px-8 py-6 text-right">
                    ${isClinical ? `
                        <div class="flex items-center justify-end gap-2">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user?.name || 'User'}" class="w-6 h-6 rounded-full bg-slate-100">
                            <span class="text-xs font-bold text-slate-600">${log.user?.name || 'Unknown'}</span>
                        </div>
                    ` : `
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Self Action</span>
                    `}
                </td>
            `;
            historyList.appendChild(row);
        });
        lucide.createIcons();
    } catch (err) {
        // Task 11: Fix error message
        historyList.innerHTML = `
            <tr>
                <td colspan="4" class="px-8 py-20 text-center text-rose-500 font-bold">
                    Unable to load logs at this time. Please check your connection.
                </td>
            </tr>
        `;
    }
}

// Task 16: Export Functionality
async function exportHistory() {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
        const logs = await apiFetch('/logs');
        if (logs.length === 0) {
            alert('No data to export.');
            return;
        }

        const csvContent = "data:text/csv;charset=utf-8,"
            + "Date,Time,Medicine,Status,Method\n"
            + logs.map(l => {
                const d = new Date(l.date);
                return `${d.toLocaleDateString()},${d.toLocaleTimeString()},${l.medicine?.name || 'System'},${l.status},${user.role}`;
            }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `MedRemind_History_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        alert('Failed to export data.');
    }
}
