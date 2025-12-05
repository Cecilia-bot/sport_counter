import { loadVisits } from './visits.js';

const panel = document.getElementById("visitsPanel");
const openBtn = document.getElementById("openVisitsBtn");

// toggle visibility
openBtn.addEventListener("click", () => {
    panel.classList.toggle("active");

    // load data only when opening
    if (panel.classList.contains("active")) {
        loadVisits();
    }
});
