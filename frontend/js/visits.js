const API_BASE = "http://127.0.0.1:8000";
// const API_BASE = "https://sportcounter-backend.up.railway.app";

function waitForAuth() {
    return new Promise(resolve => {
        firebase.auth().onAuthStateChanged(user => {
            resolve(user);
        });
    });
}

async function loadVisits() {
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
    const list = document.getElementById("visitsList");
    list.innerHTML = "";
    visits.forEach(visit => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = `${visit.visit_date} | ${visit.resort} | ${visit.price_paid}`;
        list.appendChild(li);
    });
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

        // Build the table rows
        const rows = visitsList.map(v => `
            <tr>
                <td>${v.date}</td>
                <td>${v.price} €</td>
            </tr>
        `).join("");

        const html = `
        <div class="accordion-item">
            <h2 class="accordion-header" id="${headerId}">
                <button class="accordion-button collapsed" type="button"
                    data-bs-toggle="collapse" data-bs-target="#${collapseId}"
                    aria-expanded="false" aria-controls="${collapseId}">
                    ${resort} — <strong>${totalPrice} € total</strong>
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
}

loadVisits();