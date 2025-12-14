import { loadVisitsPreserveState } from './visits.js';

const visitsPanel = document.getElementById("visitsPanel");
const openVisitsBtn = document.getElementById("openVisitsBtn");

// toggle visibility on click
openVisitsBtn.addEventListener("click", () => {
    const opening = !visitsPanel.classList.contains("active");
    visitsPanel.classList.toggle("active");
    // load data only when opening
    if (opening) {
        loadVisitsPreserveState();
        document.querySelectorAll('.accordion-collapse.show').forEach(item => {
        item.classList.remove('show');
    })
    }
    // clear any inline transforms set during touch
    visitsPanel.style.transform = '';
    updateFloatingBtn();
});

// Pointer-based drag support: supports touch and mouse (desktop dragging)
let startY = 0;
let currentY = 0;
let touching = false;       // true when we've started a real drag
let activePointerId = null;
let pointerDown = false;    // true between pointerdown and pointerup

visitsPanel.addEventListener('pointerdown', (e) => {
    // only handle primary pointers (mouse left button / single touch)
    if (e.isPrimary === false) return;
    // For mouse on small screens we prefer not to start drag (mobile UI)
    if (e.pointerType === 'mouse' && window.innerWidth < 900) return;
    startY = e.clientY;
    currentY = startY;
    pointerDown = true;
    activePointerId = e.pointerId;
    // do NOT disable transitions yet; wait until user actually moves enough to be considered dragging
});

visitsPanel.addEventListener('pointermove', (e) => {
    if (!pointerDown || e.pointerId !== activePointerId) return;
    currentY = e.clientY;
    const delta = currentY - startY;
    // only respond to vertical moves beyond a small threshold
    if (Math.abs(delta) > 6) {
        // when first crossing the threshold, enter dragging mode and disable transition
        if (!touching) {
            touching = true;
            visitsPanel.style.transition = 'none';
            // only capture the pointer when we start dragging so clicks still reach inner elements
            try {
                visitsPanel.setPointerCapture(activePointerId);
            } catch (err) {
                // ignore if not supported
            }
        }
        // apply a translate while dragging (delta positive moves it down)
        visitsPanel.style.transform = `translateY(${Math.max(0, delta)}px)`;
    }
});

function finishPointerDrag(e) {
    // clear pointerDown flag
    pointerDown = false;
    const delta = currentY - startY;
    // if we never entered dragging mode, just ensure we clear any partial inline styles
    if (!touching) {
        visitsPanel.style.transition = '';
        visitsPanel.style.transform = '';
        try {
            if (activePointerId != null) visitsPanel.releasePointerCapture(activePointerId);
        } catch (err) {}
        activePointerId = null;
        return;
    }
    touching = false;
    // restore transition (we'll animate from current inline transform to the target)
    visitsPanel.style.transition = '';
    // release pointer capture if we set it
    try {
        if (activePointerId != null) visitsPanel.releasePointerCapture(activePointerId);
    } catch (err) {}
    activePointerId = null;
    // if the drag was significant, toggle state
    if (delta > 60) {
        // dragged down -> close
        visitsPanel.classList.remove('active');
    } else if (delta < -60) {
        // dragged up -> open
        if (!visitsPanel.classList.contains('active')) {
            visitsPanel.classList.add('active');
            loadVisitsPreserveState();
        }
    }
    // allow CSS to animate from the current inline transform to the new class transform
    requestAnimationFrame(() => {
        visitsPanel.style.transform = '';
        updateFloatingBtn();
    });
}

visitsPanel.addEventListener('pointerup', finishPointerDrag);
visitsPanel.addEventListener('pointercancel', finishPointerDrag);

// also allow tapping the small handle area to open when closed
function updateFloatingBtn() {
    // floating button visible when visitsPanel is closed on all devices;
    // when visitsPanel is open, only show the button on larger screens (>=900px)
    if (!visitsPanel) return;
    if (!visitsPanel.classList.contains('active')) {
        openVisitsBtn.style.display = 'block';
    } else {
        openVisitsBtn.style.display = (window.innerWidth >= 900) ? 'block' : 'none';
    }
}

// also allow tapping the small handle area to open when closed, and to close when open
visitsPanel.addEventListener('click', (e) => {
    const rect = visitsPanel.getBoundingClientRect();
    const clickY = e.clientY - rect.top; // distance from top of visitsPanel
    const HANDLE_HEIGHT = 48; // pixels from top considered the handle

    if (!visitsPanel.classList.contains('active')) {
        visitsPanel.classList.add('active');
        loadVisitsPreserveState();
        updateFloatingBtn();
        return;
    }

    // if visitsPanel is open and user clicked on the handle area, close it
    if (clickY >= 0 && clickY <= HANDLE_HEIGHT) {
        visitsPanel.classList.remove('active');
        updateFloatingBtn();
    }
});

// keep button visibility correct on resize
window.addEventListener('resize', updateFloatingBtn);

// initial state
updateFloatingBtn();
