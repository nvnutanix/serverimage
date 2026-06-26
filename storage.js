function save() {
    localStorage.setItem("regions", JSON.stringify(regions));
}

function load() {
    return JSON.parse(localStorage.getItem("regions") || "[]");
}
