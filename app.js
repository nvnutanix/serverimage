const overlay = document.getElementById("overlay");

const img = document.getElementById("img");

const modelSelect = document.getElementById("serverModel");



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

    if (status === "Supported") return "rgba(34,197,94,0.25)";

    if (status === "Not Supported") return "rgba(239,68,68,0.25)";

    if (status === "Need Info") return "rgba(250,204,21,0.25)";

    if (status === "Missing") return "rgba(244,114,182,0.25)";

    if (status === "To remain unused") return "rgba(249,115,22,0.25)";

    return "rgba(59,130,246,0.15)";

}



/* =========================

   COMPLIANCE (START 100%)

========================= */



function computeCompliance() {



    let score = 100;



    for (const r of regions) {



        switch (r.status) {



            case "Supported":

                break;



            case "Need Info":

                score -= 0;

                break;



            case "Missing":

                score -= 25;

                break;



            case "Not Supported":

                score -= 50;

                break;



            case "To remain unused":

                score -= 0;

                break;

        }

    }



    if (score < 0) score = 0;

    if (score > 100) score = 100;



    return score;

}



function updateScore() {

    const el = document.getElementById("score");

    if (!el) return;



    el.innerText = `Compliance: ${computeCompliance()}%`;

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

            if (locked) return;

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

            if (locked) return;



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

        const res = await fetch("template.json");

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



        console.log("TEMPLATE LOADED:", regions.length);



        render();



    } catch (err) {

        console.error("Template load failed", err);

    }

}



/* =========================

   INIT

========================= */



function init() {

    syncSize();

    loadTemplate();

}



img.onload = init;

window.addEventListener("resize", render);

setTimeout(init, 200);






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

    const compliance = computeCompliance();



    pdf.setFontSize(16);

    pdf.text(`Server model ${model} validation report`, 20, 25);



    /* 🔥 NEW: compliance under title */

    pdf.setFontSize(12);

    pdf.text(`Compliance: ${compliance}%`, 20, 35);



    pdf.setFontSize(11);

    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);



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



    const maxImgWidth = pageW - margin * 2;

    let imgW = maxImgWidth;

    let imgH = (canvas.height * imgW) / canvas.width;



    const maxImgHeight = pageH * 0.50;



    if (imgH > maxImgHeight) {

        imgH = maxImgHeight;

        imgW = (canvas.width * imgH) / canvas.height;

    }



    const imgX = (pageW - imgW) / 2;



    let y = 50;



    pdf.addImage(imgData, "PNG", imgX, y, imgW, imgH);



    y += imgH + 25;



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

        if (status === "Not Supported") return "#ef4444";

        if (status === "Need Info") return "#facc15";

        if (status === "Missing") return "#f472b6";

        if (status === "To remain unused") return "#f97316";

        return "#757070";

    }



    function drawRow(comp, status, comment) {



        const lines = pdf.splitTextToSize(comment || "", col3 - 10);

        const rowH = 16;



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



    pdf.save("server-validation-report.pdf");

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

    link.download = "server-validation-image.png";

    link.click();

};
