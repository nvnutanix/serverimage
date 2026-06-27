const overlay = document.getElementById("overlay");

const img = document.getElementById("img");

const modelSelect = document.getElementById("serverModel");

const templates = {
    template1: {
        image: "server_image1.png",
        json: "template1.json"
    },
    template2: {
        image: "server_image2.png",
        json: "template2.json"
    },
    template3: {
        image: "server_image3.png",
        json: "template3.json"
    },
    template4: {
        image: "server_image4.png",
        json: "template4.json"
    }
};

let currentTemplate = templates.template1;

let regions = [];





/* =========================

   SIZE FIX

========================= */



function syncSize() {

    if (!img || !overlay) return;



    overlay.style.width = img.clientWidth + "px";

    overlay.style.height = img.clientHeight + "px";

}



/* =========================

   STATUS COLORS

========================= */



function getColor(status) {

    if (status === "Supported") return "rgba(7, 214, 83, 0.4)";

    if (status === "Not Supported") return "rgba(197, 10, 10, 0.39)";

    if (status === "Need Info") return "rgba(214, 236, 13, 0.36)";

    if (status === "Missing") return "rgba(202, 39, 123, 0.46)";

    if (status === "To remain unused") return "rgba(235, 102, 8, 0.38)";

    return "rgba(59,130,246,0.15)";

}





/* =========================

   RENDER

========================= */



function render() {



    if (!img.complete) return;



    syncSize();



    const w = img.clientWidth;

    const h = img.clientHeight;



    overlay.innerHTML = "";



    regions.forEach(r => {



        const box = document.createElement("div");

        box.className = "region";



        box.style.left = (r.x * w) + "px";

        box.style.top = (r.y * h) + "px";

        box.style.width = (r.width * w) + "px";

        box.style.height = (r.height * h) + "px";



        box.style.backgroundColor = getColor(r.status);



        const label = document.createElement("div");

        label.className = "region-label";

        label.innerText = r.component;



        box.appendChild(label);



        /* =========================

           LEFT CLICK → STATUS CYCLE

        ========================= */



        box.onclick = (e) => {

            

            e.stopPropagation();



            if (r.status === "Supported") r.status = "Not Supported";

            else if (r.status === "Not Supported") r.status = "Missing";

            else if (r.status === "Missing") r.status = "Need Info";

            else if (r.status === "Need Info") r.status = "To remain unused";

            else r.status = "Supported";



            render();

            updateScore();

        };



        /* =========================

           RIGHT CLICK → COMMENT

        ========================= */



        box.oncontextmenu = (e) => {

            e.preventDefault();

        



            const input = prompt("Comment for " + r.component, r.comment || "");

            if (input !== null) {

                r.comment = input.trim();

            }

        };



        overlay.appendChild(box);

    });



    updateScore();

}



/* =========================

   LOAD TEMPLATE

========================= */



async function loadTemplate() {

    try {

        const res = await fetch(currentTemplate.json);

        if (!res.ok) {
            throw new Error(`Cannot load ${currentTemplate.json}`);
        }

        const data = await res.json();

        regions = data.map(r => ({
            component: r.component,
            x: parseFloat(r.x),
            y: parseFloat(r.y),
            width: parseFloat(r.width),
            height: parseFloat(r.height),
            status: r.status || "Supported",
            comment: r.comment || ""
        }));

        console.log("TEMPLATE LOADED:", currentTemplate.json, regions.length);

        render();

    } catch (err) {

        console.error("Template load failed:", err);

    }
}

async function changeTemplate(templateKey) {

    const template = templates[templateKey];

    if (!template) return;

    currentTemplate = template;

    // highlight selected button
    document.querySelectorAll(".template-btn").forEach(btn => {
        btn.classList.remove("active-template");
    });

    document.getElementById(templateKey).classList.add("active-template");

    // change image
    img.src = template.image;

    // wait image to load
    await new Promise(resolve => {
        img.onload = resolve;
    });

    syncSize();

    await loadTemplate();
}

/* =========================

   INIT

========================= */



async function init() {

    img.src = currentTemplate.image;

    await new Promise(resolve => {
        img.onload = resolve;
    });

    syncSize();

    document.getElementById("template1").classList.add("active-template");

    await loadTemplate();
}



img.onload = init;

window.addEventListener("resize", render);

setTimeout(init, 200);


function safeFileName(name) {
    return (name || "Unknown")
        .trim()
        .replace(/\s+/g, "_")      // razmaci -> underscore
        .replace(/[^a-zA-Z0-9_-]/g, ""); // ukloni specijalne karaktere
}


/* =========================

   PDF EXPORT (UNCHANGED)

========================= */



