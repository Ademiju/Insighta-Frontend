import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type View = 'dashboard' | 'profiles' | 'search' | 'account'
type Role = 'admin' | 'analyst'

type User = {
  id: string
  username: string
  email: string
  avatar_url: string
  role: Role
  is_active: boolean
  last_login_at: string
  created_at: string
}

type Profile = {
  id: string
  name: string
  gender: string
  gender_probability: number
  age: number
  age_group: string
  country_id: string
  country_name: string
  country_probability: number
  created_at: string
}

type PageResponse = {
  status: 'success'
  page: number
  limit: number
  total: number
  total_pages: number
  links?: { self: string; next: string | null; prev: string | null }
  data: Profile[]
}

type Filters = {
  gender: string
  country_id: string
  age_group: string
  min_age: string
  max_age: string
  sort_by: string
  order: string
  page: number
  limit: number
}

const API_URL = import.meta.env.production.VITE_API_URL
const initialFilters: Filters = {
  gender: '',
  country_id: '',
  age_group: '',
  min_age: '',
  max_age: '',
  sort_by: 'created_at',
  order: 'desc',
  page: 1,
  limit: 10,
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
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
      headers: { 'Content-Type': 'application/json' },
    })
    if (refreshed.ok) return request<T>(path, options, false)
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.message || `Request failed with ${response.status}`)
  }

  return response.json()
}

function paramsFromFilters(filters: Filters) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) params.set(key, String(value))
  })
  return params.toString()
}

