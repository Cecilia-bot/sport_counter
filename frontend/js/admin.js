// const API_BASE = "http://127.0.0.1:8000";
const API_BASE = "https://sportcounter-backend.up.railway.app";

async function loadResorts() {
    const res = await fetch(`${API_BASE}/resorts`);
    const resorts = await res.json();

    const list = document.getElementById("resortList");
    list.innerHTML = "";
    resorts.forEach(resort => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = `${resort.name.charAt(0).toUpperCase() + resort.name.slice(1)} - ${resort.price} €`;
        list.appendChild(li);
    });
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

    // Try to extract filename from Content-Disposition header
    const date = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(date)
    .replace(/[^\d]/g, ''); // remove non-digits
    const currentDate = formattedDate.slice(0, 8) + "_" + formattedDate.slice(8);
    a.download = "backup_app_" + currentDate + ".db"

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

loadResorts();