import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Zap, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Admin login page — accessible only via direct URL /login/admin.
 * Not linked from anywhere in the citizen UI.
 * On successful sign-in, role is read from Firestore.
 * If role !== 'admin', RequireRole will show AccessDenied on redirect.
 */
const AdminLoginPage: React.FC = () => {
  const { loginWithEmailPassword, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Email and password are required.');
      return;
    }
    try {
      await loginWithEmailPassword(email.trim(), password);
      navigate('/admin/dashboard', { replace: true });
    } catch {
      // error already toasted in loginWithEmailPassword
    }
  }, [email, password, loginWithEmailPassword, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Back link */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-3)',
            fontSize: '12px',
            marginBottom: 32,
            padding: 0,
          }}
        >
          <ArrowLeft size={14} />
          Back to site
        </button>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36,
              borderRadius: '50%',
              background: 'var(--primary-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                CIVICPULSE
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
                Municipality Admin Portal
              </div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.5 }}>
            Sign in with your administrator credentials. Access is restricted to authorised municipal personnel only.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="admin-email" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>
              Email address
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@municipality.gov.in"
              required
              autoComplete="email"
              className="form-input"
              style={{
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-1)',
                fontSize: '13px',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="admin-password" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                style={{
                  padding: '10px 40px 10px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-1)',
                  fontSize: '13px',
                  outline: 'none',
                  width: '100%',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-3)', display: 'flex',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              marginTop: 8,
              padding: '11px',
              borderRadius: 6,
              background: 'var(--primary)',
              color: 'var(--bg)',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? 'Signing in…' : 'Sign In to Admin Portal'}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5, textAlign: 'center' }}>
          Admin credentials are issued by the Super Admin. Contact your platform administrator if you need access.
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
