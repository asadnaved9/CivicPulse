import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Super Admin login page — accessible only via direct URL /login/super-admin.
 * Not linked from anywhere in the citizen UI.
 */
const SuperAdminLoginPage: React.FC = () => {
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
      navigate('/super-admin/dashboard', { replace: true });
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
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-3)', fontSize: '12px', marginBottom: 32, padding: 0,
          }}
        >
          <ArrowLeft size={14} />
          Back to site
        </button>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--warning-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={18} color="var(--warning)" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                CIVICPULSE
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
                Super Admin Portal
              </div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.5 }}>
            Restricted to platform administrators only. Full system access is granted upon successful authentication.
          </p>
        </div>

        {/* Security notice */}
        <div style={{
          padding: '10px 14px',
          background: 'var(--warning-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          fontSize: '11px',
          color: 'var(--text-2)',
          marginBottom: 20,
          lineHeight: 1.5,
        }}>
          ⚠️ This portal has unrestricted write access to all platform data. Ensure you are on a secured network.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="sa-email" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>
              Email address
            </label>
            <input
              id="sa-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="superadmin@civicpulse.in"
              required
              autoComplete="email"
              style={{
                padding: '10px 12px', borderRadius: 6,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-1)', fontSize: '13px', outline: 'none', width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="sa-password" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="sa-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                style={{
                  padding: '10px 40px 10px 12px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  color: 'var(--text-1)', fontSize: '13px', outline: 'none', width: '100%',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex',
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
            style={{
              marginTop: 8, padding: '11px', borderRadius: 6,
              background: 'var(--warning)', color: '#1A1A1A',
              fontWeight: 700, fontSize: '13px', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'Authenticating…' : 'Sign In — Super Admin'}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5, textAlign: 'center' }}>
          This login is not publicly linked. All access attempts are logged.
        </p>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;
