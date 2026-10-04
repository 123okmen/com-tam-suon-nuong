import { useState } from 'react';
import { CATEGORIES, fmtVND } from '../lib/store';
import type { MenuItem } from '../lib/store';
import './MenuItemCard.css';

interface Props {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  /** Giá hiển thị thay thế (vd: khuyến mãi). Không truyền → dùng item.price. */
  overridePrice?: number;
  qtyInCart?: number;
}

/** Ô món ăn dùng chung cho Gọi món / POS / Nhân viên. Tự hiện emoji khi chưa có ảnh hoặc ảnh lỗi. */
export default function MenuItemCard({ item, onAdd, overridePrice, qtyInCart = 0 }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const cat = CATEGORIES.find(c => c.id === item.category);
  const showImg = item.img && !imgFailed;
  const price = overridePrice ?? item.price;

  return (
    <button type="button" className="menu-card" onClick={() => onAdd(item)}>
      {qtyInCart > 0 && <span className="menu-card__badge">{qtyInCart}</span>}
      {showImg ? (
        <img
          className="menu-card__img"
          src={import.meta.env.BASE_URL + item.img}
          alt={item.name}
          loading="lazy"
          width={160}
          height={80}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="menu-card__img menu-card__img--emoji" style={{ background: (cat?.color || '#334155') + '22' }}>
          {cat?.emoji || '🍽️'}
        </div>
      )}
      <div className="menu-card__name">{item.name}</div>
      {item.description && <div className="menu-card__desc">{item.description}</div>}
      <div className="menu-card__price">
        {overridePrice !== undefined && overridePrice !== item.price && (
          <s className="menu-card__old">{fmtVND(item.price)}</s>
        )}
        {fmtVND(price)}
      </div>
    </button>
  );
}
