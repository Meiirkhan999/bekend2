import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { LabSupply } from '../data/supplies';
import { labSupplies as initialSupplies } from '../data/supplies';
import { Header } from './Header';
import './LabSupplyFinder.css';

const createPlaceholderImage = (title: string) => {
  const encoded = encodeURIComponent(title);
  return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='280' viewBox='0 0 420 280'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2361A7FF' /%3E%3Cstop offset='100%25' stop-color='%23B9D7FF' /%3E%3C/linearGradient%3E%3Cstyle%3E .title%7Bfill:%23fff;font-family:sans-serif;font-size:18px;font-weight:700;%7D .subtitle%7Bfill:%23f5f5f5;font-family:sans-serif;font-size:14px;%7D %3C/style%3E%3C/defs%3E%3Crect width='420' height='280' rx='24' fill='url(%23g)' /%3E%3Ctext x='50%25' y='45%25' text-anchor='middle' class='title' dominant-baseline='middle'%3E${encoded}%3C/text%3E%3C/svg%3E`;
};

const getSupplyImageUrl = (supply: LabSupply) => supply.imageUrl || createPlaceholderImage(supply.name);

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const categoryLabel = (category: string) => {
  if (category === 'All') return 'Барлығы';
  if (category === 'Equipment') return 'Жабдық';
  if (category === 'Reagent') return 'Реактив';
  return 'Тұтынушы';
};

const StarRating = ({ value }: { value: number }) => (
  <span className="rating-stars">
    {Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={index < value ? 'active' : ''}>
        ★
      </span>
    ))}
  </span>
);

