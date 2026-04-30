import { useState } from 'react'
import { request } from '../utils/api'
import ProfileTable from '../components/ProfileTable'
import Pagination from '../components/Pagination'

export default function Search() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)

    async function runSearch(nextPage = 1) {
        if (!query.trim()) return
        setLoading(true)

        try {
            const params = new URLSearchParams({
                q: query,
                page: String(nextPage),
                limit: '10',
            })

            const res = await request(`/api/profiles/search?${params.toString()}`)
            setResults(res)
            setPage(nextPage)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="content-flow">
            <form
                className="search-row"
                onSubmit={(e) => {
                    e.preventDefault()
                    runSearch(1)
                }}
            >
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="young males from nigeria"
                />
                <button>Search</button>
            </form>

            {loading && <div className="loader">Loading</div>}

            <ProfileTable rows={results?.data || []} />

            {results && (
                <Pagination
                    page={page}
                    totalPages={results.total_pages}
                    onPage={(p: number) => runSearch(p)}
                />
            )}
        </section>
    )
}