function formatDate(value: string) {
  if (!value) return 'Never'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function percent(value: number) {
  if (value === undefined || value === null) return ''
  return `${Math.round(value * 100)}%`
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [view, setView] = useState<View>('dashboard')
  const [profiles, setProfiles] = useState<PageResponse | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PageResponse | null>(null)
  const [createName, setCreateName] = useState('')
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const isAdmin = user?.role === 'admin'

  async function loadMe() {
    setLoading(true)
    setError('')
    try {
      const res = await request<{ status: string; data: User }>('/auth/me')
      setUser(res.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function loadProfiles(nextFilters = filters) {
    setLoading(true)
    setError('')
    try {
      const res = await request<PageResponse>(`/api/profiles?${paramsFromFilters(nextFilters)}`)
      setProfiles(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load profiles')
    } finally {
      setLoading(false)
    }
  }

  async function loadProfile(id: string) {
    setLoading(true)
    setError('')
    try {
      const res = await request<{ status: string; data: Profile }>(`/api/profiles/${id}`)
      setSelectedProfile(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function runSearch(nextPage = 1) {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ q: query, page: String(nextPage), limit: '10' })
      const res = await request<PageResponse>(`/api/profiles/search?${params.toString()}`)
      setSearchResults(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  async function createProfile(event: FormEvent) {
    event.preventDefault()
    if (!createName.trim()) return
    setLoading(true)
    setError('')
    setNotice('')
    try {
      await request('/api/profiles', {
        method: 'POST',
        body: JSON.stringify({ name: createName.trim() }),
      })
      setCreateName('')
      setNotice('Profile created')
      await loadProfiles({ ...filters, page: 1 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create profile')
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
    setUser(null)
    setProfiles(null)
    setSelectedProfile(null)
    setSearchResults(null)
    setView('dashboard')
  }

  function login() {
    window.location.href = `${API_URL}/auth/github`
  }

  function updateFilters(patch: Partial<Filters>) {
    const next = { ...filters, ...patch, page: patch.page ?? 1 }
    setFilters(next)
    void loadProfiles(next)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMe()
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) void loadProfiles()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const metrics = useMemo(() => {
    const rows = profiles?.data || []
    const male = rows.filter((p) => p.gender === 'male').length
    const female = rows.filter((p) => p.gender === 'female').length
    const avgAge = rows.length ? Math.round(rows.reduce((sum, p) => sum + (p.age || 0), 0) / rows.length) : 0
    return { total: profiles?.total || 0, male, female, avgAge }
  }, [profiles])

  if (loading && !user) {
    return <main className="auth-shell"><div className="loader">Loading</div></main>
  }

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="login-panel">
          <div>
            <p className="eyebrow">Insighta Labs+</p>
            <h1>Secure profile intelligence</h1>
            <p className="login-copy">Access is restricted to authenticated Insighta users.</p>
          </div>
          <button className="primary-action" onClick={login}>Continue with GitHub</button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">I</span>
          <div><strong>Insighta Labs+</strong><small>{user.role}</small></div>
        </div>
        <nav>
          {(['dashboard', 'profiles', 'search', 'account'] as View[]).map((item) => (
            <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>{item}</button>
          ))}
        </nav>
        <button className="ghost-action" onClick={logout}>Logout</button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{view}</p>
            <h1>{view === 'dashboard' ? 'Dashboard' : view === 'profiles' ? 'Profiles' : view === 'search' ? 'Search' : 'Account'}</h1>
          </div>
          <div className="user-chip">
            {user.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{user.username.slice(0, 1).toUpperCase()}</span>}
            @{user.username}
          </div>
        </header>

        {notice && <div className="notice">{notice}</div>}
        {error && <div className="error">{error}</div>}
        {loading && <div className="loader inline">Loading</div>}

        {view === 'dashboard' && (
          <section className="dashboard-grid">
            <Metric label="Profiles" value={metrics.total.toLocaleString()} />
            <Metric label="Male in view" value={metrics.male} />
            <Metric label="Female in view" value={metrics.female} />
            <Metric label="Average age" value={metrics.avgAge || '-'} />
          </section>
        )}

        {view === 'profiles' && (
          <section className="content-flow">
            <div className="toolbar">
              <select value={filters.gender} onChange={(e) => updateFilters({ gender: e.target.value })}>
                <option value="">Any gender</option><option value="male">Male</option><option value="female">Female</option>
              </select>
              <input placeholder="Country code" value={filters.country_id} onChange={(e) => updateFilters({ country_id: e.target.value.toUpperCase() })} />
              <select value={filters.age_group} onChange={(e) => updateFilters({ age_group: e.target.value })}>
                <option value="">Any age group</option><option value="child">Child</option><option value="teenager">Teenager</option><option value="adult">Adult</option><option value="senior">Senior</option>
              </select>
              <input placeholder="Min age" value={filters.min_age} onChange={(e) => updateFilters({ min_age: e.target.value })} />
              <input placeholder="Max age" value={filters.max_age} onChange={(e) => updateFilters({ max_age: e.target.value })} />
              <select value={filters.sort_by} onChange={(e) => updateFilters({ sort_by: e.target.value })}>
                <option value="created_at">Created</option><option value="age">Age</option><option value="gender_probability">Gender confidence</option>
              </select>
              <select value={filters.order} onChange={(e) => updateFilters({ order: e.target.value })}>
                <option value="desc">Desc</option><option value="asc">Asc</option>
              </select>
            </div>

            {isAdmin && <form className="create-row" onSubmit={createProfile}><input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Profile name" /><button>Create</button></form>}

            <ProfileTable rows={profiles?.data || []} onSelect={loadProfile} />
            <Pagination page={profiles?.page || 1} totalPages={profiles?.total_pages || 1} onPage={(page) => updateFilters({ page })} />
            {selectedProfile && <ProfileDetail profile={selectedProfile} onClose={() => setSelectedProfile(null)} />}
          </section>
        )}

        {view === 'search' && (
          <section className="content-flow">
            <form className="search-row" onSubmit={(e) => { e.preventDefault(); void runSearch() }}>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="young males from nigeria" />
              <button>Search</button>
            </form>
            <ProfileTable rows={searchResults?.data || []} onSelect={loadProfile} />
            {searchResults && <Pagination page={searchResults.page} totalPages={searchResults.total_pages} onPage={runSearch} />}
            {selectedProfile && <ProfileDetail profile={selectedProfile} onClose={() => setSelectedProfile(null)} />}
          </section>
        )}

        {view === 'account' && (
          <section className="account-grid">
            <div><span>Username</span><strong>@{user.username}</strong></div>
            <div><span>Email</span><strong>{user.email || 'Not provided'}</strong></div>
            <div><span>Role</span><strong>{user.role}</strong></div>
            <div><span>Status</span><strong>{user.is_active ? 'Active' : 'Inactive'}</strong></div>
            <div><span>Last login</span><strong>{formatDate(user.last_login_at)}</strong></div>
            <div><span>Created</span><strong>{formatDate(user.created_at)}</strong></div>
          </section>
        )}
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>
}

function ProfileTable({ rows, onSelect }: { rows: Profile[]; onSelect: (id: string) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Gender</th><th>Age</th><th>Country</th><th>Confidence</th></tr></thead>
        <tbody>
          {rows.map((profile) => (
            <tr key={profile.id} onClick={() => onSelect(profile.id)}>
              <td>{profile.name}</td><td>{profile.gender}</td><td>{profile.age}</td><td>{profile.country_id || profile.country_name}</td><td>{percent(profile.gender_probability)}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={5} className="empty">No profiles found</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  return <div className="pagination"><button disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button><span>{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button></div>
}

function ProfileDetail({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  return (
    <div className="detail-panel">
      <button className="close-button" onClick={onClose}>Close</button>
      <h2>{profile.name}</h2>
      <dl>
        <div><dt>Gender</dt><dd>{profile.gender} ({percent(profile.gender_probability)})</dd></div>
        <div><dt>Age</dt><dd>{profile.age} / {profile.age_group}</dd></div>
        <div><dt>Country</dt><dd>{profile.country_name || profile.country_id} ({percent(profile.country_probability)})</dd></div>
        <div><dt>Created</dt><dd>{formatDate(profile.created_at)}</dd></div>
      </dl>
    </div>
  )
}

export default App
