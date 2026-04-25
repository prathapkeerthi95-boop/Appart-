import { XCircle, Calculator } from 'lucide-react'
import './UserDashboard.css'

function UserDashboard({ user, onLogout }) {
    return (
        <div className="admin-panel">
            {/* ===== SIDEBAR ===== */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <Calculator size={28} />
                    <span>Prime<b>Stay</b></span>
                </div>
                <nav className="sidebar-nav">
                    {/* No navigation items for now as requested */}
                </nav>
                <div className="logout-container">
                    <button className="nav-item" style={{ width: '100%', background: 'none', border: 'none' }} onClick={onLogout}>
                        <XCircle size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* ===== MAIN CONTENT ===== */}
            <main className="main-content">
                <header className="header">
                    <div>
                        <h1>Resident Dashboard</h1>
                        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Apartment Management System / Home</p>
                    </div>
                    <div className="user-profile">
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: 700 }}>{user.username}</p>
                            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Resident / {user.flatNumber || 'No Flat'}</p>
                        </div>
                        <div className="avatar">{user.username?.charAt(0).toUpperCase()}</div>
                    </div>
                </header>

                {/* ===== CONTENT ===== */}
                <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 120px)', textAlign: 'center' }}>

                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent) 0%, #305c6e 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '32px', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        🚀
                    </div>

                    <h2 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Coming Soon</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.5 }}>
                        The Resident Portal is currently under construction. Check back soon for exciting new features!
                    </p>
                </div>
            </main>
        </div>
    )
}

export default UserDashboard
