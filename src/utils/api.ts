const API_URL = import.meta.env.VITE_API_URL

export async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Version': '1',
            ...(options.headers || {}),
        },
    })

    if (response.status === 401 && retry) {
        const refreshed = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        })
        if (refreshed.ok) {
            return request<T>(path, options, false)}
        else {
            throw new Error("SESSION_EXPIRED")
        }
    }

    if (!response.ok) {
        const payload = await response.json().catch(() => null)

        const message = payload?.message || 'Request failed'
        if (message === 'SESSION_EXPIRED') {
            logout()
            return Promise.reject(new Error('SESSION_EXPIRED'))
        }
        throw new Error(message)
    }

    return response.json()
}

export function formatDate(value: string) {
    if (!value) return 'Never'
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}

export function percent(value: number) {
    return `${Math.round(value * 100)}%`
}

function logout() {
    window.location.replace('/login')
}