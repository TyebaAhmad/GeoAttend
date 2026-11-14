/*
 * GeoAttend — shared click & motion effects (pair with assets/fx.css)
 *   fx.enter(selector)       slide elements in one after another
 *   fx.countUp(el)           count a number up from 0 (keeps "2,846" / "87.4%" formatting)
 *   fx.bump(el)              quick "pop" when a value changes
 *   fx.shake(el)             shake (e.g. invalid input)
 *   fx.ring(el)              ring a bell icon button
 *   fx.success(btn, label)   turn a button green with a check for a moment
 * Ripples are added automatically to buttons and links listed in RIPPLE_HOSTS.
 */
(function () {
    const RIPPLE_HOSTS = '.btn-glass, .btn-primary-grad, .btn-danger-soft, .icon-btn, .side-nav a, .settings-nav a, .seg button, .link-btn, .link-more, .chips label > span';
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function restart(el, cls) {
        if (!el) return;
        el.classList.remove(cls);
        void el.offsetWidth;            // reflow so the animation can play again
        el.classList.add(cls);
        el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
    }

    const fx = {
        enter(selector, root) {
            const els = typeof selector === 'string' ? (root || document).querySelectorAll(selector) : selector;
            [...els].forEach((el, i) => {
                el.style.setProperty('--fx-i', i);
                el.classList.remove('fx-in'); void el.offsetWidth; el.classList.add('fx-in');
                el.addEventListener('animationend', function done(e) {
                    if (e.target !== el) return;
                    el.classList.remove('fx-in'); el.removeEventListener('animationend', done);
                });
            });
        },

        countUp(el, duration = 1100) {
            if (!el) return;
            const text = el.textContent.trim();
            const m = text.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
            if (!m || reduced) return;
            const [, pre, num, post] = m;
            const target = parseFloat(num.replace(/,/g, ''));
            const decimals = (num.split('.')[1] || '').length;
            const useCommas = num.includes(',');
            const start = performance.now();
            const fmt = v => {
                const s = v.toFixed(decimals);
                return useCommas ? Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : s;
            };
            (function tick(now) {
                const p = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = pre + fmt(target * eased) + post;
                if (p < 1) requestAnimationFrame(tick);
                else el.textContent = text;
            })(start);
        },

        bump(el) { restart(el, 'fx-bump'); },
        shake(el) { restart(el, 'fx-shake'); },
        ring(el) { restart(el, 'fx-ring'); },

        success(btn, label = 'Done!', ms = 1300) {
            if (!btn || btn._fxBusy) return;
            btn._fxBusy = true;
            const html = btn.innerHTML;
            btn.classList.add('fx-success');
            btn.innerHTML = `<i class="bi bi-check2-circle"></i> ${label}`;
            setTimeout(() => {
                btn.classList.remove('fx-success');
                btn.innerHTML = html;
                btn._fxBusy = false;
            }, ms);
        }
    };

    // Ripple from where the user clicks
    document.addEventListener('pointerdown', e => {
        if (reduced || e.button > 0) return;
        const host = e.target.closest(RIPPLE_HOSTS);
        if (!host || host.disabled) return;
        const r = host.getBoundingClientRect();
        const size = Math.max(r.width, r.height);
        const ripple = document.createElement('fx-ripple');
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
        host.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    });

    window.fx = fx;
})();
