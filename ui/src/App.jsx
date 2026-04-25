import { useState, useEffect } from 'react'
import './App.css'
import { Building2, Shield, CreditCard, Wifi, Mail, Lock, User, ArrowRight, Sparkles, Eye, EyeOff, Facebook, Chrome, Linkedin } from 'lucide-react'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import AdminDashboard from './pages/AdminDashboard'
import UserDashboard from './pages/UserDashboard'
import Footer from './components/Footer/Footer'

const API_URL = 'http://localhost:5002'

function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [showAuthPage, setShowAuthPage] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  })

  const [otpStep, setOtpStep] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user', phone: '' })

  const [firstTimeStep, setFirstTimeStep] = useState(false) // false, 'request', 'verify'
  const [firstTimeData, setFirstTimeData] = useState({ email: '', newPassword: '', otp: '' })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setMessage({ text: '', type: '' })
  }

  const handleFirstTimeRequest = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })
    try {
      const res = await fetch(`${API_URL}/api/auth/request-password-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: firstTimeData.email, newPassword: firstTimeData.newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setFirstTimeStep('verify')
        setMessage({ text: data.message, type: 'success' })
      } else {
        setMessage({ text: data.error || 'User not found', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Error connecting to server', type: 'error' })
    }
    setLoading(false)
  }

  const handleFirstTimeVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-password-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: firstTimeData.email, otpCode: firstTimeData.otp }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: data.message, type: 'success' })
        setTimeout(() => {
          setFirstTimeStep(false)
          setIsLogin(true)
          setForm({ ...form, email: firstTimeData.email, password: '' })
        }, 1500)
      } else {
        setMessage({ text: data.error || 'Invalid OTP', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Verification failed', type: 'error' })
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
    const body = isLogin
      ? { email: form.email, password: form.password }
      : { username: form.username, email: form.email, password: form.password, contactNumber: form.phone, role: 'user' }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        if (isLogin) {
          setMessage({ text: data.message, type: 'success' })
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          setUser(data.user)
          setTimeout(() => setShowAuthPage(false), 600)
        } else {
          setRegEmail(form.email)
          setOtpStep(true)
          setMessage({ text: data.message, type: 'success' })
        }
      } else {
        setMessage({ text: data.error || 'Something went wrong', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Cannot connect to API. Is it running?', type: 'error' })
    }

    setLoading(false)
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, otpCode: otpValue }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ text: 'Account verified! Sign in now.', type: 'success' })
        setTimeout(() => {
          setOtpStep(false)
          setIsLogin(true)
          setForm({ ...form, password: '' })
        }, 1500)
      } else {
        setMessage({ text: data.error || 'Invalid OTP', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Verification failed.', type: 'error' })
    }
    setLoading(false)
  }

  const handleResendOtp = async () => {
    try {
      await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail }),
      })
      setMessage({ text: 'New OTP sent to your email.', type: 'success' })
    } catch (err) {
      setMessage({ text: 'Failed to resend OTP.', type: 'error' })
    }
  }

  const openAuth = (mode) => {
    setIsLogin(mode === 'login')
    setForm({ username: '', email: '', password: '', role: 'user', phone: '' })
    setMessage({ text: '', type: '' })
    setShowPassword(false)
    setOtpStep(false)
    setFirstTimeStep(false)
    setOtpValue('')
    setShowAuthPage(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Route to correct dashboard based on role
  if (user) {
    switch (user.role) {
      case 'superadmin':
        return <SuperAdminDashboard user={user} onLogout={handleLogout} />
      case 'admin':
        return <AdminDashboard user={user} onLogout={handleLogout} />
      default:
        return <UserDashboard user={user} onLogout={handleLogout} />
    }
  }

  return (
    <>
      {showAuthPage ? (
        <div className="auth-page-wrapper">
          <button className="auth-back-btn" onClick={() => setShowAuthPage(false)}>
            <ArrowRight size={18} style={{ transform: 'rotate(180deg)', marginRight: '8px' }} />
            <span>Back to Home</span>
          </button>

          <div className="container">
            {/* Left Side: Gradient Promo */}
            <div className="auth-split-left">
              <h2>{isLogin ? (firstTimeStep ? "Secure Your Account" : "Hello, Friend!") : "Welcome Back!"}</h2>
              <p>
                {isLogin
                  ? (firstTimeStep ? "Set your password using OTP verification to get started." : "Enter your personal details and start your journey with us")
                  : "To keep connected with us please login with your personal info"}
              </p>
              <button className="ghost-btn" onClick={() => { setIsLogin(!isLogin); setFirstTimeStep(false); }}>
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </div>

            {/* Right Side: Form */}
            <div className="auth-split-right">
              <h2>{firstTimeStep ? "Set Password" : (isLogin ? "Sign in" : "Create Account")}</h2>

              <div className="social-container">
                <div className="social-item"><Facebook size={20} /></div>
                <div className="social-item"><Chrome size={20} /></div>
                <div className="social-item"><Linkedin size={20} /></div>
              </div>

              <span className="form-divider">
                {firstTimeStep === 'verify' ? "Enter OTP sent to your email" :
                  (firstTimeStep === 'request' ? "Enter your email to set password" :
                    (otpStep ? "Enter verification code" : (isLogin ? "or use your account" : "or register with your details")))}
              </span>

              {firstTimeStep === 'request' ? (
                <form className="auth-form" onSubmit={handleFirstTimeRequest}>
                  <div className="auth-input-group">
                    <input type="email" placeholder="Registered Email" className="auth-input" value={firstTimeData.email} onChange={(e) => setFirstTimeData({ ...firstTimeData, email: e.target.value })} required />
                  </div>
                  <div className="auth-input-group password-input-wrapper">
                    <input type={showPassword ? "text" : "password"} placeholder="New Password" className="auth-input" value={firstTimeData.newPassword} onChange={(e) => setFirstTimeData({ ...firstTimeData, newPassword: e.target.value })} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  {message.text && <div className={`form-message ${message.type}`}>{message.text}</div>}
                  <button type="submit" className="submit-btn" disabled={loading}>{loading ? "Processing..." : "Get OTP"}</button>
                  <button type="button" style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => setFirstTimeStep(false)}>Back to Login</button>
                </form>
              ) : firstTimeStep === 'verify' ? (
                <form className="auth-form" onSubmit={handleFirstTimeVerify}>
                  <div className="auth-input-group">
                    <input type="text" placeholder="Enter 6-digit OTP" className="auth-input" value={firstTimeData.otp} onChange={(e) => setFirstTimeData({ ...firstTimeData, otp: e.target.value })} required maxLength={6} style={{ letterSpacing: '8px', fontSize: '1.2rem', textAlign: 'center' }} />
                  </div>
                  {message.text && <div className={`form-message ${message.type}`}>{message.text}</div>}
                  <button type="submit" className="submit-btn" disabled={loading}>{loading ? "Verifying..." : "Verify & Set Password"}</button>
                  <button type="button" style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => setFirstTimeStep('request')}>Resend / Correct Email</button>
                </form>
              ) : otpStep ? (
                <form className="auth-form" onSubmit={handleVerifyOtp}>
                  <div className="auth-input-group">
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      className="auth-input"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                      required
                      maxLength={6}
                      textAlign="center"
                      style={{ letterSpacing: '8px', fontSize: '1.2rem', textAlign: 'center' }}
                    />
                  </div>
                  {message.text && (
                    <div className={`form-message ${message.type}`}>
                      {message.text}
                    </div>
                  )}
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? "Verifying..." : "Verify Account"}
                  </button>
                  <button type="button" className="ghost-btn" style={{ marginTop: '1rem', color: 'var(--text-secondary)' }} onClick={handleResendOtp}>
                    Resend OTP
                  </button>
                </form>
              ) : (
                <form className="auth-form" onSubmit={handleSubmit}>
                  {!isLogin && (
                    <div className="auth-input-group">
                      <input
                        name="username"
                        type="text"
                        placeholder="Full Name"
                        className="auth-input"
                        value={form.username}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  )}
                  <div className="auth-input-group">
                    <input
                      name="email"
                      type="email"
                      placeholder="Email"
                      className="auth-input"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {!isLogin && (
                    <div className="auth-input-group">
                      <input
                        name="phone"
                        type="tel"
                        placeholder="Phone Number"
                        className="auth-input"
                        value={form.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  )}
                  <div className="auth-input-group password-input-wrapper">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="auth-input"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {isLogin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); setFirstTimeStep('request'); }} style={{ color: 'var(--accent-color)', fontWeight: '700' }}>First Time Login? Setup Password</a>
                        <a href="#" className="forgot-link">Forgot password?</a>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Tip: New users added by Admin should use "First Time Login" to set their password.</p>
                    </div>
                  )}

                  {message.text && (
                    <div className={`form-message ${message.type}`}>
                      {message.text}
                    </div>
                  )}

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (isLogin ? "Signing in..." : "Sending OTP...") : (isLogin ? "Sign In" : "Sign Up & Send OTP")}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="landing-container">
          <div className="bg-mesh"></div>

          <nav className="landing-nav">
            <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
              <div className="logo-icon"><Building2 size={20} strokeWidth={2.5} /></div>
              <span>apartment super app</span>
            </div>
            <div className="nav-links">
              <button className="nav-link" onClick={() => scrollToSection('intelligence')}>Intelligence</button>
              <button className="nav-link" onClick={() => scrollToSection('payments')}>Payments</button>
              <button className="nav-link" onClick={() => scrollToSection('community')}>Community</button>
            </div>
            <button className="signin-btn" onClick={() => openAuth('login')}>
              Sign In <ArrowRight size={18} />
            </button>
          </nav>

          <header className="hero">
            <div className="hero-content">
              <div className="badge">
                <Sparkles size={14} />
                <span>Modern Living Reimagined</span>
              </div>
              <h1 className="animate-in">
                The <span>Total</span> <br />
                Apartment <br />
                Experience
              </h1>
              <p className="animate-in" style={{ animationDelay: '0.1s' }}>
                A single platform for smart health scores, seamless payments, and community essence.
                Experience the intersection of high-end design and proactive property management.
              </p>
              <div className="cta-group animate-in" style={{ animationDelay: '0.2s' }}>
                <button className="btn-primary" onClick={() => openAuth('register')}>
                  Start Journey <ArrowRight size={18} />
                </button>
                <button className="btn-outline" onClick={() => scrollToSection('intelligence')}>Explore Alpha</button>
              </div>
            </div>
            <div className="hero-image-wrapper animate-in" style={{ animationDelay: '0.3s' }}>
              <img
                src="/interior_hero_1_1772111147254.png"
                alt="Minimalist Living"
                className="hero-image"
              />
            </div>
          </header>

          <section id="intelligence" className="app-preview" style={{ padding: '8rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center' }}>
              <div className="hero-image-wrapper">
                <img
                  src="/app_dashboard_feature_1772111512801.png"
                  alt="App Dashboard"
                  className="hero-image"
                  style={{ borderRight: '15px solid var(--bg-secondary)', borderBottom: '15px solid var(--bg-secondary)', borderShadow: 'none' }}
                />
              </div>
              <div className="hero-content">
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', color: 'var(--primary)', marginBottom: '1.5rem' }}>Intelligent Dashboard</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '2rem' }}>
                  Monitor your property's <strong>Health Score</strong> in real-time. Our AI analyzes financial data, expenses, and pending payments to provide
                  resident-friendly insights and proactive risk assessments.
                </p>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  {['Health Score', 'Maintenance Alerts', 'Expense Reports'].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}></div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="payments" className="features-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4rem', padding: '8rem 4rem', maxWidth: '1400px', margin: '0 auto'
          }}>
            {[
              {
                title: "Maintenance & Payments",
                desc: "Pay service dues instantly with detailed breakdown. AI-driven explanations for expense fluctuations keep you informed.",
                list: ['One-tap Payments', 'Invoice History', 'AI Clarification']
              },
              {
                title: "Complaints & Service",
                desc: "Raise and track maintenance requests. AI auto-categorization ensures the right vendor is assigned with priority.",
                list: ['Active Tracking', 'Vendor Assignment', 'AI Categorizer']
              },
              {
                title: "Meetings & Social",
                desc: "Announce meetings and vote on polls. AI generates concise summaries of decisions and action items for the community.",
                list: ['Smart Voting', 'Minutes Summary', 'Moderated Feed']
              }
            ].map((f, i) => (
              <div key={i} className="feature-card" style={{
                padding: '3rem 0',
                borderTop: '1px solid var(--bg-accent)',
                textAlign: 'left'
              }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: '500', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>{f.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {f.list.map(l => (
                    <div key={l} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 4, height: 1, background: 'var(--accent)' }}></div>
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section id="community" style={{ padding: '8rem 4rem', maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ position: 'relative' }}>
              <img
                src="/community_essence_1772111533093.png"
                alt="Community"
                style={{ width: '100%', height: '500px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: 'rgba(255, 255, 255, 0.9)', padding: '4rem', width: '80%', maxWidth: '800px',
                backdropFilter: 'blur(10px)', border: '1px solid var(--bg-accent)'
              }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>The Community Essence</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.8' }}>
                  Foster a safe and vibrant community with our moderated social feed.
                  From buying and selling to event announcements, we bring the neighborhood closer with intelligent moderation.
                </p>
              </div>
            </div>
          </section>

          <Footer />
        </div>
      )}
    </>
  )
}

export default App
