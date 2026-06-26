const overlay = document.getElementById("overlay");
const img = document.getElementById("img");

const undoBtn = document.getElementById("undoBtn");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");

const container = document.getElementById("components");

/* FULL COMPONENT LIST */
const components = [
    "Chassis Backplane",
    "CPU",
    "DIMMs",
    "Storage Controller",
    "Storage Drives",
    "BOSS",
    "NIC1",
    "NIC2",
    "LOM",
    "GPU",
    "FC HBA"
];

let regions = [];
let history = [];

let drawing = false;
let startX = 0;
let startY = 0;
let box = null;

/* INIT SIDEBAR */
components.forEach(c => {
    const div = document.createElement("div");
    div.className = "comp";

    div.innerHTML = `
        <div>${c}</div>
        <select data-comp="${c}">
            <option>Supported</option>
            <option>Missing</option>
            <option>Not Supported</option>
            <option>Need Info</option>
        </select>
    `;

    container.appendChild(div);
});

/* COLOR LOGIC */
function color(status) {
    switch(status) {
        case "Supported": return "rgba(34,197,94,0.2)";
        case "Missing": return "rgba(239,68,68,0.3)";
        case "Not Supported": return "rgba(239,68,68,0.15)";
        case "Need Info": return "rgba(234,179,8,0.2)";
    }
}

/* FIX OVERLAY SIZE */
window.onload = () => {
    overlay.style.width = img.clientWidth + "px";
    overlay.style.height = img.clientHeight + "px";
};

/* DRAW START */
overlay.addEventListener("mousedown", e => {
    drawing = true;

    const rect = overlay.getBoundingClientRect();

    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    box = document.createElement("div");
    box.className = "region";

    overlay.appendChild(box);
});

/* DRAW MOVE */
overlay.addEventListener("mousemove", e => {
    if (!drawing) return;

    const rect = overlay.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const w = x - startX;
    const h = y - startY;

    box.style.left = (w < 0 ? x : startX) + "px";
    box.style.top = (h < 0 ? y : startY) + "px";
    box.style.width = Math.abs(w) + "px";
    box.style.height = Math.abs(h) + "px";
});

/* DRAW END */
overlay.addEventListener("mouseup", () => {
    drawing = false;

    const comp = prompt("Component name?");
    if (!comp) {
        box.remove();
        return;
    }

    const region = {
        id: Date.now(),
        component: comp,
        status: "Supported",
        el: box
    };

    regions.push(region);
    history.push(region);

    const label = document.createElement("div");
    label.className = "region-label";
    label.textContent = comp;

    box.appendChild(label);

    enableDrag(region);

    box = null;
});

/* DRAG */
function enableDrag(r) {
    r.el.addEventListener("mousedown", e => {
        e.stopPropagation();

        const rect = r.el.getBoundingClientRect();
        const parent = overlay.getBoundingClientRect();

        const dx = e.clientX - rect.left;
        const dy = e.clientY - rect.top;

        function move(ev) {
            r.el.style.left = (ev.clientX - parent.left - dx) + "px";
            r.el.style.top = (ev.clientY - parent.top - dy) + "px";
        }

        function up() {
            document.removeEventListener("mousemove", move);
        }

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
    });
}

/* STATUS CHANGE */
document.addEventListener("change", e => {
    if (e.target.tagName !== "SELECT") return;

    const comp = e.target.dataset.comp;
    const status = e.target.value;

    regions.forEach(r => {
        if (r.component === comp) {
            r.status = status;
            r.el.style.background = color(status);
        }
    });
});

/* UNDO */
undoBtn.onclick = () => {
    const last = history.pop();
    if (!last) return;

    last.el.remove();
    regions = regions.filter(r => r.id !== last.id);
};

/* SAVE */
saveBtn.onclick = () => {
    localStorage.setItem("server_tool", JSON.stringify(regions));
};

/* LOAD (AUTO) */
window.onload = () => {
    const data = JSON.parse(localStorage.getItem("server_tool") || "[]");

    data.forEach(r => {
        const box = document.createElement("div");
        box.className = "region";
        box.style.left = r.x + "px";
        box.style.top = r.y + "px";
        box.style.width = r.width + "px";
        box.style.height = r.height + "px";

        overlay.appendChild(box);
    });
};

/* CLEAR */
clearBtn.onclick = () => {
    localStorage.removeItem("server_tool");
    location.reload();
};