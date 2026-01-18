/* service-worker.js */
const CACHE_NAME = "taller-walteruriol-v1";

/**
 * Ajusta esta lista si cambian nombres/rutas.
 * Si algún archivo no existe, no rompe: se ignora en instalación.
 */
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",

  // ICONOS PWA
  "/icons/icon-192.png",
  "/icons/icon-512.png",

  // IMÁGENES
  "/img/portada_celular.png",
  "/img/portada_pc.png",
  "/img/scanner.png",
  "/img/logo.png",

  // HTML (agrega/quita según tu proyecto)
  "/aceite.html",
  "/aceite_index.html",
  "/aceite_nuevo.html",
  "/aceite_paso1.html",
  "/aceite_paso2.html",
  "/aceite_paso3.html",
  "/aceite_paso4.html",
  "/aceite_paso5.html",
  "/aceite_paso6.html",
  "/aceite_buscar.html",
  "/aceite_detalle.html",
  "/aceite_publico.html",
  "/aceite_recordatorios.html",
  "/aceite_cierre.html",

  "/agregar.html",
  "/editar.html",
  "/buscar.html",
  "/estado.html",

  // Si tienes estas vistas en el proyecto de aceites/trabajadores
  "/gestion_aceite_trabajadores.html",
  "/gestion_autos_trabajador.html",
  "/buscar_aplicacion_trabajadores.html",
  "/buscar_informes.html",
  "/gestion_informes.html",
  "/informes.html",
  "/tarjeta-virtual.html",
  "/orden_llegada.html",
  "/panel_llegada.html"
];

// -------- INSTALL: precache
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // cache.addAll falla si falta 1 archivo. Aquí lo hacemos “a prueba de faltantes”.
      await Promise.allSettled(
        ASSETS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-cache" });
            if (res.ok) await cache.put(url, res);
          } catch (_) {}
        })
      );

      self.skipWaiting();
    })()
  );
});

// -------- ACTIVATE: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
      self.clients.claim();
    })()
  );
});

// -------- FETCH: cache-first for static, network-first for navigations
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Solo mismo origen
  if (url.origin !== location.origin) return;

  // Navegación (abrir HTML): network-first, fallback a cache y luego a index.html
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
          return fresh;
        } catch (e) {
          const cached = await caches.match(req);
          return cached || (await caches.match("/index.html")) || Response.error();
        }
      })()
    );
    return;
  }

  // Archivos estáticos: cache-first
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        return cached || Response.error();
      }
    })()
  );
});
