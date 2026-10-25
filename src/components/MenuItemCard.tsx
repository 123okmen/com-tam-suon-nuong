import { useState } from 'react';
import { CATEGORIES, fmtVND } from '../lib/store';
import type { MenuItem } from '../lib/store';
import './MenuItemCard.css';

interface Props {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  overridePrice?: number;
  qtyInCart?: number;
}

function getItemEmoji(item: MenuItem, fallback: string): string {
  const n = item.name.toLowerCase();
  if (n.includes('trứng')) return '🍳';
  if (n.includes('gà xối mỡ') || n.includes('gà chiên') || n.includes('gà rán')) return '🍗';
  if (n.includes('hải sản') || n.includes('tôm')) return '🦐';
  if (n.includes('bò lúc lắc') || n.includes('bò xào') || n.includes('xào bò')) return '🥩';
  if (n.includes('sườn')) return '🍖';
  if (n.includes('mì giòn')) return '🍝';
  if (n.includes('hủ tiếu')) return '🍜';
  if (n.includes('bbk') || n.includes('bánh bao')) return '🥟';
  if (n.includes('hamburger')) return '🍔';
  if (n.includes('sandwich')) return '🥪';
  if (n.includes('mì cay')) return '🌶️';
  if (n.includes('mì trộn')) return '🥢';
  if (n.includes('bánh tráng')) return '🥗';
  if (n.includes('xúc xích')) return '🌭';
  if (n.includes('phô mai')) return '🧀';
  if (n.includes('pepsi') || n.includes('coca') || n.includes('trà đá')) return '🥤';
  return fallback;
}

export default function MenuItemCard({ item, onAdd, overridePrice, qtyInCart = 0 }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const cat = CATEGORIES.find(c => c.id === item.category);
  const showImg = item.img && !imgFailed;
  const price = overridePrice ?? item.price;
  const emoji = getItemEmoji(item, cat?.emoji || '🍽️');

  const imgSrc = item.img
    ? (item.img.startsWith('http')
        ? item.img
        : (import.meta.env.BASE_URL + item.img).replace(/\/+/g, '/').replace(/^\//, (import.meta.env.BASE_URL.startsWith('/') ? '/' : './')))
    : '';

  return (
    <div className={`menu-card ${qtyInCart > 0 ? 'in-cart' : ''}`}>
      <div className="menu-card__media" onClick={() => onAdd(item)} role="button" tabIndex={0}>
        {showImg ? (
          <img
            className="menu-card__img"
            src={imgSrc}
            alt={item.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="menu-card__img menu-card__img--emoji"
            style={{
              background: `linear-gradient(135deg, ${(cat?.color || '#f59e0b')}33 0%, rgba(15, 23, 42, 0.85) 100%)`,
              borderBottom: `2px solid ${(cat?.color || '#f59e0b')}66`
            }}
          >
            {emoji}
          </div>
        )}
        <div className="menu-card__overlay" />
        {item.badge && <span className="menu-card__tag">{item.badge}</span>}
        {qtyInCart > 0 && <span className="menu-card__badge">{qtyInCart}</span>}
      </div>

      <div className="menu-card__body">
        <h3 className="menu-card__name" title={item.name} onClick={() => onAdd(item)}>
          {item.name}
        </h3>
        {item.description && (
          <p className="menu-card__desc" title={item.description}>
            {item.description}
          </p>
        )}
        <div className="menu-card__footer">
          <div className="menu-card__pricing">
            {overridePrice !== undefined && overridePrice !== item.price && (
              <s className="menu-card__old">{fmtVND(item.price)}</s>
            )}
            <span className="menu-card__price">{fmtVND(price)}</span>
          </div>
          <button
            type="button"
            className="menu-card__add-btn"
            onClick={(e) => { e.stopPropagation(); onAdd(item); }}
            aria-label={`Thêm ${item.name}`}
          >
            {qtyInCart > 0 ? `+ Thêm (${qtyInCart})` : '+ Chọn'}
          </button>
        </div>
      </div>
    </div>
  );
}
