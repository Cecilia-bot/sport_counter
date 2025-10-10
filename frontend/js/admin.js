const API_BASE = "http://127.0.0.1:8000";

async function loadResorts() {
    const res = await fetch(`${API_BASE}/resorts`);
    const resorts = await res.json();

    const list = document.getElementById("resortList");
    list.innerHTML = "";
    resorts.forEach(resort => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = `${resort.name.charAt(0).toUpperCase()} - ${resort.price} €`;
        list.appendChild(li);
    });
}

document.getElementById("addResortBtn").addEventListener("click", async () => {
    const name = document.getElementById("new_resort_name").value.trim();
    const price = parseFloat(document.getElementById("new_resort_price").value);
    if (!name || isNaN(price)) {
        alert("Please provide a valid name and price.");
        return;
    }

    await fetch(`${API_BASE}/resorts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price })
    });

    document.getElementById("new_resort_name").value = "";
    document.getElementById("new_resort_price").value = "";

    loadResorts();
});

loadResorts();