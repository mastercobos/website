// lang.js — utilidad compartida de cambio de idioma
// Uso: definir window.PAGE_TRANSLATIONS = { es: {...}, en: {...} } antes de cargar este script
// o llamar a initLang(translations) manualmente.

function initLang(translations) {
    function switchLang(lang) {
        const t = translations[lang];
        if (!t) return;
        document.documentElement.lang = t.htmlLang || lang;
        if (t.pageTitle) document.title = t.pageTitle;
        localStorage.setItem("lang", lang);

        Object.keys(t).forEach(id => {
            if (["htmlLang", "pageTitle"].includes(id)) return;
            if (id === "cvLink") {
                const el = document.getElementById("cv");
                if (el) el.href = t[id];
                return;
            }
            const el = document.getElementById(id);
            if (el) el.innerHTML = t[id];
        });
    }

    const saved = localStorage.getItem("lang") || "es";
    switchLang(saved);

    const btnEs = document.getElementById("btn-es");
    const btnEn = document.getElementById("btn-en");
    if (btnEs) btnEs.addEventListener("click", () => switchLang("es"));
    if (btnEn) btnEn.addEventListener("click", () => switchLang("en"));
}

document.addEventListener("DOMContentLoaded", () => {
    if (window.PAGE_TRANSLATIONS) initLang(window.PAGE_TRANSLATIONS);
});
