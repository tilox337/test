import { useState } from "react";
import "./styles/Cart.css";
import TimeChooseDisplay from "./TimeChooseDispaly";

function Cart({
  cart = [],
  isCartOpen = false,
  onCloseCart,
  onAdd,
  onRemove,
  onClear,
  totalItems = 0,
  totalPrice = 0,
}) {
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState(null);

  if (!isCartOpen) return null;

  const getTelegramUser = () => {
    if (!window.Telegram?.WebApp) {
      alert("Откройте приложение внутри Telegram");
      return null;
    }

    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe?.user;

    if (!user) {
      tg.showAlert(
        "Не удалось получить данные пользователя Telegram. Попробуйте открыть приложение повторно.",
      );
      return null;
    }

    return user;
  };

  const handleTimeSelect = (selectedTime) => {
    setDeliveryTime(selectedTime);
    setIsTimePickerOpen(false);
  };

  const formatDeliveryTime = (time) => {
    if (!time) return "Не выбрано";
    return `${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}`;
  };

  return (
    <>
      <div className="cart-overlay" onClick={onCloseCart}>
        <div className="cart-window" onClick={(e) => e.stopPropagation()}>
          <div className="cart-header">
            <h2>Корзина</h2>
            <button
              onClick={onCloseCart}
              type="button"
              aria-label="Закрыть корзину"
            >
              ✕
            </button>
          </div>

          {cart.length === 0 ? (
            <p className="cart-empty">Пока товаров нет</p>
          ) : (
            <>
              <ul className="cart-list">
                {cart.map(({ product, variant, qty }) => (
                  <li
                    key={`${product.id}-${variant?.id ?? "base"}`}
                    className="cart-item"
                  >
                    <div className="cart-item-text">
                      <span>{product.text}</span>
                      <small>{variant?.name ?? "основной"}</small>
                    </div>
                    <div className="cart-item-controls">
                      <button
                        onClick={() =>
                          onRemove(product, variant ?? product.variants[0])
                        }
                        type="button"
                      >
                        -
                      </button>
                      <span>{qty}</span>
                      <button
                        onClick={() =>
                          onAdd(product, variant ?? product.variants[0])
                        }
                        disabled={
                          qty >=
                          (variant?.stock ?? product.variants[0]?.stock ?? 0)
                        }
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="cart-summary">
                <div>
                  <span>Товаров</span>
                  <strong>{totalItems}</strong>
                </div>
                <div>
                  <span>Итого</span>
                  <strong>{totalPrice} ₽</strong>
                </div>
                <div className="cart-delivery-row">
                  <span>Время</span>
                  <button
                    type="button"
                    className="cart-time-button"
                    onClick={() => setIsTimePickerOpen(true)}
                  >
                    {formatDeliveryTime(deliveryTime)}
                  </button>
                </div>
              </div>

              <div className="cart-actions">
                <button className="cart-clear" onClick={onClear} type="button">
                  Очистить
                </button>
                <button
                  className="cart-order"
                  type="button"
                  onClick={async () => {
                    const telegramUser = getTelegramUser();
                    if (!telegramUser) return;

                    if (!deliveryTime) {
                      setIsTimePickerOpen(true);
                      return;
                    }

                    try {
                      const response = await fetch(
                        "http://localhost:3000/api/orders",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            initData: window.Telegram?.WebApp?.initData || "",
                            items: cart.map(({ product, variant, qty }) => ({
                              productId: product.id,
                              variantId: variant?.id || product.variants[0]?.id,
                              quantity: qty,
                            })),
                            deliveryTime,
                          }),
                        },
                      );

                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(
                          data.message || "Неизвестная ошибка сервера",
                        );
                      }

                      const alertMessage =
                        `Заказ создан! ID: ${data.id} \n` + response.status ===
                        202
                          ? `Напишите менеджеру ID закза чтобы получить координаты и видео с места встречи.`
                          : ``;
                      window.Telegram?.WebApp.showAlert(alertMessage);
                      setDeliveryTime(null);
                      onClear();
                    } catch (err) {
                      console.error("Ошибка отправки заказа:", err);
                      window.Telegram?.WebApp.showAlert(
                        `Ошибка: ${err.message}\n Напишите менеджеру, и он поможет решить сложившуюсь ситуацию`,
                      );
                    }
                  }}
                >
                  Заказать
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <TimeChooseDisplay
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        onSelect={handleTimeSelect}
        selectedTime={deliveryTime}
      />
    </>
  );
}

export default Cart;
