import { useEffect, useMemo, useState } from 'react'
import { request } from '../utils/api'
import Metric from '../components/Metric'

export default function Dashboard() {
    const [profiles, setProfiles] = useState<any>(null)

    useEffect(() => {
        request('/api/profiles?limit=50').then(setProfiles)
    }, [])

    const metrics = useMemo(() => {
        const rows = profiles?.data || []

        const male = rows.filter((p: any) => p.gender === 'male').length
        const female = rows.filter((p: any) => p.gender === 'female').length
        const avgAge = rows.length
            ? Math.round(rows.reduce((sum: number, p: any) => sum + (p.age || 0), 0) / rows.length)
            : 0

        return {
            total: profiles?.total || 0,
            male,
            female,
            avgAge,
        }
    }, [profiles])

    if (!profiles) return <div className="loader">Loading</div>

    return (
        <section className="dashboard-grid">
            <Metric label="Profiles" value={metrics.total} />
            <Metric label="Male in view" value={metrics.male} />
            <Metric label="Female in view" value={metrics.female} />
            <Metric label="Average age" value={metrics.avgAge || '-'} />
        </section>
    )
}