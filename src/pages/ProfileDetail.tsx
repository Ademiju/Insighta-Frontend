import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { request, percent, formatDate } from '../utils/api'

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

export default function ProfileDetail() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!id) return

        async function load() {
            setLoading(true)
            setError('')

            try {
                const res = await request<{ status: string; data: Profile }>(
                    `/api/profiles/${id}`
                )

                setProfile(res.data)
            } catch (err: any) {
                console.error(err)
                setError(err.message || 'Failed to load profile')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [id])

    if (loading) return <div className="loader">Loading</div>
    if (error) return <div className="error">{error}</div>
    if (!profile) return <div className="empty">No profile found</div>

    return (
        <div className="detail-panel">
            <button className="close-button" onClick={() => navigate(-1)}>
                Back
            </button>

            <h2>{profile.name}</h2>

            <dl>
                <div>
                    <dt>ID</dt>
                    <dd>{profile.id}</dd>
                </div>

                <div>
                    <dt>Gender</dt>
                    <dd>
                        {profile.gender} ({percent(profile.gender_probability)})
                    </dd>
                </div>

                <div>
                    <dt>Age</dt>
                    <dd>
                        {profile.age} ({profile.age_group})
                    </dd>
                </div>

                <div>
                    <dt>Country Name</dt>
                    <dd>{profile.country_name || 'Unknown'}</dd>
                </div>

                <div>
                    <dt>Country Code</dt>
                    <dd>{profile.country_id || '-'}</dd>
                </div>

                <div>
                    <dt>Country Confidence</dt>
                    <dd>{percent(profile.country_probability)}</dd>
                </div>

                <div>
                    <dt>Created At</dt>
                    <dd>{formatDate(profile.created_at)}</dd>
                </div>
            </dl>
        </div>
    )
}