document.getElementById("exportPdf").onclick = async () => {



    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF("landscape", "pt", "a4");



    const pageW = pdf.internal.pageSize.getWidth();

    const pageH = pdf.internal.pageSize.getHeight();



    const model = modelSelect.value || "Unknown";



    /* HEADER */

    



    pdf.setFontSize(14);

    pdf.text(`Server model ${model} validation report`, 20, 25);



    pdf.setFontSize(11);

    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 40);



    /* =========================

       IMAGE FIRST (LARGER)

    ========================= */



    const canvas = await html2canvas(document.getElementById("wrap"), {

        scale: 2,

        backgroundColor: "#ffffff",

        useCORS: true

    });



    const imgData = canvas.toDataURL("image/png");



    const margin = 20;



    const maxImgWidth = pageW * 0.70;

    let imgW = maxImgWidth;

    let imgH = (canvas.height * imgW) / canvas.width;



    const maxImgHeight = pageH * 0.5;



    if (imgH > maxImgHeight) {

        imgH = maxImgHeight;

        imgW = (canvas.width * imgH) / canvas.height;

    }



    const imgX = (pageW - imgW) / 2;



    let y = 42;



    pdf.addImage(imgData, "PNG", imgX, y, imgW, imgH);



    y += imgH + 10;



    /* =========================

       TABLE BELOW IMAGE

    ========================= */



    const tableW = pageW - margin * 2;



    const col1 = tableW * 0.35;

    const col2 = tableW * 0.25;

    const col3 = tableW * 0.40;



    const x1 = margin;

    const x2 = x1 + col1;

    const x3 = x2 + col2;



    function statusColor(status) {

        if (status === "Supported") return "#22c55e";

        if (status === "Not Supported") return "#dd0808";

        if (status === "Need Info") return "#eff315";

        if (status === "Missing") return "#e22f8b";

        if (status === "To remain unused") return "#f97316";

        return "#757070";

    }



    function drawRow(comp, status, comment) {



        const lines = pdf.splitTextToSize(comment || "", col3 - 10);

        const lineHeight = 12;
        const rowH = Math.max(16, lines.length * lineHeight + 6);



        if (y > pageH - 40) {

            pdf.addPage();

            y = 40;

        }



        pdf.rect(x1, y - 10, col1, rowH);

        pdf.rect(x2, y - 10, col2, rowH);

        pdf.rect(x3, y - 10, col3, rowH);



        pdf.setFillColor(statusColor(status));

        pdf.circle(x1 + 5, y - 4, 2.5, "F");



        pdf.text(comp, x1 + 12, y);

        pdf.text(status, x2 + 5, y);

        pdf.text(lines, x3 + 5, y);



        y += rowH;

    }



    /* HEADER ROW */

    pdf.setFillColor(30, 58, 138);

    pdf.setTextColor(255, 255, 255);



    pdf.rect(x1, y - 12, col1 + col2 + col3, 16, "F");



    pdf.text("Component", x1 + 5, y);

    pdf.text("Status", x2 + 5, y);

    pdf.text("Comments", x3 + 5, y);



    y += 18;

    pdf.setTextColor(0, 0, 0);



    /* GROUPING */

    const grouped = {};



    regions.forEach(r => {



        const name = r.component.trim();

        const isStorage = name.toLowerCase().includes("storage drive");



        if (isStorage) {

            if (!grouped[name]) grouped[name] = { type: "disk", items: [] };

            grouped[name].items.push(r);

            return;

        }



        const key = name.replace(/\d+$/, "").trim();



        if (!grouped[key]) grouped[key] = { type: "group", items: [] };

        grouped[key].items.push(r);

    });



    Object.entries(grouped).forEach(([key, data]) => {



        if (data.type === "disk") {

            data.items.forEach((r, i) => {

                drawRow(`${key} ${i + 1}`, r.status, r.comment);

            });

            return;

        }



        let worst = "Supported";



        data.items.forEach(r => {

            if (r.status === "Not Supported") worst = "Not Supported";

            else if (r.status === "Missing") worst = "Missing";

            else if (r.status === "Need Info" && worst === "Supported") worst = "Need Info";

            else if (r.status === "To remain unused") worst = "To remain unused";

        });



        const mergedComments = data.items

            .map(r => r.comment)

            .filter(Boolean)

            .join(" | ");



        drawRow(key, worst, mergedComments);

    });



    const modelName = safeFileName(modelSelect.value);

    pdf.save(`${modelName}_report.pdf`);

};



/* =========================

   IMAGE EXPORT

========================= */



document.getElementById("exportImage").onclick = async () => {



    const canvas = await html2canvas(document.getElementById("wrap"), {

        scale: 2,

        backgroundColor: "#ffffff",

        useCORS: true

    });



    const link = document.createElement("a");

    link.href = canvas.toDataURL("image/png");

    const modelName = safeFileName(modelSelect.value);

    link.download = `${modelName}.png`;

    link.click();

};

document.getElementById("template1").onclick = () => changeTemplate("template1");
document.getElementById("template2").onclick = () => changeTemplate("template2");
document.getElementById("template3").onclick = () => changeTemplate("template3");
document.getElementById("template4").onclick = () => changeTemplate("template4");