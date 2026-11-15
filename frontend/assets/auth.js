/*
 * GeoAttend — shared DEMO sign-in logic (used by login.html). Needs assets/data.js.
 *
 * There is no backend yet, so accounts are checked in the browser. This is NOT secure — it will be
 * replaced by the backend login API. Demo accounts are listed in frontend/DEMO_ACCOUNTS.md.
 *
 *   AUTH.users()                          every account that can sign in
 *   AUTH.signIn(role, identifier, pass)   → { user } or { error }
 *   AUTH.startSession(user, remember, identifier)
 *   AUTH.register({ role, name, id, email, dept, password, desig })  → { ok } or { error }
 *   AUTH.statusOf(identifier)             → 'active' | 'pending' | 'inactive' | 'leave' | null  (teachers)
 *   AUTH.findUser(identifier)             for password reset
 *   AUTH.updatePassword(user, newPassword)
 */
(function () {
    const DEMO_USERS = [
        { username: 'admin', email: 'admin@geoattend.edu', password: 'Admin@123', role: 'admin', name: 'Admin' }
    ];
    const TEACHER_DEMO_PASSWORD = 'Teacher@123';
    const HOME = { admin: 'admin_dashboard.html', teacher: 'teacher_portal.html', student: null };

    const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
    const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
    const same = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

    // Every teacher in the shared data can sign in with email or employee ID.
    // Password: chosen at sign-up, changed/reset later, or the demo default.
    function teacherUsers() {
        const overrides = read('ga_pw_reset', {}), signups = read('ga_users', []).filter(u => u.role === 'teacher');
        return GA.loadTeachers().map(t => {
            const su = signups.find(u => same(u.email, t.email));
            return { username: t.emp, id: t.emp, email: t.email, password: overrides[t.email] || su?.password || TEACHER_DEMO_PASSWORD,
                role: 'teacher', name: t.name, teacherId: t.id, status: t.status };
        });
    }
    function users() {
        const overrides = read('ga_pw_reset', {});
        const demo = DEMO_USERS.map(u => overrides[u.email] ? { ...u, password: overrides[u.email] } : u);
        const teachers = teacherUsers();
        // sign-ups the admin has not opened yet stay in ga_users and count as "pending"
        const others = read('ga_users', []).filter(u => !(u.role === 'teacher' && teachers.some(t => same(t.email, u.email))))
            .map(u => u.role === 'teacher' ? { ...u, status: 'pending' } : u);
        return demo.concat(teachers, others);
    }
    const matches = (u, ident) => [u.username, u.email, u.id].filter(Boolean).some(v => same(v, ident));

    function signIn(role, identifier, password) {
        const u = users().find(x => x.role === role && matches(x, identifier) && x.password === password);
        if (!u) return { error: 'Invalid credentials for the selected role.' };
        if (u.status === 'pending') return { error: 'Your account is waiting for admin approval. You can sign in once it is approved.', code: 'pending' };
        if (u.status === 'inactive') return { error: 'This account has been deactivated. Please contact the administrator.', code: 'inactive' };
        return { user: u };
    }
    function startSession(user, remember, identifier) {
        try {
            if (remember) localStorage.setItem('ga_remember', JSON.stringify({ user: identifier, role: user.role }));
            else localStorage.removeItem('ga_remember');
            sessionStorage.setItem('ga_session', JSON.stringify({ name: user.name, role: user.role, teacherId: user.teacherId, email: user.email, at: Date.now() }));
        } catch {}
        return HOME[user.role];
    }
    function register(d) {
        const email = (d.email || '').trim().toLowerCase();
        if (users().some(u => same(u.email, email))) return { error: 'An account with this email already exists.' };
        if (d.id && users().some(u => same(u.id, d.id) || same(u.username, d.id))) return { error: `${d.role === 'teacher' ? 'Employee ID' : 'Roll number'} ${d.id} is already registered.` };
        const list = read('ga_users', []);
        list.push({ name: d.name.trim(), id: (d.id || '').trim().toUpperCase(), email, dept: d.dept, desig: d.desig, password: d.password, role: d.role, requestedAt: Date.now() });
        write('ga_users', list);
        return { ok: true };
    }
    function statusOf(identifier) {
        const u = users().find(x => x.role === 'teacher' && matches(x, identifier));
        return u ? (u.status || 'pending') : null;
    }
    function findUser(identifier) { return users().find(u => matches(u, identifier)); }
    function updatePassword(user, pw) {
        if (DEMO_USERS.some(d => d.email === user.email) || user.teacherId) {
            const o = read('ga_pw_reset', {}); o[user.email] = pw; write('ga_pw_reset', o);
        } else {
            const list = read('ga_users', []), u = list.find(x => same(x.email, user.email));
            if (u) { u.password = pw; write('ga_users', list); }
        }
    }
    function remembered() { return read('ga_remember', null); }

    window.AUTH = { users, signIn, startSession, register, statusOf, findUser, updatePassword, remembered, HOME };
})();
