// const API_BASE = "http://127.0.0.1:8000";
const API_BASE = "http://sport_counter";

async function loadResorts() {
    const res = await fetch(`${API_BASE}/resorts`);
    const resorts = await res.json();

    const dropdown = document.getElementById("resort");
    dropdown.innerHTML = "";
    resorts.forEach(resort => {
        const option = document.createElement("option");
        option.textContent = `${resort.name.charAt(0).toUpperCase() + resort.name.slice(1)} - ${resort.price} €`;
        option.value = `${resort.name}`;
        dropdown.appendChild(option);
    });
}

async function updateState() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Not signed in");
        return;
    }
    document.getElementById("username").value = user.displayName;

    const token = await user.getIdToken(/* forceRefresh */ false);
    const email = encodeURIComponent(user.email);

    const res = await fetch(`${API_BASE}/state/${email}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const data = await res.json();
    document.getElementById("counter").innerText = data.counter;
    document.getElementById("spent").innerText = Number(data.total_spent).toFixed(2);
    document.getElementById("saved").innerText = Number(data.total_saved).toFixed(2);
} 

document.getElementById("addBtn").addEventListener("click", async () => {
    const user = firebase.auth().currentUser;
        if (!user) {
        alert("Not signed in");
        return;
    }

    const token = await user.getIdToken(/* forceRefresh */ false);
    const email = encodeURIComponent(user.email);
    const resort = document.getElementById("resort").value;

    const res = await fetch(`${API_BASE}/state/${email}/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ resort_name: resort })
    });
    
    const data = await res.json();
    document.getElementById("counter").innerText = data.counter;
    document.getElementById("spent").innerText = Number(data.total_spent).toFixed(2);
    document.getElementById("saved").innerText = Number(data.total_saved).toFixed(2);
});


firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        // show app UI
        document.getElementById("loginDiv").style.display = "none";
        document.getElementById("appDiv").style.display = "block";
        // user is signed in — load data and update UI
        await loadResorts();
        await updateState();
    } else {
        // user signed out — clear UI or show login prompt
        document.getElementById("loginDiv").style.display = "block";
        document.getElementById("appDiv").style.display = "none";
    }
});