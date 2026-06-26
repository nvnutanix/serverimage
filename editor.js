const overlay = document.getElementById("overlay");
const img = document.getElementById("img");

let drawing = false;
let startX, startY;
let box;

let regions = [];

/* resize */
function resizeOverlay() {
    overlay.style.width = img.clientWidth + "px";
    overlay.style.height = img.clientHeight + "px";
}

window.onload = resizeOverlay;
window.onresize = resizeOverlay;

/* DRAW */
overlay.addEventListener("mousedown", e => {
    drawing = true;

    const r = overlay.getBoundingClientRect();

    startX = e.clientX - r.left;
    startY = e.clientY - r.top;

    box = document.createElement("div");
    box.className = "region";

    overlay.appendChild(box);
});

overlay.addEventListener("mousemove", e => {
    if (!drawing) return;

    const r = overlay.getBoundingClientRect();

    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    box.style.left = Math.min(x, startX) + "px";
    box.style.top = Math.min(y, startY) + "px";
    box.style.width = Math.abs(x - startX) + "px";
    box.style.height = Math.abs(y - startY) + "px";
});

overlay.addEventListener("mouseup", () => {
    drawing = false;

    const comp = document.getElementById("component").value;

    const data = {
    component: comp,

    // store normalized coordinates (0-1)
    x: box.offsetLeft / overlay.clientWidth,
    y: box.offsetTop / overlay.clientHeight,

    width: box.offsetWidth / overlay.clientWidth,
    height: box.offsetHeight / overlay.clientHeight,

    status: "Supported"
};

    const label = document.createElement("div");
    label.className = "region-label";
    label.innerText = comp;

    box.appendChild(label);

    regions.push(data);

    box = null;
});

/* EXPORT TEMPLATE */
document.getElementById("save").onclick = () => {

    const blob = new Blob(
        [JSON.stringify(regions, null, 2)],
        { type: "application/json" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "template.json";
    a.click();
};