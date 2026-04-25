import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LayoutDashboard, Users, Wrench, Receipt, Landmark, LogOut,
    Plus, Search, Filter, MoreVertical, Bell, Calendar,
    TrendingUp, TrendingDown, Clock, Activity, CheckCircle2,
    BrainCircuit, FileUp, Zap, X, ChevronRight, UserPlus, Trash2, Edit2, Download
} from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './AdminDashboard.css';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const API_URL = 'http://localhost:5002/api';

const AdminDashboard = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCollected: 0,
        totalExpenses: 0,
        totalPending: 0,
        balance: 0
    });
    const [chartData, setChartData] = useState({
        monthlyRevenue: [
            { month: 'Jan', amount: 0 }, { month: 'Feb', amount: 0 }, { month: 'Mar', amount: 0 },
            { month: 'Apr', amount: 0 }, { month: 'May', amount: 0 }, { month: 'Jun', amount: 0 }
        ],
        expenseBreakdown: [{ category: 'No Data', amount: 1 }],
        maintenanceStats: []
    });
    const [users, setUsers] = useState([]);
    const [maintenanceTasks, setMaintenanceTasks] = useState([]);
    const [maintenancePayments, setMaintenancePayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({
        username: '', email: '', role: 'user', flatNumber: '', contactNumber: '', residentType: 'Owner'
    });
    const [formSubmitted, setFormSubmitted] = useState(false);

    const [showBillForm, setShowBillForm] = useState(false);
    const [newBill, setNewBill] = useState({
        vendorName: '', amount: '', billType: 'Electricity', billDate: new Date().toISOString().split('T')[0], description: ''
    });
    const [billFile, setBillFile] = useState(null);
    const [aiInsights, setAiInsights] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '', description: '', priority: 'Medium', flatNumber: '', assignedPerson: '', dueDate: new Date().toISOString().split('T')[0]
    });

    const [transactions, setTransactions] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        year: 2026,
        status: '',
        priority: '',
        maintenanceMonth: new Date().toISOString().slice(0, 7),
        maintenanceStatus: ''
    });

    const [selectedUserHistory, setSelectedUserHistory] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const [showSetup, setShowSetup] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        fetchStats(config);
        fetchCharts(config);
        if (activeTab === 'users') fetchUsers(config);
        if (activeTab === 'maintenance') {
            fetchTasks(config);
            fetchMaintenanceSetup(config);
            fetchMaintenancePayments(config);
        }
        if (activeTab === 'expenses') fetchExpenses(config);
        if (activeTab === 'finance') {
            fetchTransactions(config);
            fetchMaintenancePayments(config);
            fetchMaintenanceSetup(config);
        }
    }, [activeTab, filters.year, filters.status, filters.priority, filters.maintenanceMonth, user]);

    const fetchTransactions = async (config) => {
        try {
            const resp = await axios.get(`${API_URL}/transactions`, config);
            setTransactions(resp.data);
        } catch (err) { console.error("Transactions Error:", err); }
    };

    const fetchStats = async (config) => {
        try {
            const resp = await axios.get(`${API_URL}/dashboard`, config);
            setStats(resp.data);
        } catch (err) { console.error("Stats Error:", err); }
    };

    const fetchCharts = async (config) => {
        try {
            const resp = await axios.get(`${API_URL}/dashboard/charts?year=${filters.year}`, config);
            setChartData(resp.data);
        } catch (err) { console.error("Charts Error:", err); }
    };

    const fetchUsers = async (config) => {
        try {
            setLoading(true);
            const resp = await axios.get(`${API_URL}/users?search=${searchTerm}`, config);
            setUsers(resp.data);
        } catch (err) { console.error("Users Error:", err); }
        finally { setLoading(false); }
    };

    const fetchTasks = async (config) => {
        try {
            const resp = await axios.get(`${API_URL}/maintenance/tasks?status=${filters.status}&priority=${filters.priority}&search=${searchTerm}`, config);
            setMaintenanceTasks(resp.data);
        } catch (err) { console.error("Tasks Error:", err); }
    };

    const [maintenanceSetup, setMaintenanceSetup] = useState({ monthlyAmount: 2500, dueDate: 10 });
    const fetchMaintenanceSetup = async (config) => {
        try {
            const resp = await axios.get(`${API_URL}/maintenance`, config);
            if (resp.data.setup) setMaintenanceSetup(resp.data.setup);
        } catch (err) { console.error("Setup Error:", err); }
    };

    const [expenses, setExpenses] = useState([]);
    const fetchExpenses = async (config) => {
        try {
            const resp = await axios.get(`${API_URL}/bills`, config);
            setExpenses(resp.data);
        } catch (err) { console.error("Expenses Error:", err); }
    };

    const fetchMaintenancePayments = async (config) => {
        try {
            const resp = await axios.get(`${API_URL}/maintenance/payments?month=${filters.maintenanceMonth}`, config);
            let filtered = resp.data;
            if (filters.maintenanceStatus) {
                filtered = filtered.filter(p => p.status === filters.maintenanceStatus);
            }
            setMaintenancePayments(filtered);
        } catch (err) { console.error("Payments Error:", err); }
    };

    const fetchUserHistory = async (userId) => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            const resp = await axios.get(`${API_URL}/maintenance/history/${userId}`, config);
            setSelectedUserHistory(resp.data);
            setShowHistoryModal(true);
        } catch (err) { alert("Error fetching history"); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setFormSubmitted(true);
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            if (editingUser) {
                await axios.put(`${API_URL}/users/${editingUser.id}`, { ...newUser, id: editingUser.id }, config);
            } else {
                await axios.post(`${API_URL}/users`, newUser, config);
            }
            setShowUserForm(false);
            setFormSubmitted(false);
            setEditingUser(null);
            setNewUser({ username: '', email: '', role: 'user', flatNumber: '', contactNumber: '', residentType: 'Owner' });
            fetchUsers(config);
        } catch (err) { alert("Error saving user"); }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Delete this user?")) return;
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.delete(`${API_URL}/users/${id}`, config);
            fetchUsers(config);
        } catch (err) { alert("Error deleting user"); }
    };

    const handleUpdateTaskStatus = async (task, newStatus) => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.put(`${API_URL}/maintenance/tasks/${task.id}`, { ...task, status: newStatus }, config);
            fetchTasks(config);
            fetchStats(config);
        } catch (err) { console.error("Update task error"); }
    };

    const handleUpdateSetup = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.post(`${API_URL}/maintenance`, maintenanceSetup, config);
            alert("Maintenance settings updated!");
        } catch (err) { alert("Error updating settings"); }
    };

    const handleFileAnalysis = async (file) => {
        if (!file) return;
        try {
            setIsAnalyzing(true);
            setTimeout(() => {
                const name = file.name.toLowerCase();
                let extractedVendor = "Unknown Vendor";
                let extractedAmount = Math.floor(Math.random() * 5000) + 500;
                let extractedType = "Other";

                if (name.includes("bescom") || name.includes("elect")) {
                    extractedVendor = "BESCOM";
                    extractedType = "Electricity";
                } else if (name.includes("water") || name.includes("bwssb")) {
                    extractedVendor = "BWSSB";
                    extractedType = "Water";
                } else if (name.includes("security")) {
                    extractedVendor = "Security Force Ltd";
                    extractedType = "Security";
                }

                setNewBill(prev => ({
                    ...prev,
                    vendorName: extractedVendor,
                    amount: extractedAmount,
                    billType: extractedType
                }));
                setIsAnalyzing(false);
            }, 1500);
        } catch (err) {
            console.error("Analysis error:", err);
            setIsAnalyzing(false);
        }
    };

    const handleUploadBill = async (e) => {
        e.preventDefault();
        try {
            setIsAnalyzing(true);
            const formData = new FormData();
            formData.append('vendorName', newBill.vendorName);
            formData.append('amount', newBill.amount);
            formData.append('billType', newBill.billType);
            formData.append('billDate', newBill.billDate);
            formData.append('description', newBill.description);
            const currentToken = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'multipart/form-data' } };
            const resp = await axios.post(`${API_URL}/bills`, formData, config);

            // Get AI Insights
            try {
                const aiResp = await axios.post(`${API_URL}/bills/ai-categorize`, resp.data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAiInsights(aiResp.data);
            } catch (aiErr) { console.error("AI Insight Error:", aiErr); }

            setShowBillForm(false);
            setNewBill({ vendorName: '', amount: '', billType: 'Electricity', billDate: new Date().toISOString().split('T')[0], description: '' });
            setBillFile(null);
            const refetchToken = localStorage.getItem('token');
            const refetchConfig = { headers: { Authorization: `Bearer ${refetchToken}` } };
            fetchExpenses(refetchConfig);
            fetchStats(refetchConfig);
        } catch (err) { alert("Error uploading bill"); }
        finally { setIsAnalyzing(false); }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.post(`${API_URL}/maintenance/tasks`, { ...newTask, status: 'Pending' }, config);
            setShowTaskForm(false);
            setNewTask({ title: '', description: '', priority: 'Medium', flatNumber: '', assignedPerson: '', dueDate: new Date().toISOString().split('T')[0] });
            fetchTasks(config);
            fetchStats(config);
        } catch (err) { alert("Error creating task"); }
    };

    const COLORS = ['#0ea5e9', '#ef4444', '#10b981', '#f59e0b', '#6366f1'];

    const handleRecordPayment = async (payment) => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.post(`${API_URL}/maintenance/record-payment`, {
                userId: payment.id,
                month: new Date().toISOString().slice(0, 7),
                amount: payment.amount
            }, config);
            fetchMaintenancePayments(config);
            fetchStats(config);
            fetchTransactions(config);
        } catch (err) { alert("Error recording payment"); }
    };

    const handleDownloadCSV = () => {
        const headers = ['Date', 'Type', 'Amount', 'Category', 'Description'];
        const rows = transactions.map(t => [
            new Date(t.transactionDate).toLocaleDateString(),
            t.type, t.amount, t.category, t.description
        ]);
        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance_report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="admin-panel">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <Zap size={24} color="var(--accent-color)" fill="var(--accent-color)" />
                    PrimeStay
                </div>
                <nav className="sidebar-nav">
                    <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <LayoutDashboard size={20} /> Dashboard
                    </div>
                    <div className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        <Users size={20} /> Users
                    </div>
                    <div className={`nav-item ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>
                        <Wrench size={20} /> Maintenance
                    </div>
                    <div className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
                        <Receipt size={20} /> Expenses
                    </div>
                    <div className={`nav-item ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
                        <Landmark size={20} /> Finance
                    </div>
                </nav>
                <div className="logout-container">
                    <div className="nav-item" onClick={onLogout}>
                        <LogOut size={20} /> Sign Out
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <header className="header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {activeTab === 'dashboard' && <LayoutDashboard size={28} color="var(--accent-color)" />}
                        {activeTab === 'users' && <Users size={28} color="var(--accent-color)" />}
                        {activeTab === 'maintenance' && <Wrench size={28} color="var(--accent-color)" />}
                        {activeTab === 'expenses' && <Receipt size={28} color="var(--accent-color)" />}
                        {activeTab === 'finance' && <Landmark size={28} color="var(--accent-color)" />}
                        <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                    </div>
                    <div className="user-profile">
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: 700 }}>{user?.username || 'Admin'}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>System Administrator</p>
                        </div>
                        <div className="avatar">A</div>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <div className="animate-in">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <p className="stat-label">Total Users</p>
                                <p className="stat-value">{stats.totalUsers}</p>
                            </div>
                            <div className="stat-card">
                                <p className="stat-label">Pending Collection</p>
                                <p className="stat-value" style={{ color: '#f59e0b' }}>₹{stats.totalPending?.toLocaleString()}</p>
                            </div>
                            <div className="stat-card">
                                <p className="stat-label">Total Revenue</p>
                                <p className="stat-value">₹{stats.totalCollected?.toLocaleString()}</p>
                            </div>
                            <div className="stat-card">
                                <p className="stat-label">Total Expenses</p>
                                <p className="stat-value" style={{ color: '#ef4444' }}>₹{stats.totalExpenses?.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="charts-grid">
                            <div className="chart-card">
                                <div className="chart-header">
                                    <h3 className="chart-title">Revenue Trends</h3>
                                    <select value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} className="btn-ghost">
                                        <option value="2026">2026</option>
                                        <option value="2025">2025</option>
                                    </select>
                                </div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData.monthlyRevenue}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                                        <YAxis stroke="#94a3b8" fontSize={12} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="chart-card">
                                <div className="chart-header"><h3 className="chart-title">Expense Breakdown</h3></div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={chartData.expenseBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                            {chartData.expenseBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="animate-in">
                        <div className="section-header">
                            <h2 className="section-title">User Management</h2>
                            <button className="btn btn-primary" onClick={() => { setShowUserForm(!showUserForm); setEditingUser(null); }}>
                                {showUserForm ? <X size={18} /> : <UserPlus size={18} />}
                                {showUserForm ? 'Close' : 'Create User'}
                            </button>
                        </div>

                        <div className="filter-bar">
                            <div className="search-input">
                                <Search className="search-icon" size={18} />
                                <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()} />
                            </div>
                            <button className="btn btn-ghost" onClick={() => fetchUsers()}>Search</button>
                        </div>

                        {/* Right-Side Drawer Overlay */}
                        <div className={`drawer-overlay ${showUserForm ? 'open' : ''}`} onClick={() => setShowUserForm(false)}>
                            <div className={`drawer-content ${showUserForm ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                                <div className="drawer-header">
                                    <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
                                    <button className="btn-close" onClick={() => setShowUserForm(false)}><X size={24} /></button>
                                </div>
                                <form onSubmit={handleCreateUser} className={`drawer-form ${formSubmitted ? 'submitted' : ''}`} noValidate>
                                    <div className="form-grid">
                                        <div className="form-group"><label>Full Name <span className="required-star">*</span></label><input type="text" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} required placeholder="Enter full name" /></div>
                                        <div className="form-group"><label>Email ID <span className="required-star">*</span></label><input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required placeholder="example@mail.com" /></div>
                                        <div className="form-group phone-group">
                                            <label>Contact Number <span className="required-star">*</span></label>
                                            <PhoneInput
                                                country={'in'}
                                                value={newUser.contactNumber}
                                                onChange={phone => setNewUser({ ...newUser, contactNumber: phone })}
                                                separateDialCode={true}
                                                inputStyle={{ width: '100%', height: '48px', borderRadius: '12px', border: '1.5px solid var(--border-color)', fontSize: '1rem', paddingLeft: '115px' }}
                                                containerStyle={{ width: '100%' }}
                                                buttonStyle={{ borderRadius: '12px 0 0 12px', border: '1.5px solid var(--border-color)', borderRight: 'none', background: '#f8fafc', width: '105px' }}
                                                dropdownStyle={{ borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                            />
                                        </div>
                                        <div className="form-group"><label>Flat No <span className="required-star">*</span></label><input type="text" value={newUser.flatNumber} onChange={e => setNewUser({ ...newUser, flatNumber: e.target.value })} required placeholder="e.g. A-101" /></div>
                                        <div className="form-group">
                                            <label>User Type</label>
                                            <select value={newUser.residentType} onChange={e => setNewUser({ ...newUser, residentType: e.target.value })}>
                                                <option value="Owner">Owner</option><option value="Tenant">Tenant</option><option value="Committee">Committee member</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Role</label>
                                            <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                                <option value="user">User</option><option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="drawer-actions">
                                        <button type="submit" className="btn btn-primary w-full">{editingUser ? 'Update User' : 'Save User'}</button>
                                        <button type="button" className="btn btn-ghost w-full" onClick={() => setShowUserForm(false)}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr><th>Name</th><th>Email</th><th>Contact</th><th>Flat</th><th>Role</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center' }}>No users found</td></tr> : users.map(u => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 600 }}>{u.username}</td><td>{u.email}</td><td>{u.contactNumber}</td><td>{u.flatNumber}</td>
                                            <td><span className="badge badge-paid">{u.role}</span></td>
                                            <td className="action-cell">
                                                <div className="menu-container">
                                                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === u.id ? null : u.id); }}>
                                                        <MoreVertical size={18} />
                                                    </button>
                                                    {activeMenu === u.id && (
                                                        <div className="action-dropdown" onClick={e => e.stopPropagation()}>
                                                            <button className="dropdown-item" onClick={() => { setEditingUser(u); setNewUser(u); setShowUserForm(true); setActiveMenu(null); }}>
                                                                <Edit2 size={14} /> Edit
                                                            </button>
                                                            <button className="dropdown-item delete" onClick={() => { handleDeleteUser(u.id); setActiveMenu(null); }}>
                                                                <Trash2 size={14} /> Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'maintenance' && (
                    <div className="animate-in">
                        <div className="section-header">
                            <h2 className="section-title">Maintenance Requests</h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-primary" onClick={() => setShowSetup(!showSetup)}><Activity size={18} /> Amount Setup</button>
                                <button className="btn btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>{showTaskForm ? 'Cancel' : 'New Request'}</button>
                            </div>
                        </div>

                        {showSetup && (
                            <div className="form-card animate-in">
                                <h3>Setup Monthly Amount</h3>
                                <form onSubmit={handleUpdateSetup} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
                                    <div className="form-group"><label>Amount (₹)</label><input type="number" value={maintenanceSetup.monthlyAmount} onChange={e => setMaintenanceSetup({ ...maintenanceSetup, monthlyAmount: e.target.value })} required /></div>
                                    <div className="form-group"><label>Due Date (Day)</label><input type="number" min="1" max="31" value={maintenanceSetup.dueDate} onChange={e => setMaintenanceSetup({ ...maintenanceSetup, dueDate: e.target.value })} required /></div>
                                    <button type="submit" className="btn btn-primary">Update</button>
                                </form>
                            </div>
                        )}

                        <div className="table-container" style={{ marginTop: '2rem' }}>
                            <table>
                                <thead><tr><th>Task</th><th>Flat</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
                                <tbody>
                                    {maintenanceTasks.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center' }}>No requests</td></tr> : maintenanceTasks.map(task => (
                                        <tr key={task.id}>
                                            <td style={{ fontWeight: 600 }}>{task.title}</td><td>{task.flatNumber}</td>
                                            <td><span className={`badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                                            <td><span className="badge badge-pending">{task.status}</span></td>
                                            <td>
                                                {task.status !== 'Completed' && (
                                                    <button className="btn btn-ghost" onClick={() => handleUpdateTaskStatus(task, task.status === 'Pending' ? 'In Progress' : 'Completed')}>Next Step</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="section-header" style={{ marginTop: '3rem' }}>
                            <h2 className="section-title">Maintenance Collections</h2>
                            <div className="filter-bar" style={{ marginBottom: 0, padding: '0.5rem 1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                    <label style={{ margin: 0 }}>Month:</label>
                                    <input type="month" value={filters.maintenanceMonth} onChange={e => setFilters({ ...filters, maintenanceMonth: e.target.value })} style={{ width: 'auto', padding: '0.4rem' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                    <label style={{ margin: 0 }}>Status:</label>
                                    <select value={filters.maintenanceStatus} onChange={e => setFilters({ ...filters, maintenanceStatus: e.target.value })} style={{ width: 'auto', padding: '0.4rem' }}>
                                        <option value="">All Status</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Overdue">Overdue</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>User</th><th>Flat</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                                <tbody>
                                    {maintenancePayments.map(p => (
                                        <tr key={p.id} onClick={() => fetchUserHistory(p.id)} style={{ cursor: 'pointer' }}>
                                            <td style={{ fontWeight: 600 }}>{p.username}</td><td>{p.flatNumber}</td><td>₹{p.amount.toLocaleString()}</td>
                                            <td><span className={`badge ${p.status === 'Paid' ? 'badge-paid' : (p.status === 'Overdue' ? 'badge-overdue' : 'badge-pending')}`}>{p.status}</span></td>
                                            <td>
                                                {p.status !== 'Paid' && (
                                                    <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); handleRecordPayment(p); }}>Record Payment</button>
                                                )}
                                                <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); fetchUserHistory(p.id); }} style={{ marginLeft: '0.5rem' }}><Clock size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Payment History Modal */}
                        <div className={`drawer-overlay ${showHistoryModal ? 'open' : ''}`} onClick={() => setShowHistoryModal(false)}>
                            <div className={`drawer-content ${showHistoryModal ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                                <div className="drawer-header">
                                    <h3>Payment History</h3>
                                    <button className="btn-close" onClick={() => setShowHistoryModal(false)}><X size={24} /></button>
                                </div>
                                <div className="drawer-form">
                                    {selectedUserHistory && (
                                        <>
                                            <div className="stat-card" style={{ marginBottom: '2rem', background: 'var(--bg-secondary)' }}>
                                                <p className="stat-label">Total Outstandings</p>
                                                <p className="stat-value" style={{ color: '#ef4444' }}>₹{maintenancePayments.find(u => selectedUserHistory.length > 0 && u.id === selectedUserHistory[0].userId)?.amount || 0}</p>
                                            </div>
                                            <div className="table-container">
                                                <table style={{ fontSize: '0.85rem' }}>
                                                    <thead><tr><th>Month</th><th>Amount</th><th>Late Fee</th><th>Status</th></tr></thead>
                                                    <tbody>
                                                        {selectedUserHistory.map(h => (
                                                            <tr key={h.id}>
                                                                <td>{h.month}</td>
                                                                <td>₹{h.amount}</td>
                                                                <td style={{ color: '#ef4444' }}>{h.lateFee > 0 ? `₹${h.lateFee}` : '-'}</td>
                                                                <td><span className="badge badge-paid">Paid</span></td>
                                                            </tr>
                                                        ))}
                                                        {selectedUserHistory.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No payment history found</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'expenses' && (
                    <div className="animate-in">
                        <div className="section-header">
                            <h2 className="section-title">Expense Log</h2>
                            <button className="btn btn-primary" onClick={() => setShowBillForm(!showBillForm)}>{showBillForm ? 'Cancel' : 'Upload Bill'}</button>
                        </div>

                        {showBillForm && (
                            <div className="form-card animate-in">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3>Log Bill</h3><div className="badge badge-pending"><BrainCircuit size={14} /> AI Active</div>
                                </div>
                                <form onSubmit={handleUploadBill}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                        <div className="form-group"><label>Vendor</label><input type="text" value={newBill.vendorName} onChange={e => setNewBill({ ...newBill, vendorName: e.target.value })} required /></div>
                                        <div className="form-group"><label>Amount (₹)</label><input type="number" value={newBill.amount} onChange={e => setNewBill({ ...newBill, amount: e.target.value })} required /></div>
                                        <div className="form-group">
                                            <label>Category</label>
                                            <select value={newBill.billType} onChange={e => setNewBill({ ...newBill, billType: e.target.value })}>
                                                <option value="Electricity">Electricity</option><option value="Water">Water</option><option value="Salary">Salary</option><option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Date</label><input type="date" value={newBill.billDate} onChange={e => setNewBill({ ...newBill, billDate: e.target.value })} required /></div>
                                    </div>
                                    <div className="form-group" style={{ marginTop: '1rem' }}>
                                        <label>File (PDF/Image)</label>
                                        <input type="file" onChange={e => { setBillFile(e.target.files[0]); handleFileAnalysis(e.target.files[0]); }} style={{ padding: '1rem', border: '2px dashed var(--border-color)', borderRadius: '12px', width: '100%' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                        <button type="submit" className="btn btn-primary" disabled={isAnalyzing}>{isAnalyzing ? 'Analyzing...' : 'Process'}</button>
                                        <button type="button" className="btn btn-ghost" onClick={() => setShowBillForm(false)}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="table-container">
                            <table>
                                <thead><tr><th>Vendor</th><th>Amount</th><th>Category</th><th>Date</th></tr></thead>
                                <tbody>
                                    {expenses.map(e => (
                                        <tr key={e.id}><td>{e.vendorName}</td><td style={{ color: '#ef4444' }}>₹{e.amount.toLocaleString()}</td><td>{e.billType}</td><td>{new Date(e.billDate).toLocaleDateString()}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'finance' && (
                    <div className="animate-in">
                        <div className="section-header">
                            <h2 className="section-title">Finance</h2>
                            <button className="btn btn-primary" onClick={handleDownloadCSV}>Download CSV</button>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-card"><p className="stat-label">Total Assets</p><p className="stat-value">₹{(stats.totalCollected - stats.totalExpenses).toLocaleString()}</p></div>
                            <div className="stat-card"><p className="stat-label">Monthly Billing</p><p className="stat-value">₹{(maintenanceSetup.monthlyAmount * stats.totalUsers).toLocaleString()}</p></div>
                        </div>
                        <div className="table-container" style={{ marginTop: '2rem' }}>
                            <div style={{ padding: '1rem', fontWeight: 700 }}>Outstanding Payments</div>
                            <table>
                                <thead><tr><th>User</th><th>Flat</th><th>Amount</th><th>Action</th></tr></thead>
                                <tbody>
                                    {maintenancePayments.filter(p => p.status !== 'Paid').map(p => (
                                        <tr key={p.id}><td>{p.username}</td><td>{p.flatNumber}</td><td style={{ color: '#991b1b' }}>₹{p.amount.toLocaleString()}</td><td><button className="btn btn-ghost" onClick={() => handleRecordPayment(p)}>Record Payment</button></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
