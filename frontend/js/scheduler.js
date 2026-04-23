/**
 * MedRemind – Real-Time Medication Scheduler
 * Runs only on the patient dashboard.
 * Fires browser notifications + an on-screen alert when a medicine is due.
 * Also refreshes the view when the tab regains focus.
 */

(function initScheduler() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'patient') return; // Only run for patients

    // Track which medicines have already been notified this minute to avoid duplicates
    const notifiedThisMinute = new Set();
    let lastCheckedMinute = -1;

    /**
     * Convert "08:30 AM" / "02:30 PM" to { hours: number, minutes: number }
     */
    function parseTime12h(timeStr) {
        if (!timeStr) return null;
        const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!match) return null;
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const period = match[3].toUpperCase();
        if (period === 'AM' && h === 12) h = 0;
        if (period === 'PM' && h !== 12) h += 12;
        return { hours: h, minutes: m };
    }

    /**
     * Show an in-page "Due Now" banner
     */
    function showInPageBanner(med) {
        // Remove any existing banner
        document.getElementById('med-due-banner')?.remove();

        const banner = document.createElement('div');
        banner.id = 'med-due-banner';
        banner.className = 'fixed top-6 left-1/2 -translate-x-1/2 z-[999] bg-primary text-white px-8 py-5 rounded-3xl shadow-2xl shadow-sky-300/40 flex items-center gap-4 animate-bounce-in max-w-md w-full';
        banner.innerHTML = `
            <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
            </div>
            <div class="flex-1">
                <p class="font-bold text-sm uppercase tracking-widest opacity-80">Medicine Due Now</p>
                <p class="text-xl font-display font-bold">${med.name}</p>
                <p class="text-sm opacity-80">${med.time} · ${med.dosage || '1 Tablet'}</p>
            </div>
            <button onclick="document.getElementById('med-due-banner').remove()" class="p-2 hover:bg-white/20 rounded-xl transition-all">✕</button>
        `;
        document.body.appendChild(banner);

        // Auto-dismiss after 30 seconds
        setTimeout(() => banner.remove(), 30000);

        // Refresh the schedule list so Take/Skip buttons appear highlighted
        if (window.renderPatientView) window.renderPatientView();
    }

    /**
     * Request browser notification permission and send a notification
     */
    async function sendNotification(med) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
            const n = new Notification(`⏰ Time to take ${med.name}`, {
                body: `${med.time} · ${med.dosage || '1 Tablet'} · ${med.frequency || 'Daily'}`,
                icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name,
                badge: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name,
                tag: `med-${med._id}`,    // Prevents duplicate system notifications
                requireInteraction: true   // Stays until dismissed
            });

            n.onclick = () => {
                window.focus();
                n.close();
            };
        }
    }

    /**
     * Main polling tick — runs every 60 seconds
     */
    async function tick() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const minuteKey = currentHour * 60 + currentMinute;

        // Reset dedup set each new minute
        if (minuteKey !== lastCheckedMinute) {
            notifiedThisMinute.clear();
            lastCheckedMinute = minuteKey;
        }

        try {
            const meds = await apiFetch('/medicines');
            if (!Array.isArray(meds)) return;

            for (const med of meds) {
                if ((med.status || 'active') !== 'active') continue;
                if (notifiedThisMinute.has(med._id)) continue;

                const parsed = parseTime12h(med.time);
                if (!parsed) continue;

                if (parsed.hours === currentHour && parsed.minutes === currentMinute) {
                    notifiedThisMinute.add(med._id);
                    await sendNotification(med);
                    showInPageBanner(med);
                }
            }
        } catch (err) {
            // Silent — don't crash if API is unavailable
            console.warn('[Scheduler] Tick error:', err.message);
        }
    }

    // Start immediately, then poll every 60 seconds
    tick();
    setInterval(tick, 60 * 1000);

    // Refresh dashboard when user returns to the tab (catches newly-assigned meds)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (window.initDashboard) window.initDashboard();
        }
    });

    console.log('[MedRemind Scheduler] Running for', user.name);
})();
