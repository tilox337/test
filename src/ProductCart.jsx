import { useState } from "react";
import defaultImage from "./assets/image.png";

function ProductCart({ product, qty = 0, getVariantQty, onAdd, onRemove }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [variantQty, setVariantQty] = useState(() => {
    const initial = {};
    const variants = product?.variants?.length
      ? product.variants
      : [{ id: "base", name: "основной", price: product?.price ?? 0 }];

    variants.forEach((variant) => {
      initial[variant.id] = 0;
    });

    return initial;
  });

  const imgSrc =
    product && product.image
      ? `http://localhost:3000/api/products/image/${product.image}`
      : defaultImage;
  const text = product && product.text ? product.text : "товар";
  const variants =
    product && Array.isArray(product.variants) && product.variants.length
      ? product.variants.map((variant) => ({
          ...variant,
          price: product.price,
        }))
      : [{ id: "base", name: "основной", price: product?.price ?? 0 }];

  const updateVariantQty = (variantId, delta) => {
    setVariantQty((prev) => ({
      ...prev,
      [variantId]: Math.max(0, (prev[variantId] ?? 0) + delta),
    }));
  };

  const totalSelectedQty = Object.values(variantQty).reduce(
    (sum, value) => sum + value,
    0,
  );

  const handleAddSelected = () => {
    if (!onAdd || totalSelectedQty === 0) return;

    variants.forEach((variant) => {
      const versionQty = variantQty[variant.id] ?? 0;
      if (versionQty > 0) {
        onAdd(product, variant, versionQty);
      }
    });

    setVariantQty(() => {
      const next = {};
      variants.forEach((variant) => {
        next[variant.id] = 0;
      });
      return next;
    });
    setModalOpen(false);
  };

  const handleQuickRemove = () => {
    if (!onRemove) return;

    const defaultVariant = variants[0];
    onRemove(product, defaultVariant, 1);
  };

  return (
    <div className="product-card-wrapper">
      <button
        type="button"
        className="product-card"
        onClick={() => setModalOpen(true)}
      >
        <img src={imgSrc} alt={text} className="product-card-image" />
        <p className="product-card-title">{text}</p>
        <div className="product-card-price-box">
          <span>{variants[0].price} ₽</span>
        </div>
      </button>

      {modalOpen && (
        <div
          className="product-modal-overlay"
          onClick={() => setModalOpen(false)}
        >
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-header">
              <h3>{text}</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>

            <img src={imgSrc} alt={text} className="product-modal-image" />

            <div className="product-modal-list">
              {variants.map((variant) => {
                const itemQty = variantQty[variant.id] ?? 0;
                const cartQty = getVariantQty?.(product, variant) ?? 0;
                const minusDisabled = itemQty === 0;
                const plusDisabled = itemQty + cartQty >= variant.stock;
                return (
                  <div key={variant.id} className="product-modal-item">
                    <div className="product-modal-item-info">
                      <span>{variant.name}</span>
                      <strong>{variant.price} ₽</strong>
                    </div>

                    <div className="product-modal-controls">
                      <button
                        type="button"
                        onClick={() => updateVariantQty(variant.id, -1)}
                        disabled={minusDisabled}
                      >
                        -
                      </button>
                      <span>{itemQty}</span>
                      <button
                        type="button"
                        onClick={() => updateVariantQty(variant.id, 1)}
                        disabled={plusDisabled}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="product-modal-footer">
              <div className="product-modal-summary">
                <span>Выбрано</span>
                <strong>{totalSelectedQty}</strong>
              </div>
              <div className="product-modal-actions">
                <button
                  type="button"
                  className="product-modal-cancel"
                  onClick={() => setModalOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="product-modal-add"
                  onClick={handleAddSelected}
                  disabled={totalSelectedQty === 0}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductCart;
