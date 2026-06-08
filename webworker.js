const version = "0.2.1";
const cacheVersion = "v3";
const cacheName = `helper-${cacheVersion}`;

const precachedResources = ["/", "/helper.html", "/css/css.css", "/css/fonts.css", "/js/helper.js", "/js/helper-api.js", "/js/helper-db.js", "/js/utils.js", "/assets/font/Montserrat.woff2", "/assets/font/MaterialIcons-Round.woff2"];

const networkFirstCached = ["/webworker.js"];
const cached = [".html", ".css", ".png", ".woff2"];

self.addEventListener("activate", (event) => {
    event.waitUntil(deleteOldCaches());
});

self.addEventListener("install", (event) => {
    event.waitUntil(
        addResourcesToCache(precachedResources),
    );
});

self.addEventListener("fetch", (event) => {
    // Only intercept GET requests for caching; let all other methods pass through
    if (event.request.method !== "GET") {
        return; // Let the browser handle non-GET requests normally
    }
    event.respondWith(
        cache(event.request.url).catch(error => {
            console.error("Cache error for", event.request.url, error);
            return new Response("Offline", {status: 503});
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data == 'deleteCache') {
        caches.delete(cacheName);
    }
});

const addResourcesToCache = async (resources) => {
    const cache = await caches.open(cacheName);
    for (const resource of resources) {
        try {
            const response = await fetch(resource);
            if (response.ok) {
                await cache.put(resource, response.clone());
            } else {
                console.error(`Failed to fetch ${resource}: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error fetching ${resource}:`, error);
        }
    }
};

const putInCache = async (request, response) => {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
};


async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            putInCache(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response("Network error happened", {status: 408, headers: { "Content-Type": "text/plain" }});
    }
}

async function cacheFirstWithRefresh(request) {
    try {
        const fetchResponsePromise = fetch(request).then(async (networkResponse) => {
            if (networkResponse.ok) {
                await putInCache(request, networkResponse.clone());
            }
            return networkResponse;
        });

        return (await caches.match(request)) || (await fetchResponsePromise);
    } catch (error) {
        return (await caches.match(request)) || new Response("Network error happened", {status: 408, headers: { "Content-Type": "text/plain" }});
    }
}

async function cache(request) {
    console.log("Cache event for:", request);
    if (networkFirstCached.some(sub => request.includes(sub))) {
        return await networkFirst(request);
    } else if (cached.some(sub => request.includes(sub))) {
        return await cacheFirstWithRefresh(request);
    } else {
        try {
            console.log("Fetching from network:", request);
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                return networkResponse;
            } else {
                // For non-ok responses, try cache first, otherwise return response
                const cachedResponse = await caches.match(request);
                return cachedResponse || networkResponse;
            }
        } catch (error) {
            console.error("Network fetch failed for:", request, error);
            // Try to return cached version if available
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
            // If no cache available, don't throw error, let browser handle it
            throw error;
        }
    }
}


const deleteCache = async (key) => {
    await caches.delete(key);
};

const deleteOldCaches = async () => {
    const cacheKeepList = [cacheName];
    const keyList = await caches.keys();
    console.log("Cache keys:", keyList);
    const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
    await Promise.all(cachesToDelete.map(deleteCache));
};