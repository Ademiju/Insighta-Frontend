import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { request } from './utils/api'

import AppLayout from './layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profiles from './pages/Profiles'
import ProfileDetail from './pages/ProfileDetail'
import Search from './pages/Search'
import Account from './pages/Account'

export default function App() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        async function load() {
            try {
                const res = await request<any>('/users/me')
                setUser(res.data)
                navigate('/dashboard')
            } catch {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    async function logout() {
        await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        })
        setUser(null)
        navigate('/login')
    }

    if (loading) return <div className="loader">Loading</div>

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />

            <Route path="/login" element={<Login />} />

            {user ? (
                <Route element={<AppLayout user={user} logout={logout} />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profiles" element={<Profiles />} />
                    <Route path="/profiles/:id" element={<ProfileDetail />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/account" element={<Account user={user} />} />
                </Route>
            ) : (
                <Route path="*" element={<Navigate to="/login" />} />
            )}
        </Routes>
    )
}