/*
 * GeoAttend — top bar popups (pair with assets/topbar.css)
 *   - Click the admin profile in the top bar → profile menu
 *   - Click the calendar icon → month calendar with events
 * Works on any admin page that has a .topbar with a .profile and a Notifications .icon-btn.
 * Data is demo data for now (admin details come from the Settings page, events are samples).
 */
(function () {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    const profile = topbar.querySelector('.profile');
    const bell = topbar.querySelector('.icon-btn[aria-label="Notifications"]');

    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };

    /* ---------- Calendar button: reuse the page's, or add one next to the bell ---------- */
    let calBtn = topbar.querySelector('.icon-btn[aria-label="Calendar"]');
    if (!calBtn && bell) {
        calBtn = document.createElement('button');
        calBtn.className = 'icon-btn';
        calBtn.setAttribute('aria-label', 'Calendar');
        calBtn.innerHTML = '<i class="bi bi-calendar3"></i>';
        bell.parentNode.insertBefore(calBtn, bell);
    }

    /* ---------- Profile chip becomes a button ---------- */
    if (profile) {
        profile.setAttribute('role', 'button');
        profile.setAttribute('tabindex', '0');
        profile.setAttribute('aria-haspopup', 'menu');
        profile.setAttribute('aria-label', 'Open profile menu');
        const caret = document.createElement('i');
        caret.className = 'bi bi-chevron-down tb-caret';
        profile.appendChild(caret);
    }

    /* ---------- Popup helpers ---------- */
    const pops = [];
    function makePop(cls) {
        const el = document.createElement('div');
        el.className = 'tb-pop ' + cls;
        el.setAttribute('role', 'dialog');
        document.body.appendChild(el);
        pops.push(el);
        return el;
    }
    function place(pop, anchor) {
        const r = anchor.getBoundingClientRect();
        pop.style.top = (r.bottom + 10) + 'px';
        pop.style.right = Math.max(16, window.innerWidth - r.right) + 'px';
        pop.style.left = 'auto';
    }
    let current = null; // { pop, anchor }
    function open(pop, anchor, render) {
        if (current && current.pop === pop) return close();
        close();
        render();
        place(pop, anchor);
        pop.classList.add('show');
        anchor.classList.add('open');
        anchor.setAttribute('aria-expanded', 'true');
        current = { pop, anchor };
    }
    function close() {
        if (!current) return;
        current.pop.classList.remove('show');
        current.anchor.classList.remove('open');
        current.anchor.setAttribute('aria-expanded', 'false');
        current = null;
    }
    document.addEventListener('click', e => {
        if (!current) return;
        // composedPath() still includes the popup even if the click re-rendered it (e.g. picking a day)
        const path = e.composedPath();
        if (path.includes(current.pop) || path.includes(current.anchor)) return;
        close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', () => { if (current) place(current.pop, current.anchor); });

    /* ================= PROFILE MENU ================= */
    const profilePop = makePop('tb-profile');
    function unreadCount() {
        const d = read('ga_notifications', null);
        if (d && Array.isArray(d.inbox)) return d.inbox.filter(n => !n.read).length;
        const badge = document.querySelector('.side-nav a[href="admin_notifications.html"] .badge-pill');
        return badge ? parseInt(badge.textContent, 10) || 0 : 0;
    }
    function renderProfile() {
        const s = read('ga_settings', {});
        const name = s.adminName || 'Admin';
        const email = s.adminEmail || 'admin@geoattend.edu';
        const title = s.adminTitle || 'Super Administrator';
        const words = name.trim().split(/\s+/);
        const initials = (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
        const unread = unreadCount();
        profilePop.innerHTML = `
            <div class="tb-head">
                <div class="tb-ava" ${s.photo ? `style="background-image:url('${s.photo}')"` : ''}>${s.photo ? '' : esc(initials)}</div>
                <div style="min-width:0">
                    <b>${esc(name)}</b>
                    <small>${esc(email)}</small>
                    <span class="tb-role"><i class="bi bi-shield-check"></i> ${esc(title)}</span>
                </div>
            </div>
            <nav class="tb-menu" role="menu">
                <a href="admin_settings.html#profile" role="menuitem"><i class="bi bi-person"></i> My Profile <i class="bi bi-chevron-right tb-arrow"></i></a>
                <a href="admin_settings.html#general" role="menuitem"><i class="bi bi-gear"></i> Account Settings <i class="bi bi-chevron-right tb-arrow"></i></a>
                <a href="admin_notifications.html" role="menuitem"><i class="bi bi-bell"></i> Notifications ${unread ? `<span class="tb-count">${unread}</span>` : ''}</a>
                <a href="admin_settings.html#security" role="menuitem"><i class="bi bi-shield-lock"></i> Security <i class="bi bi-chevron-right tb-arrow"></i></a>
                <hr>
                <a href="login.html" class="tb-logout" role="menuitem" id="tbLogout"><i class="bi bi-box-arrow-right"></i> Logout</a>
            </nav>`;
        profilePop.querySelector('#tbLogout').addEventListener('click', () => {
            try { sessionStorage.removeItem('ga_session'); } catch (e) {}
        });
        // On the same page only the #hash changes (Settings listens for that), so just close the menu
        profilePop.querySelectorAll('a[href*="#"]').forEach(a => a.addEventListener('click', close));
    }
    if (profile) {
        profile.addEventListener('click', () => open(profilePop, profile, renderProfile));
        profile.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(profilePop, profile, renderProfile); }
        });
    }

    /* ================= CALENDAR ================= */
    // Views: 'days' (month grid) → click title → 'months' → click title → 'years'; plus 'add' (new event form)
    const calPop = makePop('tb-cal');
    const COLORS = { session: '#0284c7', exam: '#f43f5e', meeting: '#4338ca', holiday: '#10b981', deadline: '#f59e0b' };
    const LABELS = { session: 'Class', exam: 'Exam', meeting: 'Meeting', holiday: 'Holiday', deadline: 'Deadline' };
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DAY = 864e5;
    const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    /* ----- Events: samples + semester dates from Settings + events the admin adds (localStorage "ga_events") ----- */
    function myEvents() { return read('ga_events', []); }
    function saveMyEvents(list) { try { localStorage.setItem('ga_events', JSON.stringify(list)); } catch (e) {} }
    function fmtTime(t) {
        if (!t) return '';
        const [h, m] = t.split(':').map(Number);
        return `${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
    }
    function buildEvents() {
        const s = read('ga_settings', {});
        const ev = {};
        const add = (k, e) => { (ev[k] = ev[k] || []).push(e); };
        const plus = n => key(new Date(today.getTime() + n * DAY));
        add(key(today), { type: 'session', title: 'CS301 · Database Systems', time: '09:00 AM · Room B-204', sort: '09:00' });
        add(key(today), { type: 'session', title: 'SE210 · Software Engineering', time: '11:00 AM · Lab 3', sort: '11:00' });
        add(plus(1), { type: 'session', title: 'AI402 · Artificial Intelligence', time: '10:00 AM · Hall A', sort: '10:00' });
        add(plus(2), { type: 'meeting', title: 'Faculty meeting', time: '02:00 PM · Conference Room', sort: '14:00' });
        add(plus(5), { type: 'exam', title: 'Mid-term exams begin', time: 'All departments' });
        add(plus(6), { type: 'exam', title: 'Mid-term exams', time: 'All departments' });
        add(plus(12), { type: 'deadline', title: 'Monthly attendance report due', time: 'Submit by 5:00 PM', sort: '17:00' });
        add(plus(-3), { type: 'holiday', title: 'Sports day', time: 'No classes' });
        add(plus(18), { type: 'holiday', title: 'Public holiday', time: 'Campus closed' });
        const sem = s.semester || 'Fall';
        add(s.semStart || '2026-09-01', { type: 'deadline', title: 'Semester starts', time: sem + ' semester' });
        add(s.semEnd || '2027-01-15', { type: 'deadline', title: 'Semester ends', time: sem + ' semester' });
        myEvents().forEach(e => add(e.date, {
            id: e.id, mine: true, type: e.type, title: e.title,
            time: [fmtTime(e.time), e.note].filter(Boolean).join(' · ') || 'All day', sort: e.time || ''
        }));
        Object.values(ev).forEach(list => list.sort((a, b) => (a.sort || '00:00').localeCompare(b.sort || '00:00')));
        return ev;
    }

    let view = new Date(today.getFullYear(), today.getMonth(), 1);   // month on screen
    let selected = new Date(today);                                    // picked day
    let mode = 'days';
    let yearStart = today.getFullYear() - 5;                           // first year in the 12-year grid
    let events = {};
    let justAdded = null;                                              // highlight a new event once

    const workDays = () => read('ga_settings', {}).workDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    function header() {
        const y = view.getFullYear();
        let title, prevLbl = 'Previous month', nextLbl = 'Next month';
        if (mode === 'days') title = `${view.toLocaleDateString('en-US', { month: 'long' })} ${y}`;
        else if (mode === 'months') { title = String(y); prevLbl = 'Previous year'; nextLbl = 'Next year'; }
        else { title = `${yearStart} – ${yearStart + 11}`; prevLbl = 'Previous years'; nextLbl = 'Next years'; }
        const clickable = mode !== 'years';
        const tip = mode === 'days' ? 'Choose month and year' : mode === 'months' ? 'Choose year' : '';
        return `
            <div class="cal-top">
                <button type="button" class="cal-title ${clickable ? '' : 'static'}" data-title ${tip ? `aria-label="${tip}" title="${tip}"` : ''}>
                    ${title} ${clickable ? '<i class="bi bi-chevron-down"></i>' : ''}
                </button>
                <div class="cal-nav">
                    <button type="button" data-nav="-1" aria-label="${prevLbl}"><i class="bi bi-chevron-left"></i></button>
                    <button type="button" data-nav="0">Today</button>
                    <button type="button" data-nav="1" aria-label="${nextLbl}"><i class="bi bi-chevron-right"></i></button>
                </div>
            </div>`;
    }

    function daysView(anim) {
        const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const wd = workDays();
        const y = view.getFullYear(), m = view.getMonth();
        const lead = (new Date(y, m, 1).getDay() + 6) % 7;          // Monday first
        let cells = names.map(n => `<div class="wd">${n.slice(0, 2)}</div>`).join('');
        for (let i = 0; i < 42; i++) {
            const d = new Date(y, m, 1 - lead + i);
            if (i >= 35 && d.getMonth() !== m) break;               // skip an empty 6th row
            const k = key(d), list = events[k] || [];
            const cls = ['cal-day'];
            if (d.getMonth() !== m) cls.push('off');
            if (!wd.includes(names[(d.getDay() + 6) % 7])) cls.push('weekend');
            if (k === key(today)) cls.push('today');
            if (k === key(selected)) cls.push('sel');
            const dots = [...new Set(list.map(e => e.type))].slice(0, 3).map(t => `<span style="background:${COLORS[t]}"></span>`).join('');
            cells += `<button type="button" class="${cls.join(' ')}" data-date="${k}" aria-label="${d.toDateString()}${list.length ? ', ' + list.length + ' events' : ''}">${d.getDate()}${dots ? `<span class="dots">${dots}</span>` : ''}</button>`;
        }
        const selList = events[key(selected)] || [];
        const selLabel = key(selected) === key(today) ? 'Today' : selected.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        return `
            <div class="cal-grid ${anim || ''}">${cells}</div>
            <div class="cal-events">
                <div class="cal-ev-head">
                    <h6>${esc(selLabel)}</h6>
                    <button type="button" class="cal-add" data-add><i class="bi bi-plus-lg"></i> Add event</button>
                </div>
                ${selList.length ? selList.map(e => `
                    <div class="cal-ev ${e.mine && e.id === justAdded ? 'new' : ''}">
                        <span class="bar" style="background:${COLORS[e.type]}"></span>
                        <div style="min-width:0;flex:1"><b>${esc(e.title)}</b><small>${LABELS[e.type]} · ${esc(e.time)}</small></div>
                        ${e.mine ? `<button type="button" class="cal-del" data-del="${e.id}" aria-label="Delete event" title="Delete"><i class="bi bi-trash3"></i></button>` : ''}
                    </div>`).join('') : '<div class="cal-empty"><i class="bi bi-calendar-x"></i> No events on this day</div>'}
                <div class="cal-legend">${Object.keys(COLORS).map(t => `<span><i style="background:${COLORS[t]}"></i>${LABELS[t]}</span>`).join('')}</div>
            </div>`;
    }

    function monthsView(anim) {
        const y = view.getFullYear();
        return `<div class="cal-pick ${anim || ''}">${MONTHS.map((n, i) => {
            const cls = ['cal-cell'];
            if (y === today.getFullYear() && i === today.getMonth()) cls.push('cur');
            if (i === view.getMonth()) cls.push('sel');
            const prefix = `${y}-${String(i + 1).padStart(2, '0')}`;
            const count = Object.keys(events).filter(k => k.startsWith(prefix)).length;
            return `<button type="button" class="${cls.join(' ')}" data-month="${i}">${n}${count ? `<small>${count} event day${count > 1 ? 's' : ''}</small>` : ''}</button>`;
        }).join('')}</div>`;
    }

    function yearsView(anim) {
        let cells = '';
        for (let y = yearStart; y < yearStart + 12; y++) {
            const cls = ['cal-cell'];
            if (y === today.getFullYear()) cls.push('cur');
            if (y === view.getFullYear()) cls.push('sel');
            cells += `<button type="button" class="${cls.join(' ')}" data-year="${y}">${y}</button>`;
        }
        return `<div class="cal-pick ${anim || ''}">${cells}</div>`;
    }

    function addView() {
        return `
            <div class="cal-top">
                <button type="button" class="cal-back" data-back aria-label="Back to calendar"><i class="bi bi-arrow-left"></i></button>
                <b style="flex:1;margin-left:10px">New event</b>
            </div>
            <form class="cal-form" id="calForm" novalidate>
                <label>Title<input id="ceTitle" maxlength="60" placeholder="e.g. Department meeting" autocomplete="off"></label>
                <div class="cal-row">
                    <label>Date<input id="ceDate" type="date" value="${key(selected)}"></label>
                    <label><div>Time <span>(optional)</span></div><input id="ceTime" type="time"></label>
                </div>
                <div class="cal-lbl">Type</div>
                <div class="cal-types">${Object.keys(COLORS).map(t => `
                    <label><input type="radio" name="ceType" value="${t}" ${t === 'meeting' ? 'checked' : ''}><span><i style="background:${COLORS[t]}"></i>${LABELS[t]}</span></label>`).join('')}
                </div>
                <label><div>Location / note <span>(optional)</span></div><input id="ceNote" maxlength="50" placeholder="e.g. Room B-204"></label>
                <div class="cal-actions">
                    <button type="button" class="cal-btn ghost" data-back>Cancel</button>
                    <button type="submit" class="cal-btn primary"><i class="bi bi-check2"></i> Save event</button>
                </div>
            </form>`;
    }

    function renderCal(anim) {
        if (mode === 'add') {
            calPop.innerHTML = addView();
            setTimeout(() => { const f = calPop.querySelector('#ceTitle'); if (f) f.focus(); }, 50);
            return;
        }
        const body = mode === 'days' ? daysView(anim) : mode === 'months' ? monthsView(anim) : yearsView(anim);
        calPop.innerHTML = header() + body;
        justAdded = null;
    }

    function shake(el) { el.classList.remove('cal-shake'); void el.offsetWidth; el.classList.add('cal-shake'); }

    calPop.addEventListener('click', e => {
        const t = e.target;
        if (t.closest('[data-title]')) {                       // "November 2026" → months → years
            if (mode === 'days') { mode = 'months'; renderCal('zoom-out'); }
            else if (mode === 'months') { mode = 'years'; yearStart = view.getFullYear() - 5; renderCal('zoom-out'); }
            return;
        }
        const nav = t.closest('[data-nav]');
        if (nav) {
            const n = +nav.dataset.nav;
            const anim = n < 0 ? 'anim-l' : 'anim-r';
            if (n === 0) {
                view = new Date(today.getFullYear(), today.getMonth(), 1); selected = new Date(today);
                mode = 'days'; renderCal('zoom-in');
            } else if (mode === 'days') { view = new Date(view.getFullYear(), view.getMonth() + n, 1); renderCal(anim); }
            else if (mode === 'months') { view = new Date(view.getFullYear() + n, view.getMonth(), 1); renderCal(anim); }
            else { yearStart += n * 12; renderCal(anim); }
            return;
        }
        const yr = t.closest('[data-year]');
        if (yr) { view = new Date(+yr.dataset.year, view.getMonth(), 1); mode = 'months'; renderCal('zoom-in'); return; }
        const mo = t.closest('[data-month]');
        if (mo) { view = new Date(view.getFullYear(), +mo.dataset.month, 1); mode = 'days'; renderCal('zoom-in'); return; }
        const day = t.closest('[data-date]');
        if (day) {
            selected = new Date(day.dataset.date + 'T00:00:00');
            const moved = selected.getMonth() !== view.getMonth() || selected.getFullYear() !== view.getFullYear();
            const dir = selected < view ? 'anim-l' : 'anim-r';
            if (moved) view = new Date(selected.getFullYear(), selected.getMonth(), 1);
            renderCal(moved ? dir : '');
            return;
        }
        if (t.closest('[data-add]')) { mode = 'add'; renderCal(); return; }
        if (t.closest('[data-back]')) { mode = 'days'; renderCal('zoom-in'); return; }
        const del = t.closest('[data-del]');
        if (del) {
            del.closest('.cal-ev').classList.add('leaving');
            setTimeout(() => {
                saveMyEvents(myEvents().filter(x => x.id !== del.dataset.del));
                events = buildEvents(); renderCal('');
            }, 250);
        }
    });

    calPop.addEventListener('submit', e => {
        e.preventDefault();
        const title = calPop.querySelector('#ceTitle'), date = calPop.querySelector('#ceDate');
        if (!title.value.trim()) { title.classList.add('bad'); shake(title); title.focus(); return; }
        if (!date.value) { date.classList.add('bad'); shake(date); return; }
        const ev = {
            id: 'ev' + Date.now(),
            title: title.value.trim(),
            date: date.value,
            time: calPop.querySelector('#ceTime').value,
            type: calPop.querySelector('input[name="ceType"]:checked').value,
            note: calPop.querySelector('#ceNote').value.trim()
        };
        saveMyEvents(myEvents().concat(ev));
        events = buildEvents();
        selected = new Date(ev.date + 'T00:00:00');
        view = new Date(selected.getFullYear(), selected.getMonth(), 1);
        justAdded = ev.id;
        mode = 'days';
        renderCal('zoom-in');
    });
    calPop.addEventListener('input', e => e.target.classList.remove('bad'));

    if (calBtn) calBtn.addEventListener('click', () => open(calPop, calBtn, () => {
        events = buildEvents();
        if (mode === 'add') mode = 'days';
        renderCal('');
    }));
})();
