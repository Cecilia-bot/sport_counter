const API_BASE = "http://127.0.0.1:8000";
// const API_BASE = "https://sportcounter-backend.up.railway.app";

async function waitForAuth() {
    return new Promise(resolve => {
        firebase.auth().onAuthStateChanged(user => {
            resolve(user);
        });
    });
}

async function loadResorts() {
    const res = await fetch(`${API_BASE}/resorts`);
    const resorts = await res.json();

    const list = document.getElementById("resortList");
    list.innerHTML = "";
    resorts.forEach(resort => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            <span>${resort.name.charAt(0).toUpperCase() + resort.name.slice(1)} - ${resort.price.toFixed(2)} €</span>
            <div>
                <button class="btn btn-sm btn-outline-primary edit-resort-btn" data-resort-id="${resort.id}" data-resort-name="${resort.name}" data-resort-price="${resort.price.toFixed(2)}" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-resort-btn" data-resort-id="${resort.id}" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(li);
    });
    
    // Attach event listeners
    attachResortListeners();
}

document.getElementById("download-db").addEventListener("click", async () => {
    const user = firebase.auth().currentUser;
        if (!user) {
        alert("Not signed in");
        return;
    }

    const token = await user.getIdToken(/* forceRefresh */ false);

    const response = await fetch(`${API_BASE}/admin/download-db`, {
        headers: { 
            "Authorization": `Bearer ${token}`
         }
    });

    if (!response.ok) {
        const msg = await response.text();
        alert(`Download failed: ${response.status} ${msg}`);
        return;
    }

    // Convert response into a blob (binary data)
    const blob = await response.blob();

    // Create a temporary object URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create an <a> element to trigger the download
    const a = document.createElement("a");
    a.href = url;

    // Try to extract filename from Content-Disposition header or use current date
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const currentDate = `${year}${month}${day}_${hours}${minutes}${seconds}`;
    const backupFilename = "backup_app_" + currentDate + ".db"
    
    const disposition = response.headers.get("Content-Disposition");
    const match = disposition && disposition.match(/filename="([^"]+)"/);
    a.download = match ? match[1] : backupFilename;

    document.body.appendChild(a);
    a.click(); // trigger the download
    a.remove();

    // Clean up the blob URL after download
    window.URL.revokeObjectURL(url);
});

document.getElementById("addResortBtn").addEventListener("click", async () => {
    const user = firebase.auth().currentUser;
        if (!user) {
        alert("Not signed in");
        return;
    }

    const token = await user.getIdToken(/* forceRefresh */ false);
    const name = document.getElementById("new_resort_name").value.trim();
    const price = parseFloat(document.getElementById("new_resort_price").value);
    if (!name || isNaN(price)) {
        alert("Please provide a valid name and price.");
        return;
    }

    await fetch(`${API_BASE}/resorts`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
         },
        body: JSON.stringify({ name, price })
    });

    document.getElementById("new_resort_name").value = "";
    document.getElementById("new_resort_price").value = "";

    loadResorts();
});

// ===== Resort Edit/Delete Functions =====

function attachResortListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-resort-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const resortId = btn.getAttribute('data-resort-id');
            const resortName = btn.getAttribute('data-resort-name');
            const resortPrice = btn.getAttribute('data-resort-price');
            openEditResortModal(resortId, resortName, resortPrice);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-resort-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const resortId = btn.getAttribute('data-resort-id');
            if (confirm('Are you sure you want to delete this resort?')) {
                await deleteResort(resortId);
            }
        });
    });
}

function openEditResortModal(resortId, resortName, resortPrice) {
    const modal = new bootstrap.Modal(document.getElementById('editResortModal'));
    document.getElementById('editResortId').value = resortId;
    document.getElementById('editResortName').value = resortName;
    document.getElementById('editResortPrice').value = resortPrice;
    modal.show();
}

async function deleteResort(resortId) {
    const user = await waitForAuth();
    if (!user) {
        alert("Not signed in");
        return;
    }

    const token = await user.getIdToken(false);

    try {
        const res = await fetch(`${API_BASE}/resorts/${resortId}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            throw new Error(`Delete failed: ${res.status}`);
        }

        loadResorts();
    } catch (error) {
        console.error('Error deleting resort:', error);
        alert('Failed to delete resort');
    }
}

document.getElementById('saveEditResortBtn').addEventListener('click', async () => {
    const resortId = document.getElementById('editResortId').value;
    const resortName = document.getElementById('editResortName').value.trim();
    const resortPrice = parseFloat(document.getElementById('editResortPrice').value);

    if (!resortName || isNaN(resortPrice)) {
        alert('Please provide valid name and price');
        return;
    }

    const user = await waitForAuth();
    if (!user) {
        alert("Not signed in");
        return;
    }

    const token = await user.getIdToken(false);

    try {
        const res = await fetch(`${API_BASE}/resorts/${resortId}`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: resortName,
                price: resortPrice
            })
        });

        if (!res.ok) {
            throw new Error(`Update failed: ${res.status}`);
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('editResortModal'));
        modal.hide();
        loadResorts();
    } catch (error) {
        console.error('Error updating resort:', error);
        alert('Failed to update resort');
    }
});

loadResorts();