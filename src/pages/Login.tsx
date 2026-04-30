const API_URL = import.meta.env.VITE_API_URL

export default function Login() {
    const login = () => {
        window.location.href = `${API_URL}/auth/github`
    }

    return (
        <main className="auth-shell">
            <section className="login-panel">
                <div>
                    <p className="eyebrow">Insighta Labs+</p>
                    <h1>Secure profile intelligence</h1>
                    <p className="login-copy">
                        Access is restricted to authenticated Insighta users.
                    </p>
                </div>

                <button className="primary-action" onClick={login}>
                    Continue with GitHub
                </button>
            </section>
        </main>
    )
}