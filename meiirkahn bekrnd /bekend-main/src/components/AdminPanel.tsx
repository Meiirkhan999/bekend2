import { useEffect, useState } from 'react';
import type { LabSupply } from '../data/supplies';
import './AdminPanel.css';

interface AdminPanelProps {
  supply: LabSupply | null;
  onSubmit: (supply: LabSupply) => void;
  onClose: () => void;
}

export const AdminPanel = ({ supply, onSubmit, onClose }: AdminPanelProps) => {
  const [formData, setFormData] = useState<Partial<LabSupply>>({
    name: supply?.name || '',
    category: supply?.category || 'Equipment',
    description: supply?.description || '',
    price: supply?.price || 0,
    availability: supply?.availability || 'In Stock',
    brand: supply?.brand || supply?.manufacturer || '',
    imageUrl: supply?.imageUrl || '',
    externalLink: supply?.externalLink || supply?.purchaseLink || '',
    inStock: supply?.inStock ?? true,
    rating: supply?.rating ?? 4,
    quantity: supply?.quantity ?? 1,
    location: supply?.location || '',
  });

  useEffect(() => {
    setFormData({
      name: supply?.name || '',
      category: supply?.category || 'Equipment',
      description: supply?.description || '',
      price: supply?.price || 0,
      availability: supply?.availability || 'In Stock',
      brand: supply?.brand || supply?.manufacturer || '',
      imageUrl: supply?.imageUrl || '',
      externalLink: supply?.externalLink || supply?.purchaseLink || '',
      inStock: supply?.inStock ?? true,
      rating: supply?.rating ?? 4,
      quantity: supply?.quantity ?? 1,
      location: supply?.location || '',
    });
  }, [supply]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'price' || e.target.name === 'rating' || e.target.name === 'quantity'
        ? Number(value)
        : e.target.name === 'inStock'
        ? value
        : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      id: supply?.id || `SUP-${Date.now()}`,
      name: formData.name?.trim() || '',
      category: (formData.category || 'Equipment') as 'Equipment' | 'Reagent' | 'Consumable',
      description: formData.description || '',
      price: Number(formData.price || 0),
      availability: (formData.availability || 'In Stock') as 'In Stock' | 'Out of Stock' | 'On Order',
      brand: formData.brand || '',
      manufacturer: formData.brand || formData.manufacturer || '',
      imageUrl: formData.imageUrl || '',
      externalLink: formData.externalLink || '',
      purchaseLink: formData.externalLink || '',
      inStock: Boolean(formData.inStock),
      rating: Number(formData.rating || 4),
      quantity: Number(formData.quantity || 0),
      location: formData.location || '',
    } as LabSupply);
  };

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <h2>{supply ? 'Өнімді өңдеу' : 'Жаңа өнім қосу'}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Атауы *</label>
              <input name="name" value={formData.name || ''} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Категория *</label>
              <select name="category" value={formData.category} onChange={handleInputChange}>
                <option value="Equipment">Жабдық</option>
                <option value="Reagent">Реактив</option>
                <option value="Consumable">Тұтынушы</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Сипаттамасы *</label>
            <textarea name="description" rows={3} value={formData.description || ''} onChange={handleInputChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Баға ($) *</label>
              <input name="price" type="number" min="0" step="0.01" value={formData.price ?? 0} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Қолда бар лығы *</label>
              <select name="availability" value={formData.availability} onChange={handleInputChange}>
                <option value="In Stock">Қолда бар</option>
                <option value="Out of Stock">Қолда жоқ</option>
                <option value="On Order">Заказ бойынша</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Өндіруші</label>
              <input name="brand" value={formData.brand || ''} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Сурет URL</label>
              <input name="imageUrl" value={formData.imageUrl || ''} onChange={handleInputChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Сыртқы сілтеме</label>
              <input name="externalLink" value={formData.externalLink || ''} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Қоймада бар</label>
              <input name="inStock" type="checkbox" checked={Boolean(formData.inStock)} onChange={handleInputChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Рейтинг</label>
              <input name="rating" type="number" min="0" max="5" value={formData.rating ?? 4} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Саны</label>
              <input name="quantity" type="number" min="0" value={formData.quantity ?? 0} onChange={handleInputChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Орналасқан орны</label>
            <input name="location" value={formData.location || ''} onChange={handleInputChange} />
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn-submit">
              {supply ? 'Сақтау' : 'Қосу'}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Болдырмау
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
