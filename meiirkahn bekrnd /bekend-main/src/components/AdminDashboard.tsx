import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { LabSupply } from '../data/supplies';
import { Header } from './Header';
import { AdminPanel } from './AdminPanel';
import './AdminPanel.css';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

type AdminTab = 'users' | 'supplies' | 'dashboard';

interface AdminDashboardProps {
  onClose: () => void;
}

interface SummaryStats {
  productsCount: number;
  usersCount: number;
  favoritesCount: number;
}

export const AdminDashboard = ({ onClose }: AdminDashboardProps) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [users, setUsers] = useState<UserData[]>([]);
  const [supplies, setSupplies] = useState<LabSupply[]>([]);
  const [stats, setStats] = useState<SummaryStats>({ productsCount: 0, usersCount: 0, favoritesCount: 0 });
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<LabSupply | null>(null);
  const [supplySearch, setSupplySearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Equipment' | 'Reagent' | 'Consumable'>('All');
  const apiBase = import.meta.env.VITE_BACKEND_URL || '';
  const token = localStorage.getItem('labSupplyToken') || '';

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, usersRes, suppliesRes] = await Promise.all([
        fetch(`${apiBase}/api/admin/summary`, { headers }),
        fetch(`${apiBase}/api/admin/users`, { headers }),
        fetch(`${apiBase}/api/supplies?limit=200`, { headers }),
      ]);

      if (!summaryRes.ok || !usersRes.ok || !suppliesRes.ok) {
        throw new Error('API fetch failed');
      }

      const summaryData = await summaryRes.json();
      const usersData = await usersRes.json();
      const suppliesData = await suppliesRes.json();

      setStats({
        productsCount: summaryData.productsCount,
        usersCount: summaryData.usersCount,
        favoritesCount: summaryData.favoritesCount,
      });
      setUsers(usersData.users || []);
      setSupplies(suppliesData.supplies || []);
    } catch (error) {
      console.error('Admin fetchData error', error);
    } finally {
      setLoading(false);
    }
  }, [apiBase, headers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSupplies = useMemo(() => {
    const query = supplySearch.toLowerCase().trim();
    return supplies.filter((supply) => {
      const matchesSearch =
        !query ||
        supply.name.toLowerCase().includes(query) ||
        supply.description.toLowerCase().includes(query) ||
        (supply.brand ?? supply.manufacturer ?? '').toLowerCase().includes(query);

      return categoryFilter === 'All' || supply.category === categoryFilter ? matchesSearch : false;
    });
  }, [categoryFilter, supplySearch, supplies]);

  const handleAddSupply = async (supply: LabSupply) => {
    try {
      const response = await fetch(`${apiBase}/api/supplies`, {
        method: 'POST',
        headers,
        body: JSON.stringify(supply),
      });
      if (!response.ok) {
        throw new Error('Failed to create supply');
      }
      const createdSupply = await response.json();
      setSupplies((prev) => [createdSupply, ...prev]);
      setIsPanelOpen(false);
    } catch (error) {
      console.error('handleAddSupply error', error);
      alert('Жаңа өнімді қосу кезінде қате пайда болды');
    }
  };

  const handleEditSupply = async (supply: LabSupply) => {
    try {
      const response = await fetch(`${apiBase}/api/supplies/${supply.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(supply),
      });
      if (!response.ok) {
        throw new Error('Failed to update supply');
      }
      const updatedSupply = await response.json();
      setSupplies((prev) => prev.map((item) => (item.id === updatedSupply.id ? updatedSupply : item)));
      setIsPanelOpen(false);
      setEditingSupply(null);
    } catch (error) {
      console.error('handleEditSupply error', error);
      alert('Өнімді жаңарту кезінде қате пайда болды');
    }
  };

  const handleDeleteSupply = async (id: string) => {
    if (!window.confirm('Осы өнімді жойғыңыз келе ме?')) {
      return;
    }
    try {
      const response = await fetch(`${apiBase}/api/supplies/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        throw new Error('Failed to delete supply');
      }
      setSupplies((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('handleDeleteSupply error', error);
      alert('Өнімді өшіру кезінде қате пайда болды');
    }
  };

  const openEditPanel = (supply: LabSupply) => {
    setEditingSupply(supply);
    setIsPanelOpen(true);
  };

  const openAddPanel = () => {
    setEditingSupply(null);
    setIsPanelOpen(true);
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (loading) {
    return <div className="admin-dashboard">Құптелуде...</div>;
  }

  return (
    <div className="admin-dashboard">
      <Header
        favoritesCount={0}
        compareCount={0}
        isAdmin={false}
        onShowFavorites={() => {}}
        onShowCompare={() => {}}
      />
      <div className="admin-container">
        <div className="admin-sidebar">
          <div className="admin-info">
            <div className="admin-avatar">⚙️</div>
            <div className="admin-details">
              <h3>{user?.name}</h3>
              <p>{user?.email}</p>
              <p className="admin-role">👑 Admin</p>
            </div>
          </div>

          <nav className="admin-nav">
            <button className="nav-item" onClick={onClose}>
              ◀️ Қайту
            </button>
            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Есептемесі
            </button>
            <button
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 Пайдаланушылар
            </button>
            <button
              className={`nav-item ${activeTab === 'supplies' ? 'active' : ''}`}
              onClick={() => setActiveTab('supplies')}
            >
              📦 Өндіктер
            </button>
            <button className="nav-item logout" onClick={handleLogout}>
              🚪 Шығу
            </button>
          </nav>
        </div>

        <div className="admin-main">
          {activeTab === 'dashboard' && (
            <section className="admin-section">
              <h1>📊 Админ Панел</h1>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.usersCount}</div>
                    <div className="stat-label">Барлығы пайдаланушылар</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📦</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.productsCount}</div>
                    <div className="stat-label">Барлығы өнімдер</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.favoritesCount}</div>
                    <div className="stat-label">Таңдаулар</div>
                  </div>
                </div>
              </div>

              <div className="recent-section">
                <h2>Соңғы пайдаланушылар</h2>
                {users.length > 0 ? (
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>Есім</th>
                        <th>Email</th>
                        <th>Рөлі</th>
                        <th>Тіркелген күні</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 5).map((userData) => (
                        <tr key={userData.id}>
                          <td>{userData.name}</td>
                          <td>{userData.email}</td>
                          <td>
                            <span className={`role-badge ${userData.role}`}>
                              {userData.role === 'admin' ? '👑 Admin' : '👤 Пайдаланушы'}
                            </span>
                          </td>
                          <td>{new Date(userData.createdAt).toLocaleDateString('kk-KZ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data">Пайдаланушылар жоқ</p>
                )}
              </div>
            </section>
          )}

          {activeTab === 'users' && (
            <section className="admin-section">
              <h1>👥 Пайдаланушылар</h1>
              {users.length === 0 ? (
                <p className="no-data">Пайдаланушылар жоқ</p>
              ) : (
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Есім</th>
                        <th>Email</th>
                        <th>Рөлі</th>
                        <th>Тіркелген күні</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((userData) => (
                        <tr key={userData.id}>
                          <td>{userData.name}</td>
                          <td>{userData.email}</td>
                          <td>
                            <span className={`role-badge ${userData.role}`}>
                              {userData.role === 'admin' ? '👑 Admin' : '👤 Пайдаланушы'}
                            </span>
                          </td>
                          <td>{new Date(userData.createdAt).toLocaleDateString('kk-KZ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === 'supplies' && (
            <section className="admin-section">
              <div className="admin-panel-header">
                <div>
                  <h1>📦 Өнімдерді басқару</h1>
                  <p>Жаңа өнімдер қосып, өнімдерді өңдеп және жою.</p>
                </div>
                <button className="btn-add-supply" onClick={openAddPanel}>
                  ➕ Жаңа өнім қосу
                </button>
              </div>

              <div className="admin-filters-row">
                <input
                  type="text"
                  placeholder="Өнімдерді іздеу..."
                  value={supplySearch}
                  onChange={(e) => setSupplySearch(e.target.value)}
                  className="search-field"
                />
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as any)}>
                  <option value="All">Барлығы</option>
                  <option value="Equipment">Жабдық</option>
                  <option value="Reagent">Реактив</option>
                  <option value="Consumable">Тұтынушы</option>
                </select>
              </div>

              {filteredSupplies.length === 0 ? (
                <p className="no-data">Өнімдер табылмады</p>
              ) : (
                <div className="supplies-table-container">
                  <table className="supplies-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Атауы</th>
                        <th>Категория</th>
                        <th>Баға</th>
                        <th>Қолда бар</th>
                        <th>Әрекеттер</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSupplies.map((supply) => (
                        <tr key={supply.id}>
                          <td className="cell-id">{supply.id}</td>
                          <td className="cell-name">{supply.name}</td>
                          <td className="cell-category">{supply.category}</td>
                          <td className="cell-price">${supply.price?.toFixed(2) ?? 0}</td>
                          <td className="cell-availability">
                            <span className={`availability-badge ${supply.availability.replace(' ', '-').toLowerCase()}`}>
                              {supply.availability}
                            </span>
                          </td>
                          <td className="cell-actions">
                            <button className="btn-edit" onClick={() => openEditPanel(supply)} title="Өңдеу">
                              ✏️
                            </button>
                            <button className="btn-delete" onClick={() => handleDeleteSupply(supply.id)} title="Жою">
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {isPanelOpen && (
        <AdminPanel
          supply={editingSupply}
          onClose={() => {
            setIsPanelOpen(false);
            setEditingSupply(null);
          }}
          onSubmit={editingSupply ? handleEditSupply : handleAddSupply}
        />
      )}
    </div>
  );
};
