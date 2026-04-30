import { formatDate } from '../utils/api'

export default function Account({ user }: any) {
    return (
        <section className="account-grid">
            {/* USER HEADER (RESTORED) */}
            <div className="user-chip large">
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" />
                ) : (
                    <span>{user.username.slice(0, 1).toUpperCase()}</span>
                )}
                <strong>@{user.username}</strong>
            </div>

            <div>
                <span>Email</span>
                <strong>{user.email || 'Not provided'}</strong>
            </div>

            <div>
                <span>Role</span>
                <strong>{user.role}</strong>
            </div>

            <div>
                <span>Status</span>
                <strong>{user.is_active ? 'Active' : 'Inactive'}</strong>
            </div>

            <div>
                <span>Last login</span>
                <strong>{formatDate(user.last_login_at)}</strong>
            </div>

            <div>
                <span>Created</span>
                <strong>{formatDate(user.created_at)}</strong>
            </div>
        </section>
    )
}