export const LabSupplyFinder = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Equipment' | 'Reagent' | 'Consumable'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('price');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LabSupply[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<LabSupply | null>(null);
  const [favorites, setFavorites] = useState<LabSupply[]>([]);
  const [compareList, setCompareList] = useState<LabSupply[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const { user } = useAuth();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({ quantity: 1, notes: '' });
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Math.min(...initialSupplies.map((supply) => supply.price)),
    Math.max(...initialSupplies.map((supply) => supply.price)),
  ]);
  const [pageTransition, setPageTransition] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', 'Equipment', 'Reagent', 'Consumable'] as const;

  useEffect(() => {
    const savedFavorites = localStorage.getItem('labSupplyFavorites');
    const savedCompare = localStorage.getItem('labSupplyCompare');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedCompare) setCompareList(JSON.parse(savedCompare));
  }, []);

  useEffect(() => {
    localStorage.setItem('labSupplyFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('labSupplyCompare', JSON.stringify(compareList));
  }, [compareList]);

  const handleFavoritesUpdate = (newFavorites: LabSupply[]) => {
    setFavorites(newFavorites);
  };

  const handleCompareUpdate = (newCompare: LabSupply[]) => {
    setCompareList(newCompare);
  };

  const handlePriceChange = (index: 0 | 1, value: number) => {
    setPriceRange(([min, max]) => {
      const next = index === 0 ? [Math.min(value, max), max] : [min, Math.max(value, min)];
      return next as [number, number];
    });
  };

  const filterBySearchAndCategory = (list: LabSupply[]) => {
    const query = searchQuery.trim().toLowerCase();
    return list.filter((supply) => {
      const matchesSearch =
        !query ||
        [supply.name, supply.description, supply.category, supply.manufacturer ?? '']
          .some((field) => field.toLowerCase().includes(query));

      const matchesCategory = selectedCategory === 'All' || supply.category === selectedCategory;
      const matchesPrice = supply.price >= priceRange[0] && supply.price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });
  };

  const sortedSupplies = useMemo(() => {
    const activeList = showFavorites ? favorites : initialSupplies;
    const filtered = filterBySearchAndCategory(activeList);
    return filtered.sort((a, b) => {
      const direction = order === 'asc' ? 1 : -1;
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name) * direction;
      }
      if (sortBy === 'rating') {
        const diff = (a.rating ?? 0) - (b.rating ?? 0);
        return diff !== 0 ? diff * direction : a.name.localeCompare(b.name) * direction;
      }
      return (a.price - b.price) * direction;
    });
  }, [favorites, order, priceRange, selectedCategory, searchQuery, showFavorites, sortBy]);

  const total = sortedSupplies.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageStart = (page - 1) * limit;
  const paginatedSupplies = sortedSupplies.slice(pageStart, pageStart + limit);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, priceRange, showFavorites, sortBy, order, limit]);

  useEffect(() => {
    if (!selectedSupply || !sortedSupplies.some((item) => item.id === selectedSupply.id)) {
      setSelectedSupply(sortedSupplies[0] || null);
    }
  }, [selectedSupply, sortedSupplies]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const list = initialSupplies
      .filter((supply) => {
        const matchField =
          supply.name.toLowerCase().includes(lowerQuery) ||
          supply.description.toLowerCase().includes(lowerQuery) ||
          supply.category.toLowerCase().includes(lowerQuery) ||
          (supply.manufacturer ?? '').toLowerCase().includes(lowerQuery);
        const matchesCategory = selectedCategory === 'All' || supply.category === selectedCategory;
        return matchField && matchesCategory;
      })
      .slice(0, 6);
    setSuggestions(list);
    setShowSuggestions(list.length > 0);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    setLoading(true);
    const timeout = window.setTimeout(() => setLoading(false), 180);
    return () => window.clearTimeout(timeout);
  }, [searchQuery, selectedCategory, priceRange, sortBy, order, showFavorites, page, limit]);

  const handleSuggestionClick = (supply: LabSupply) => {
    setSearchQuery(supply.name);
    setShowSuggestions(false);
    setSelectedSupply(supply);
    setPage(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedSupply(null);
  };

  const handleSupplyClick = (supply: LabSupply) => {
    setSelectedSupply(supply);
  };

  const toggleFavorite = (supply: LabSupply) => {
    const isFavorited = favorites.some((item) => item.id === supply.id);
    handleFavoritesUpdate(isFavorited ? favorites.filter((item) => item.id !== supply.id) : [...favorites, supply]);
  };

  const toggleCompare = (supply: LabSupply) => {
    const isComparing = compareList.some((item) => item.id === supply.id);
    if (isComparing) {
      handleCompareUpdate(compareList.filter((item) => item.id !== supply.id));
      return;
    }
    if (compareList.length >= 3) {
      alert('Максимум 3 өнімді салыстыруға болады');
      return;
    }
    handleCompareUpdate([...compareList, supply]);
  };

  const isFavorited = (supply: LabSupply) => favorites.some((item) => item.id === supply.id);
  const isComparing = (supply: LabSupply) => compareList.some((item) => item.id === supply.id);

  const getAvailabilityClass = (availability: string) => {
    switch (availability) {
      case 'In Stock':
        return 'availability-in-stock';
      case 'Out of Stock':
        return 'availability-out-of-stock';
      case 'On Order':
        return 'availability-on-order';
      default:
        return '';
    }
  };

  const changePage = (newPage: number) => {
    setPageTransition(true);
    setPage(newPage);
    window.setTimeout(() => setPageTransition(false), 280);
  };

  const goToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="lab-supply-finder">
      <Header
        favoritesCount={favorites.length}
        compareCount={compareList.length}
        onShowFavorites={() => setShowFavorites((prev) => !prev)}
        onShowCompare={() => setShowCompare((prev) => !prev)}
        isAdmin={user?.role === 'admin'}
        onShowAdmin={goToAdmin}
      />

      <div className="finder-container">
        <aside className="search-sidebar">
          <div className="sidebar-card sticky-panel">
            <div className="sidebar-header">
              <div>
                <p className="sidebar-tag">Smart search</p>
                <h2>Жылдам сүзгілеу</h2>
              </div>
              <span className="sidebar-chip">{showFavorites ? 'Таңдаулар' : 'Өнімдер'}</span>
            </div>

            <label className="sidebar-label" htmlFor="smartSearch">
              Іздеу
            </label>
            <div className="search-box sidebar-search">
              <input
                id="smartSearch"
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="атауы, сипаттамасы, категориясы..."
                className="search-input"
              />
              <span className="search-icon">🔍</span>
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown sidebar-suggestions">
                  {suggestions.map((suggestion) => (
                    <button key={suggestion.id} type="button" className="suggestion-item" onClick={() => handleSuggestionClick(suggestion)}>
                      <strong>{suggestion.name}</strong>
                      <small>{suggestion.category}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <label>Категория</label>
              <div className="sidebar-filters">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`filter-chip ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {categoryLabel(category)}
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <label>Баға диапазоны</label>
              <div className="range-values">
                <span>{formatCurrency(priceRange[0])}</span>
                <span>{formatCurrency(priceRange[1])}</span>
              </div>
              <div className="range-sliders">
                <input
                  type="range"
                  min={Math.min(...initialSupplies.map((s) => s.price))}
                  max={Math.max(...initialSupplies.map((s) => s.price))}
                  value={priceRange[0]}
                  onChange={(e) => handlePriceChange(0, Number(e.target.value))}
                />
                <input
                  type="range"
                  min={Math.min(...initialSupplies.map((s) => s.price))}
                  max={Math.max(...initialSupplies.map((s) => s.price))}
                  value={priceRange[1]}
                  onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                />
              </div>
            </div>

            <div className="sidebar-section">
              <label>Сұрыптау</label>
              <div className="sort-controls">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'rating')}>
                  <option value="price">Баға</option>
                  <option value="name">Атау</option>
                  <option value="rating">Рейтинг</option>
                </select>
                <select value={order} onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')}>
                  <option value="asc">Өсу</option>
                  <option value="desc">Кему</option>
                </select>
              </div>
            </div>

            <div className="sidebar-section">
              <label>Беттегі өнім</label>
              <div className="sort-controls">
                <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                </select>
              </div>
            </div>

            <div className="sidebar-section sidebar-actions-row">
              <button type="button" className={`pill-btn ${showFavorites ? 'active' : ''}`} onClick={() => setShowFavorites((prev) => !prev)}>
                ⭐ Таңдаулар
              </button>
              <button type="button" className={`pill-btn ${showCompare ? 'active' : ''}`} onClick={() => setShowCompare((prev) => !prev)}>
                🔄 Салыстыру
              </button>
            </div>

            <div className="sidebar-footer">
              <span>{showFavorites ? favorites.length : total} өнім</span>
              <span>Бет {page} / {totalPages}</span>
            </div>
          </div>
        </aside>

        <main className="content-area">
          <section className="supplies-list-container">
            <div className="panel-header">
              <div>
                <p className="panel-tag">Жаңа дизайн</p>
                <h2>{showFavorites ? 'Таңдаулы өнімдер' : 'Өнім каталогы'}</h2>
              </div>
              <div className="panel-meta">
                <span>{total} нәтиже</span>
                <span>{showFavorites ? 'Тек таңдаулар' : 'Smart сүзу'}</span>
              </div>
            </div>

            {loading && (
              <div className="skeleton-grid">
                {Array.from({ length: limit }).map((_, idx) => (
                  <div key={idx} className="supply-card skeleton-card">
                    <div className="skeleton-image" />
                    <div className="skeleton-line short" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line small" />
                  </div>
                ))}
              </div>
            )}

            {!loading && (
              <div className={`supplies-list ${pageTransition ? 'page-transition' : ''}`}>
                {paginatedSupplies.length > 0 ? (
                  paginatedSupplies.map((supply) => (
                    <div
                      key={supply.id}
                      className={`supply-card ${selectedSupply?.id === supply.id ? 'selected' : ''}`}
                      onClick={() => handleSupplyClick(supply)}
                    >
                      <img
                        src={getSupplyImageUrl(supply)}
                        alt={supply.name}
                        className="supply-image"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = createPlaceholderImage(supply.name);
                        }}
                      />
                      <div className="supply-header">
                        <div>
                          <h3>{supply.name}</h3>
                          <p className="subtitle">{supply.manufacturer}</p>
                        </div>
                        <div className="supply-actions">
                          <button
                            type="button"
                            className={`action-btn ${isFavorited(supply) ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(supply);
                            }}
                            title="Таңдаулыларға қосу"
                          >
                            ⭐
                          </button>
                          <button
                            type="button"
                            className={`action-btn ${isComparing(supply) ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompare(supply);
                            }}
                            title="Салыстыруға қосу"
                          >
                            🔄
                          </button>
                        </div>
                      </div>
                      <div className="supply-meta-row">
                        <span className="category-tag">{supply.category}</span>
                        <span className={`availability ${getAvailabilityClass(supply.availability)}`}>
                          {supply.availability}
                        </span>
                      </div>
                      <p className="supply-description">{supply.description}</p>
                      <div className="rating-row">
                        <StarRating value={Math.round(supply.rating ?? 4)} />
                        <span className="rating-value">{(supply.rating ?? 4).toFixed(1)}</span>
                      </div>
                      <div className="supply-footer">
                        <span className="price">{formatCurrency(supply.price)}</span>
                        <a
                          href={supply.purchaseLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="purchase-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          🔗 Сілтеме
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    <p>Өнімдер табылмады.</p>
                    <p>Сұрыптау мен сүзгілерді өзгертіп көріңіз.</p>
                  </div>
                )}
              </div>
            )}

            {!loading && (
              <div className="pagination-controls">
                <button type="button" className="page-btn" onClick={() => changePage(Math.max(1, page - 1))} disabled={page <= 1}>
                  ⬅️ Алдыңғы
                </button>
                <span>Бет {page} of {totalPages}</span>
                <button type="button" className="page-btn" onClick={() => changePage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                  Келесі ➡️
                </button>
              </div>
            )}
          </section>

          <section className="supply-detail-container">
            {selectedSupply ? (
              <div className="supply-detail-card">
                <img
                  src={getSupplyImageUrl(selectedSupply)}
                  alt={selectedSupply.name}
                  className="detail-image"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = createPlaceholderImage(selectedSupply.name);
                  }}
                />
                <div className="detail-content">
                  <div className="detail-heading">
                    <span className="detail-tag">{selectedSupply.category}</span>
                    <h2>{selectedSupply.name}</h2>
                  </div>

                  <div className="detail-row">
                    <div>
                      <label>Сипаттамасы</label>
                      <p>{selectedSupply.description}</p>
                    </div>
                    <div>
                      <label>Баға</label>
                      <p className="price-large">{formatCurrency(selectedSupply.price)}</p>
                    </div>
                  </div>

                  <div className="detail-row">
                    <div>
                      <label>Қолда бар лығы</label>
                      <p className={`availability-large ${getAvailabilityClass(selectedSupply.availability)}`}>
                        {selectedSupply.availability}
                      </p>
                    </div>
                    <div>
                      <label>Рейтинг</label>
                      <div className="rating-stars detail-rating">
                        {Array.from({ length: 5 }, (_, index) => (
                          <span key={index} className={index < (selectedSupply.rating ?? 4) ? 'active' : ''}>
                            ★
                          </span>
                        ))}
                        <span className="rating-value detail-value">{(selectedSupply.rating ?? 4).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-row detail-row-split">
                    <div>
                      <label>Өндіруші</label>
                      <p>{selectedSupply.manufacturer || 'Белгісіз'}</p>
                    </div>
                    <div>
                      <label>Сатып алу сілтемесі</label>
                      <a href={selectedSupply.purchaseLink} target="_blank" rel="noopener noreferrer" className="purchase-link detail-link">
                        🔗 Төлем бетіне өту
                      </a>
                    </div>
                  </div>

                  <div className="detail-buttons">
                    <button
                      type="button"
                      className={`btn-detail-action favorite ${isFavorited(selectedSupply) ? 'active' : ''}`}
                      onClick={() => toggleFavorite(selectedSupply)}
                    >
                      {isFavorited(selectedSupply) ? '❤️ Таңдаулыдан алу' : '🤍 Таңдаулыларға қосу'}
                    </button>
                    <button
                      type="button"
                      className={`btn-detail-action compare ${isComparing(selectedSupply) ? 'active' : ''}`}
                      onClick={() => toggleCompare(selectedSupply)}
                    >
                      {isComparing(selectedSupply) ? '🔄 Салыстырудан алу' : '🔄 Салыстыруға қосу'}
                    </button>
                  </div>

                  <button type="button" className="btn-request" onClick={() => setShowRequestForm((prev) => !prev)}>
                    📬 Сұраныс жіберу
                  </button>

                  {showRequestForm && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        alert(`✅ Сұраныс жіберілді!\n\nӨнім: ${selectedSupply.name}\nСаны: ${requestData.quantity}\nЕскертпе: ${requestData.notes || 'жоқ'}`);
                        setRequestData({ quantity: 1, notes: '' });
                        setShowRequestForm(false);
                      }}
                      className="request-form"
                    >
                      <div className="form-group">
                        <label>Саны</label>
                        <input
                          type="number"
                          min="1"
                          value={requestData.quantity}
                          onChange={(e) => setRequestData({ ...requestData, quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Ескертпе</label>
                        <textarea
                          value={requestData.notes}
                          onChange={(e) => setRequestData({ ...requestData, notes: e.target.value })}
                          placeholder="Қосымша мәлімет..."
                        />
                      </div>
                      <button type="submit" className="btn-submit-request">
                        ✅ Жіберу
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="detail-placeholder">
                <h3>Өнім таңдаңыз</h3>
                <p>Оң жағынан карточкаға басып, өнімнің толық ақпаратын көре аласыз.</p>
              </div>
            )}
          </section>
        </main>
      </div>

      {showCompare && compareList.length > 0 && (
        <div className="compare-overlay">
          <div className="compare-panel">
            <div className="compare-header">
              <h2>🔎 Өнімдерді салыстыру</h2>
              <button type="button" className="close-btn" onClick={() => setShowCompare(false)}>
                ✕
              </button>
            </div>
            <div className="compare-list">
              {compareList.map((supply) => (
                <div key={supply.id} className="compare-card">
                  <img src={getSupplyImageUrl(supply)} alt={supply.name} />
                  <h3>{supply.name}</h3>
                  <p>{supply.category}</p>
                  <p>{formatCurrency(supply.price)}</p>
                  <button type="button" onClick={() => toggleCompare(supply)}>
                    ✖️ Өшіру
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
