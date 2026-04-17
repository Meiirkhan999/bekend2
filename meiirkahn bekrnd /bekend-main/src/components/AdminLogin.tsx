import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

interface AdminLoginProps {
  onSwitchToUser: () => void;
}

export const AdminLogin = ({ onSwitchToUser }: AdminLoginProps) => {
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(email, password);
      window.history.pushState({}, '', '/admin');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err: any) {
      setError(err?.message || 'Админ ретінде кіру мүмкін емес');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>Әкімші жүйесіне кіру</h1>
        <p>Төмендегі жазбаны пайдаланып кіруге болады:</p>
        <div className="admin-login-info">
          <p><strong>Email:</strong> admin@gmail.com</p>
          <p><strong>Пароль:</strong> 123456</p>
        </div>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Пароль
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="admin-login-button" disabled={loading}>
            {loading ? 'Кіру...' : 'Әкімші ретінде кіру'}
          </button>
        </form>
        <button type="button" className="admin-login-link" onClick={onSwitchToUser}>
          Қолданушы бетіне қайту
        </button>
      </div>
    </div>
  );
};
