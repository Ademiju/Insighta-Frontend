import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { request } from '../utils/api'
import ProfileTable from '../components/ProfileTable'
import Pagination from '../components/Pagination'

type User = {
    role: string
}

type OutletContext = {
    user: User
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

export default function Profiles() {
    const { user } = useOutletContext<OutletContext>()
    const isAdmin = user?.role === 'admin'

    const [filters, setFilters] = useState<Filters>(initialFilters)
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const [createName, setCreateName] = useState('')
    const [notice, setNotice] = useState('')
    const [error, setError] = useState('')

    function paramsFromFilters(filters: Filters) {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== '' && value !== undefined && value !== null) {
                params.set(key, String(value))
            }
        })
        return params.toString()
    }

    async function load(nextFilters = filters) {
        setLoading(true)
        setError('')
        try {
            const res = await request(`/api/profiles?${paramsFromFilters(nextFilters)}`)
            setData(res)
        } catch (err: any) {
            setError(err.message || 'Failed to load profiles')
        } finally {
            setLoading(false)
        }
    }

    function updateFilters(patch: Partial<Filters>) {
        const next = { ...filters, ...patch, page: patch.page ?? 1 }
        setFilters(next)
        load(next)
    }

    async function createProfile(e: React.FormEvent) {
        e.preventDefault()
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

            // reload first page
            updateFilters({ page: 1 })
        } catch (err: any) {
            setError(err.message || 'Unable to create profile')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <section className="content-flow">
            {/* FILTERS */}
            <div className="toolbar">
                <select value={filters.gender} onChange={(e) => updateFilters({ gender: e.target.value })}>
                    <option value="">Any gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>

                <input
                    placeholder="Country code"
                    value={filters.country_id}
                    onChange={(e) =>
                        updateFilters({ country_id: e.target.value.toUpperCase() })
                    }
                />

                <select value={filters.age_group} onChange={(e) => updateFilters({ age_group: e.target.value })}>
                    <option value="">Any age group</option>
                    <option value="child">Child</option>
                    <option value="teenager">Teenager</option>
                    <option value="adult">Adult</option>
                    <option value="senior">Senior</option>
                </select>

                <input
                    placeholder="Min age"
                    value={filters.min_age}
                    onChange={(e) => updateFilters({ min_age: e.target.value })}
                />

                <input
                    placeholder="Max age"
                    value={filters.max_age}
                    onChange={(e) => updateFilters({ max_age: e.target.value })}
                />

                <select value={filters.sort_by} onChange={(e) => updateFilters({ sort_by: e.target.value })}>
                    <option value="created_at">Created</option>
                    <option value="age">Age</option>
                    <option value="gender_probability">Gender confidence</option>
                </select>

                <select value={filters.order} onChange={(e) => updateFilters({ order: e.target.value })}>
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                </select>
            </div>

            {/* ADMIN CREATE */}
            {isAdmin && (
                <form className="create-row" onSubmit={createProfile}>
                    <input
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        placeholder="Profile name"
                    />
                    <button>Create</button>
                </form>
            )}

            {/* FEEDBACK */}
            {notice && <div className="notice">{notice}</div>}
            {error && <div className="error">{error}</div>}
            {loading && <div className="loader inline">Loading</div>}

            {/* TABLE */}
            <ProfileTable rows={data?.data || []} />

            {/* PAGINATION */}
            {data && (
                <Pagination
                    page={data.page}
                    totalPages={data.total_pages}
                    onPage={(page: number) => updateFilters({ page })}
                />
            )}
        </section>
    )
}