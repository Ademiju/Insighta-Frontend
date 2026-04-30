import { Outlet, useNavigate } from 'react-router-dom'

export default function AppLayout({ user, logout }: any) {
    const navigate = useNavigate()

    return (
        <main className="app-shell">
            <aside className="sidebar">
                <div className="brand">
                    <span className="brand-mark">I</span>
                    <div>
                        <strong>Insighta Labs+</strong>
                        <small>{user.role}</small>
                    </div>
                </div>

                <nav>
                    <button onClick={() => navigate('/dashboard')}>dashboard</button>
                    <button onClick={() => navigate('/profiles')}>profiles</button>
                    <button onClick={() => navigate('/search')}>search</button>
                    <button onClick={() => navigate('/account')}>account</button>
                </nav>

                <button className="ghost-action" onClick={logout}>Logout</button>
            </aside>
            <section className="workspace">
                {/* ✅ pass user */}
                <Outlet context={{ user }} />
            </section>
        </main>
    )
}