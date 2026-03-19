// lang.js — utilidad compartida de cambio de idioma
// Lee el idioma de: 1) ?lang= en la URL, 2) localStorage, 3) "es" por defecto.
// Inyecta ?lang= en todos los links internos para que la preferencia se propague.

function initLang(translations) {
    // 1. Determinar idioma activo
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    const activeLang = (urlLang && translations[urlLang]) ? urlLang
                     : (localStorage.getItem("lang") || "es");

    function applyLang(lang) {
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

        // Inyectar ?lang= en todos los links internos (excluye externos y mailto)
        document.querySelectorAll("a[href]").forEach(a => {
            const href = a.getAttribute("href");
            if (!href || href.startsWith("http") || href.startsWith("mailto") || href.startsWith("#")) return;
            try {
                const url = new URL(href, window.location.href);
                url.searchParams.set("lang", lang);
                a.href = url.pathname + "?" + url.searchParams.toString();
            } catch(e) {}
        });
    }

    applyLang(activeLang);

    const btnEs = document.getElementById("btn-es");
    const btnEn = document.getElementById("btn-en");
    if (btnEs) btnEs.addEventListener("click", () => applyLang("es"));
    if (btnEn) btnEn.addEventListener("click", () => applyLang("en"));
}

document.addEventListener("DOMContentLoaded", () => {
    if (window.PAGE_TRANSLATIONS) initLang(window.PAGE_TRANSLATIONS);
});
