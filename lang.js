// lang.js — utilidad compartida de cambio de idioma
// El HTML de cada página es la versión en español; PAGE_TRANSLATIONS solo contiene los demás idiomas.
// Lee el idioma de: 1) ?lang= en la URL, 2) localStorage, 3) idioma del navegador, 4) "es" por defecto.
// Inyecta ?lang= en todos los links internos para que la preferencia se propague.

const BASE_LANG = "es";
const SPECIAL_KEYS = ["htmlLang", "pageTitle", "metaDescription", "cvLink", "attrs"];

function readStoredLang() {
    try { return localStorage.getItem("lang"); } catch(e) { return null; }
}

function storeLang(lang) {
    try { localStorage.setItem("lang", lang); } catch(e) {}
}

// Guarda el contenido original de la página para poder volver al español
function captureBaseLang(translations) {
    const metaDescription = document.querySelector('meta[name="description"]');
    const cv = document.getElementById("cv");
    const base = {
        htmlLang: document.documentElement.lang,
        pageTitle: document.title,
        metaDescription: metaDescription ? metaDescription.content : "",
        attrs: {},
    };
    if (cv) base.cvLink = cv.getAttribute("href");

    Object.values(translations).forEach(t => {
        Object.keys(t).forEach(id => {
            if (SPECIAL_KEYS.includes(id)) return;
            const el = document.getElementById(id);
            if (el) base[id] = el.innerHTML;
        });
        Object.entries(t.attrs || {}).forEach(([id, attrs]) => {
            const el = document.getElementById(id);
            if (!el) return;
            base.attrs[id] = {};
            Object.keys(attrs).forEach(attr => { base.attrs[id][attr] = el.getAttribute(attr); });
        });
    });
    return base;
}

function initLang(pageTranslations) {
    const translations = { ...pageTranslations, [BASE_LANG]: captureBaseLang(pageTranslations) };
    const isAvailable = lang => Boolean(lang) && Object.hasOwn(translations, lang);

    // 1. Determinar idioma activo. Al volver atrás manda la última elección, no la URL antigua.
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    const browserLang = (navigator.language || "").slice(0, 2);
    const navigation = performance.getEntriesByType("navigation")[0];
    const isBackForward = navigation && navigation.type === "back_forward";
    const candidates = isBackForward
        ? [readStoredLang(), urlLang, browserLang]
        : [urlLang, readStoredLang(), browserLang];
    const activeLang = candidates.find(isAvailable) || BASE_LANG;

    function updateCanonical(lang) {
        const canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) return;
        const url = new URL(canonical.href);
        url.search = new URLSearchParams(window.location.search).has("lang") ? "?lang=" + lang : "";
        canonical.href = url.toString();
    }

    function applyLang(lang) {
        const t = translations[lang];
        document.documentElement.lang = t.htmlLang || lang;
        if (t.pageTitle) document.title = t.pageTitle;
        storeLang(lang);

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && t.metaDescription) metaDescription.content = t.metaDescription;

        Object.keys(t).forEach(id => {
            if (SPECIAL_KEYS.includes(id)) return;
            const el = document.getElementById(id);
            if (el) el.innerHTML = t[id];
        });

        Object.entries(t.attrs || {}).forEach(([id, attrs]) => {
            const el = document.getElementById(id);
            if (!el) return;
            Object.entries(attrs).forEach(([attr, value]) => el.setAttribute(attr, value));
        });

        const cv = document.getElementById("cv");
        if (cv && t.cvLink) cv.href = t.cvLink;

        // Inyectar ?lang= en todos los links internos (excluye externos, mailto y anclas)
        document.querySelectorAll("a[href]").forEach(a => {
            const href = a.getAttribute("href");
            if (!href || href.startsWith("http") || href.startsWith("mailto") || href.startsWith("#")) return;
            try {
                const url = new URL(href, window.location.href);
                url.searchParams.set("lang", lang);
                a.href = url.pathname + "?" + url.searchParams.toString();
            } catch(e) {}
        });

        Object.keys(translations).forEach(code => {
            const btn = document.getElementById("btn-" + code);
            if (btn) btn.setAttribute("aria-pressed", String(code === lang));
        });

        updateCanonical(lang);
    }

    applyLang(activeLang);

    Object.keys(translations).forEach(lang => {
        const btn = document.getElementById("btn-" + lang);
        if (!btn) return;
        btn.addEventListener("click", () => {
            // La URL refleja la elección para que recargar no devuelva el idioma anterior
            const url = new URL(window.location.href);
            url.searchParams.set("lang", lang);
            history.replaceState(null, "", url);
            applyLang(lang);
        });
    });

    // Página restaurada desde la caché al volver atrás
    window.addEventListener("pageshow", event => {
        const stored = readStoredLang();
        if (event.persisted && isAvailable(stored)) applyLang(stored);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (window.PAGE_TRANSLATIONS) initLang(window.PAGE_TRANSLATIONS);
});
