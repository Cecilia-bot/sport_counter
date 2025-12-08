import { loadVisits } from './visits.js';

const panel = document.getElementById("visitsPanel");
const openBtn = document.getElementById("openVisitsBtn");

// toggle visibility on click
openBtn.addEventListener("click", () => {
    const opening = !panel.classList.contains("active");
    panel.classList.toggle("active");
    // load data only when opening
    if (opening) loadVisits();
    // clear any inline transforms set during touch
    panel.style.transform = '';
    updateFloatingBtn();
});

// Pointer-based drag support: supports touch and mouse (desktop dragging)
let startY = 0;
let currentY = 0;
let touching = false;
let activePointerId = null;

panel.addEventListener('pointerdown', (e) => {
    // only handle primary pointers (mouse left button / single touch)
    if (e.isPrimary === false) return;
    // For mouse on small screens we prefer not to start drag (mobile UI)
    if (e.pointerType === 'mouse' && window.innerWidth < 900) return;
    startY = e.clientY;
    currentY = startY;
    touching = true;
    activePointerId = e.pointerId;
    try {
        panel.setPointerCapture(activePointerId);
    } catch (err) {
        // ignore if not supported
    }
    // temporarily disable transition for direct follow effect
    panel.style.transition = 'none';
});

panel.addEventListener('pointermove', (e) => {
    if (!touching || e.pointerId !== activePointerId) return;
    currentY = e.clientY;
    const delta = currentY - startY;
    // only respond to vertical moves beyond a small threshold
    if (Math.abs(delta) > 6) {
        // apply a translate while dragging (delta positive moves it down)
        panel.style.transform = `translateY(${Math.max(0, delta)}px)`;
    }
});

function finishPointerDrag(e) {
    if (!touching) return;
    touching = false;
    const delta = currentY - startY;
    // restore transition
    panel.style.transition = '';
    // release pointer capture if we set it
    try {
        if (activePointerId != null) panel.releasePointerCapture(activePointerId);
    } catch (err) {}
    activePointerId = null;
    // if the drag was significant, toggle state
    if (delta > 60) {
        // dragged down -> close
        panel.classList.remove('active');
    } else if (delta < -60) {
        // dragged up -> open
        if (!panel.classList.contains('active')) {
            panel.classList.add('active');
            loadVisits();
        }
    }
    // allow CSS to animate from the current inline transform to the new class transform
    requestAnimationFrame(() => {
        panel.style.transform = '';
        updateFloatingBtn();
    });
}

panel.addEventListener('pointerup', finishPointerDrag);
panel.addEventListener('pointercancel', finishPointerDrag);

// also allow tapping the small handle area to open when closed
function updateFloatingBtn() {
    // floating button visible when panel is closed on all devices;
    // when panel is open, only show the button on larger screens (>=900px)
    if (!panel) return;
    if (!panel.classList.contains('active')) {
        openBtn.style.display = 'block';
    } else {
        openBtn.style.display = (window.innerWidth >= 900) ? 'block' : 'none';
    }
}

// also allow tapping the small handle area to open when closed, and to close when open
panel.addEventListener('click', (e) => {
    const rect = panel.getBoundingClientRect();
    const clickY = e.clientY - rect.top; // distance from top of panel
    const HANDLE_HEIGHT = 48; // pixels from top considered the handle

    if (!panel.classList.contains('active')) {
        panel.classList.add('active');
        loadVisits();
        updateFloatingBtn();
        return;
    }

    // if panel is open and user clicked on the handle area, close it
    if (clickY >= 0 && clickY <= HANDLE_HEIGHT) {
        panel.classList.remove('active');
        updateFloatingBtn();
    }
});

// keep button visibility correct on resize
window.addEventListener('resize', updateFloatingBtn);

// initial state
updateFloatingBtn();
