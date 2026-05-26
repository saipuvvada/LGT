import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // If user is already logged in, redirect to home
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/')
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // Only redirect on an actual sign-in, not on INITIAL_SESSION
      if (event === 'SIGNED_IN' && session) {
        navigate('/')
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [navigate])

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',   // always show Google account picker
          access_type: 'offline',
        }
      }
    })
    if (error) {
      console.log(error)
      alert(error.message)
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    if (error) {
      alert(error.message)
    } else {
      setEmailSent(true)
    }
  }

  return (
    <div style={styles.shell}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logo}>
          AGRO<span style={{ color: '#6fcf7c' }}>DEALS</span>
        </div>
        <p style={styles.tagline}>Your Trusted Agri Input Partner</p>

        <h2 style={styles.heading}>Sign in to continue</h2>

        {/* Google Button */}
        <button onClick={signInWithGoogle} style={styles.googleBtn} id="google-login-btn">
          <svg width="20" height="20" viewBox="0 0 48 48" style={{ marginRight: 10 }}>
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Continue with Google
        </button>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or use email</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Magic Link */}
        {emailSent ? (
          <div style={styles.successBox}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <h3 style={{ margin: '0 0 8px' }}>Check your email!</h3>
            <p style={{ color: '#666', margin: 0, fontSize: 14 }}>
              We sent a magic login link to <strong>{email}</strong>. Click it to sign in instantly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} style={styles.form}>
            <input
              id="email-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" disabled={loading} style={styles.submitBtn} id="magic-link-btn">
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}

const styles = {
  shell: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a3a2a 0%, #2d7a4f 60%, #1a3a2a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'Inter, sans-serif'
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center'
  },
  logo: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: '-1px',
    color: '#1a3a2a',
    marginBottom: 4
  },
  tagline: {
    fontSize: 12,
    color: '#888',
    margin: '0 0 28px'
  },
  heading: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1a3a2a',
    marginBottom: 24
  },
  googleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '13px 20px',
    background: 'white',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    color: '#333',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '24px 0'
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#eee'
  },
  dividerText: {
    fontSize: 12,
    color: '#aaa',
    whiteSpace: 'nowrap'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  input: {
    width: '100%',
    padding: '13px 16px',
    borderRadius: '10px',
    border: '1.5px solid #ddd',
    fontSize: '15px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box'
  },
  submitBtn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #2d7a4f, #1a3a2a)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  successBox: {
    background: '#f0faf4',
    border: '1px solid #6fcf7c',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center'
  }
}
