/**
 * MAIN CONTROLLER - Luxury Doors
 * Gestisce il ciclo di vita dell'applicazione, il recupero dati
 * e la barra di caricamento globale con clearing cache all'ingresso.
 */
document.addEventListener("DOMContentLoaded", async () => {
    // ============================================================
    // 0. GLOBAL LOADING BAR + CLEARING CACHE (ingresso sito)
    // ============================================================
    const globalLoader = document.getElementById("global-loader");
    const progressFill = document.getElementById("progress-fill");
    const loaderPercent = document.getElementById("loader-percent");
    const loaderStatus = document.getElementById("loader-status");

    function setProgress(pct, status) {
        if (progressFill) progressFill.style.width = pct + "%";
        if (loaderPercent) loaderPercent.textContent = pct + "%";
        if (loaderStatus && status) loaderStatus.textContent = status;
    }

    async function clearAllCaches() {
        setProgress(10, "Pulizia cache...");
        // Cache API (service worker)
        if ("caches" in window) {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            } catch (e) {
                console.warn("[Main] Impossibile svuotare Cache API:", e);
            }
        }
        // Web storage
        try {
            sessionStorage.clear();
            localStorage.clear();
        } catch (e) {
            console.warn("[Main] Impossibile svuotare web storage:", e);
        }
        setProgress(30, "Cache svuotata.");
    }

    // Avvio clearing cache e mostra barra
    if (globalLoader) globalLoader.classList.remove("hidden");
    document.body.classList.add("loading");
    await clearAllCaches();

    // URL unificato per Google Drive (GET)
    const googleDriveApiUrl = "https://script.google.com/macros/s/AKfycbwGBlkpRAz2PD4pWrDwzY8TPDw25TsDCnPerlpAV13y3dRth1TmQFus3JxrPf7i7MbDeQ/exec";

    // ============================================================
    // 1. PRE-LOADER (Fix FOUC per la sezione Card)
    // ============================================================
    // Accendiamo immediatamente il loader del Catalogo prima di fare la chiamata
    const catalogLoader = document.getElementById("catalogLoader");
    if (catalogLoader) {
        catalogLoader.style.display = "flex";

        // Opzionale: cambiamo il testo per far capire che stiamo scaricando i dati
        const loaderText = catalogLoader.querySelector('.divine-loader__text');
        if (loaderText) loaderText.textContent = "CONNESSIONE AL DRIVE...";
    }
    setProgress(50, "Connessione al Drive...");

    // ============================================================
    // 2. INIZIALIZZAZIONE UTILITY UI (Immediate)
    // ============================================================
    if (typeof CursorManager !== 'undefined') CursorManager.init();
    if (typeof NavbarController !== 'undefined') NavbarController.init();
    if (typeof AnimationObserver !== 'undefined') AnimationObserver.init();

    // ============================================================
    // 3. RECUPERO DATI ASINCRONO (Come un AssetBundle in Unity)
    // ============================================================
    try {
        console.log("[Main] Recupero catalogo da Google Drive...");
        const response = await fetch(googleDriveApiUrl);
        
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        const driveData = await response.json();
        if (driveData && typeof driveData === 'object' && Object.keys(driveData).length > 0) {
            window.galleryData = driveData;
            console.log("[Main] Dati ricevuti con successo.");
        } else {
            console.warn("[Main] Dati Drive vuoti o non validi, mantengo i dati locali.");
        }

    } catch (error) {
        console.error("Errore critico Drive:", error);
        // Fallback in caso di assenza di rete
        window.galleryData = window.galleryData || {};
    }

    // ============================================================
    // 4. INIZIALIZZAZIONE MANAGER (Dipendenti dai Dati)
    // ============================================================
    // Questi script si occuperanno di spegnere i Loader ora che i dati ci sono
    if (typeof Lightbox !== 'undefined') Lightbox.init();
    if (typeof WorksManager !== 'undefined') WorksManager.init();
    if (typeof CatalogManager !== 'undefined') CatalogManager.init(); 
    if (typeof MenuGalleriaManager !== 'undefined') MenuGalleriaManager.init();
    
    // Fallback: se MenuCatalogoManager non si è inizializzato da solo, lo forziamo
    if (typeof MenuCatalogoManager !== 'undefined' && !document.querySelector('.nav__dropdown--cascading:not(.nav__dropdown--loader-state)')) {
        MenuCatalogoManager.init();
    }
    
    if (typeof FormManager !== 'undefined') FormManager.init();

    // ============================================================
    // 5. CHIUSURA BARRA DI CARICAMENTO GLOBALE
    // ============================================================
    setProgress(100, "Caricamento completato.");
    setTimeout(() => {
        if (globalLoader) globalLoader.classList.add("hidden");
        document.body.classList.remove("loading");
    }, 600);
});
