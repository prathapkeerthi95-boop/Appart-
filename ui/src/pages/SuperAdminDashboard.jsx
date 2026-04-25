import { Users, Building2, Settings, Shield, BarChart3, Bell, LogOut, Home, UserPlus, FileText, Wrench, DollarSign, MessageSquare, ChevronDown, User } from 'lucide-react'
import { useState } from 'react'
import './SuperAdminDashboard.css'

function SuperAdminDashboard({ user, onLogout }) {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const stats = [
        { icon: <Building2 size={22} />, label: 'Total Properties', value: '42', color: '#8b5cf6' },
        { icon: <Users size={22} />, label: 'Total Users', value: '1,280', color: '#3b82f6' },
        { icon: <Shield size={22} />, label: 'Active Admins', value: '15', color: '#10b981' },
        { icon: <DollarSign size={22} />, label: 'Revenue', value: '$84K', color: '#f59e0b' },
    ]

    return (
        <div className="dashboard superadmin">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon"><Shield size={20} /></div>
                    <span>Super Admin</span>
                </div>
                <nav className="sidebar-nav">
                    <a className="sidebar-link active"><Home size={18} /><span>Dashboard</span></a>
                </nav>
                <button className="sidebar-logout" onClick={onLogout}><LogOut size={18} /><span>Logout</span></button>
            </aside>

            <main className="dash-main">
                <header className="dash-header">
                    <div>
                        <h1>Super Admin Panel</h1>
                        <p className="dash-subtitle">Full system control &amp; oversight</p>
                    </div>
                    <div className="dash-user-profile" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                        <div className="dash-avatar">
                            {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <ChevronDown size={14} className={showProfileDropdown ? 'rotate' : ''} />

                        {showProfileDropdown && (
                            <div className="profile-dropdown">
                                <button className="dropdown-item">
                                    <User size={14} />
                                    Profile
                                </button>
                                <button className="dropdown-item">
                                    <Settings size={14} />
                                    Basic
                                </button>
                                <button className="dropdown-item logout" onClick={onLogout}>
                                    <LogOut size={14} />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <div className="stats-grid">
                    {stats.map((s, i) => (
                        <div className="stat-card" key={i} style={{ '--accent': s.color }}>
                            <div className="stat-icon">{s.icon}</div>
                            <div>
                                <div className="stat-val">{s.value}</div>
                                <div className="stat-lbl">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="dash-grid">
                    <div className="dash-card wide">
                        <h3>System Overview</h3>
                        <div className="placeholder-chart">
                            <div className="bar" style={{ height: '60%' }}></div>
                            <div className="bar" style={{ height: '80%' }}></div>
                            <div className="bar" style={{ height: '45%' }}></div>
                            <div className="bar" style={{ height: '90%' }}></div>
                            <div className="bar" style={{ height: '70%' }}></div>
                            <div className="bar" style={{ height: '55%' }}></div>
                            <div className="bar" style={{ height: '75%' }}></div>
                        </div>
                    </div>
                    <div className="dash-card">
                        <h3>Recent Activity</h3>
                        <div className="activity-list">
                            <div className="activity-item"><span className="dot green"></span>New admin registered</div>
                            <div className="activity-item"><span className="dot blue"></span>Property #12 updated</div>
                            <div className="activity-item"><span className="dot purple"></span>System backup completed</div>
                            <div className="activity-item"><span className="dot yellow"></span>3 new user sign-ups</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default SuperAdminDashboard
