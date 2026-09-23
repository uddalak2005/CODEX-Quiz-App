const BACKENDS = (import.meta.env.VITE_BACKENDS || "")
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);

const BACKEND_KEY = "quizBackend";

export function getBackend() {
    const current = sessionStorage.getItem(BACKEND_KEY);

    if (current && BACKENDS.includes(current)) {
        return current;
    }

    const next = BACKENDS[Math.floor(Math.random() * BACKENDS.length)] || "";
    if (next) {
        sessionStorage.setItem(BACKEND_KEY, next);
    }

    return next;
}

export function markBackendFailure(failedBackend) {
    const current = sessionStorage.getItem(BACKEND_KEY);
    if (!current || !BACKENDS.length) return null;

    const remaining = BACKENDS.filter((backend) => backend !== failedBackend);
    const fallback = remaining[0] || BACKENDS[0];

    if (fallback) {
        sessionStorage.setItem(BACKEND_KEY, fallback);
    }

    return fallback;
}

export function getBackends() {
    return [...BACKENDS];
}

export async function requestWithFallback(requestFn, options = {}) {
    const maxAttempts = options.maxAttempts || BACKENDS.length || 1;
    const timeoutMs = options.timeoutMs || 8000;

    let lastError = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const backend = getBackend();

        try {
            const result = await Promise.race([
                requestFn(backend),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("Backend request timed out")), timeoutMs);
                })
            ]);

            return result;
        } catch (error) {
            lastError = error;
            markBackendFailure(backend);
        }
    }

    throw lastError || new Error("All backend instances failed");
}