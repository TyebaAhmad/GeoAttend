/*
 * GeoAttend — shared admin page helpers (pair with assets/admin.css)
 *   ui.toast(message, 'success' | 'error' | 'info')
 *   await ui.confirm(title, text, okLabel)  → true / false
 *   ui.esc(text)                             → HTML-safe text
 * Also wires the mobile sidebar toggle and the Logout link.
 */
(function () {
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function toast(msg, type = 'success') {
        let t = document.getElementById('uiToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'uiToast';
            t.innerHTML = '<i></i><span></span>';
            t.setAttribute('role', 'status');
            document.body.appendChild(t);
        }
        const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };
        t.className = 'toast-s ' + type;
        t.querySelector('i').className = 'bi ' + (icons[type] || icons.info);
        t.querySelector('span').textContent = msg;
        requestAnimationFrame(() => t.classList.add('show'));
        clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2800);
    }

    function confirmBox(title, text, okLabel = 'Confirm') {
        let m = document.getElementById('uiModal');
        if (!m) {
            m = document.createElement('div');
            m.id = 'uiModal';
            m.className = 'modal-bg';
            m.innerHTML = `
                <div class="modal-box glass" role="dialog" aria-modal="true">
                    <div class="mi"><i class="bi bi-exclamation-triangle"></i></div>
                    <h4></h4><p></p>
                    <div class="d-flex gap-2 justify-content-end">
                        <button class="btn-glass" data-cancel>Cancel</button>
                        <button class="btn-danger-soft" data-ok>Confirm</button>
                    </div>
                </div>`;
            document.body.appendChild(m);
        }
        m.querySelector('h4').textContent = title;
        m.querySelector('p').textContent = text;
        m.querySelector('[data-ok]').textContent = okLabel;
        m.classList.add('show');
        return new Promise(resolve => {
            const done = v => { m.classList.remove('show'); m.onclick = null; document.removeEventListener('keydown', onKey); resolve(v); };
            const onKey = e => { if (e.key === 'Escape') done(false); };
            document.addEventListener('keydown', onKey);
            m.onclick = e => {
                if (e.target.closest('[data-ok]')) done(true);
                else if (e.target.closest('[data-cancel]') || e.target === m) done(false);
            };
            setTimeout(() => m.querySelector('[data-cancel]').focus(), 30);
        });
    }

    // Mobile sidebar + logout
    const toggle = () => document.body.classList.toggle('nav-open');
    const mt = document.getElementById('menuToggle'), ov = document.getElementById('overlay');
    if (mt) mt.addEventListener('click', toggle);
    if (ov) ov.addEventListener('click', toggle);
    const lo = document.getElementById('logoutBtn');
    if (lo) lo.addEventListener('click', () => { try { sessionStorage.removeItem('ga_session'); } catch (e) {} });

    window.ui = { toast, confirm: confirmBox, esc };
})();
