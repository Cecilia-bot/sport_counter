import { loadVisitsPreserveState } from './visits.js';

const visitsPanel = document.getElementById("visitsPanel");
const openVisitsBtn = document.getElementById("openVisitsBtn");

// Prevent scrolling during drag
let isDragging = false;

document.addEventListener('touchmove', function(e) {
    if (isDragging) {
        e.preventDefault();
    }
}, { passive: false });

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
let activePointerId = null;
let pointerDown = false;    // true between pointerdown and pointerup
let isDraggingPanel = false;

// Mouse-based drag support for desktop
let mouseDown = false;
let wasDragged = false;

visitsPanel.addEventListener('pointerdown', (e) => {
    const rect = visitsPanel.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const HANDLE_HEIGHT = 48;

    // only handle drag if touch starts on handle
    if (clickY > HANDLE_HEIGHT) {
        // ❌ content area → allow normal scrolling
        isDraggingPanel = false; 
        return;
    }

    // ✅ handle touched → panel owns the gesture
    isDraggingPanel = true;

    e.preventDefault();
    visitsPanel.setPointerCapture(e.pointerId);

    startY = e.clientY;
    currentY = startY;
    pointerDown = true;
    activePointerId = e.pointerId;
    visitsPanel.classList.add('dragging');
    visitsPanel.style.transition = 'none'; // disable transition during drag for immediate response
    isDragging = true;
});


visitsPanel.addEventListener('pointermove', (e) => {
    if (
        !pointerDown || 
        !isDraggingPanel ||
        e.pointerId !== activePointerId
    ) return;

    e.preventDefault();
    currentY = e.clientY;
    const deltaY = currentY - startY;

    if (deltaY > 0) {
        visitsPanel.style.transform = `translateY(${deltaY}px)`;
    }
});

function finishPointerDrag() {
    if (!pointerDown) return;

    pointerDown = false;
    const delta = currentY - startY;
    const panelHeight = visitsPanel.offsetHeight;
    const threshold = panelHeight * 0.4; // 40% of panel height

    visitsPanel.releasePointerCapture(activePointerId);
    isDraggingPanel = false;

    visitsPanel.classList.remove('dragging');
    visitsPanel.style.transition = ''; // restore transition

    // CLOSE if dragged down enough (40% of panel height)
    if (delta > threshold) {
        visitsPanel.classList.remove('active');
    }

    // Snap back / animate naturally via CSS
    visitsPanel.style.transform = '';

    updateFloatingBtn();
    isDragging = false;
    if (Math.abs(delta) > 5) wasDragged = true;
}

visitsPanel.addEventListener('pointerup', finishPointerDrag);
visitsPanel.addEventListener('pointercancel', finishPointerDrag);

// Mouse event listeners for desktop drag support
visitsPanel.addEventListener('mousedown', (e) => {
    const rect = visitsPanel.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const HANDLE_HEIGHT = 48;

    if (clickY > HANDLE_HEIGHT) {
        return;
    }

    e.preventDefault();
    startY = e.clientY;
    currentY = startY;
    mouseDown = true;
    visitsPanel.classList.add('dragging');
    visitsPanel.style.transition = 'none';
    isDragging = true;
});

visitsPanel.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;

    e.preventDefault();
    currentY = e.clientY;
    const deltaY = currentY - startY;

    if (deltaY > 0) {
        visitsPanel.style.transform = `translateY(${deltaY}px)`;
    }
});

visitsPanel.addEventListener('mouseup', () => {
    if (!mouseDown) return;

    mouseDown = false;
    const delta = currentY - startY;
    const panelHeight = visitsPanel.offsetHeight;
    const threshold = panelHeight * 0.4;

    visitsPanel.classList.remove('dragging');
    visitsPanel.style.transition = '';

    if (delta > threshold) {
        visitsPanel.classList.remove('active');
    }

    visitsPanel.style.transform = '';

    updateFloatingBtn();
    isDragging = false;
    if (Math.abs(delta) > 5) wasDragged = true;
});

// also allow tapping the small handle area to open when closed
function updateFloatingBtn() {
    // floating button visible when visitsPanel is closed on all devices;

    //RESTORE TO NORMAL ONCE WE HAVE AT LEAST 2 WAZS TO CLOSE THE PANEL
    // when visitsPanel is open, only show the button on larger screens (>=900px)
    if (!visitsPanel) return;
    //if (!visitsPanel.classList.contains('active')) {
    openVisitsBtn.style.display = 'block';
    //} else {
    //    openVisitsBtn.style.display = (window.innerWidth >= 900) ? 'block' : 'block';
    //}


}

// also allow tapping the small handle area to open when closed, and to close when open
visitsPanel.addEventListener('click', (e) => {
    if (wasDragged) {
        wasDragged = false;
        return;
    }

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
