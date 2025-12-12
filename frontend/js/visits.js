const API_BASE = "http://127.0.0.1:8000";
// const API_BASE = "https://sportcounter-backend.up.railway.app";

function waitForAuth() {
    return new Promise(resolve => {
        firebase.auth().onAuthStateChanged(user => {
            resolve(user);
        });
    });
}

export async function loadVisits() {
    const user = await waitForAuth();   // <-- ⭐ VERY important
    if (!user) {
        alert("Not signed in");
        return;
    }

    const token = await user.getIdToken(/* forceRefresh */ false);
    const email = encodeURIComponent(user.email);
    const res = await fetch(`${API_BASE}/state/${email}/visits`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const visits = await res.json();
    renderResortAccordion(visits);
}

function groupByResort(visits) {
    const map = {};

    visits.forEach(visit => {
        if (!map[visit.resort]) {
            map[visit.resort] = {
                total: 0,
                visits: []
            };
        }
        map[visit.resort].total += visit.price_paid;
        map[visit.resort].visits.push(visit);
    });

    return map;
}

function renderResortAccordion(visits) {
    const container = document.getElementById("accordionVisits");
    container.innerHTML = "";

    const grouped = groupByResort(visits);
    const resorts = Object.keys(grouped);

    resorts.forEach((resort, index) => {
        const collapseId = `collapse-${index}`;
        const headerId = `heading-${index}`;

        const totalPrice = grouped[resort].total;
        const visitsList = grouped[resort].visits;

        // Build the table rows with edit/delete buttons
        const rows = visitsList.map(v => `
            <tr>
                <td>${v.visit_date}</td>
                <td>${v.price_paid} €</td>
                <td>
                    <button class="btn btn-sm btn-warning edit-visit-btn" data-visit-id="${v.id}" data-visit-date="${v.visit_date}" data-visit-price="${v.price_paid}" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-visit-btn" data-visit-id="${v.id}" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join("");

        const html = `
        <div class="accordion-item">
            <h2 class="accordion-header" id="${headerId}">
                <button class="accordion-button collapsed" type="button"
                    data-bs-toggle="collapse" data-bs-target="#${collapseId}"
                    aria-expanded="false" aria-controls="${collapseId}">
                    <strong>${resort.charAt(0).toUpperCase() + resort.slice(1,)} </strong>&nbsp;${visitsList.length} time(s) - ${totalPrice} €
                </button>
            </h2>

            <div id="${collapseId}" class="accordion-collapse collapse"
                aria-labelledby="${headerId}" data-bs-parent="#visitsAccordion">

                <div class="accordion-body">

                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>

                </div>
            </div>
        </div>
        `;

        container.insertAdjacentHTML("beforeend", html);
    });

    // Attach event listeners to delete and edit buttons
    attachVisitActionListeners();
}

function attachVisitActionListeners() {
    // Delete buttons
    document.querySelectorAll('.delete-visit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const visitId = btn.getAttribute('data-visit-id');
            if (confirm('Are you sure you want to delete this visit?')) {
                await deleteVisit(visitId);
            }
        });
    });

    // Edit buttons
    document.querySelectorAll('.edit-visit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const visitId = btn.getAttribute('data-visit-id');
            const visitDate = btn.getAttribute('data-visit-date');
            const visitPrice = btn.getAttribute('data-visit-price');
            openEditModal(visitId, visitDate, visitPrice);
        });
    });
}

async function deleteVisit(visitId) {
    const user = await waitForAuth();
    if (!user) {
        alert("Not signed in");
        return;
    }

    const token = await user.getIdToken(false);
    const email = encodeURIComponent(user.email);

    try {
        const res = await fetch(`${API_BASE}/state/${email}/visits/${visitId}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            throw new Error(`Delete failed: ${res.status}`);
        }

        const data = await res.json();
        
        // Update the main page stats
        const updateFieldsEvent = new CustomEvent('visitDeleted', { detail: data });
        window.dispatchEvent(updateFieldsEvent);

        // Reload visits panel
        loadVisits();
    } catch (error) {
        console.error('Error deleting visit:', error);
        alert('Failed to delete visit');
    }
}

function openEditModal(visitId, visitDate, visitPrice) {
    const modal = new bootstrap.Modal(document.getElementById('editVisitModal'));
    
    // Populate form
    document.getElementById('editVisitId').value = visitId;
    document.getElementById('editVisitDate').value = visitDate;
    document.getElementById('editVisitPrice').value = visitPrice;
    
    modal.show();
}

document.getElementById('saveEditBtn').addEventListener('click', async () => {
    const visitId = document.getElementById('editVisitId').value;
    const visitDate = document.getElementById('editVisitDate').value;
    const visitPrice = parseFloat(document.getElementById('editVisitPrice').value);

    const user = await waitForAuth();
    if (!user) {
        alert("Not signed in");
        return;
    }

    const token = await user.getIdToken(false);
    const email = encodeURIComponent(user.email);

    try {
        const res = await fetch(`${API_BASE}/state/${email}/visits/${visitId}`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                visit_date: visitDate,
                price_paid: visitPrice
            })
        });

        if (!res.ok) {
            throw new Error(`Update failed: ${res.status}`);
        }

        const data = await res.json();
        
        // Update the main page stats
        const updateFieldsEvent = new CustomEvent('visitEdited', { detail: data });
        window.dispatchEvent(updateFieldsEvent);

        // Close modal and reload visits
        const modal = bootstrap.Modal.getInstance(document.getElementById('editVisitModal'));
        modal.hide();
        
        loadVisits();
    } catch (error) {
        console.error('Error updating visit:', error);
        alert('Failed to update visit');
    }
});
