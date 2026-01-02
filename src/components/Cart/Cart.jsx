import { useCart } from '../../context/CartContext';
import './Cart.css';

const Cart = ({ isOpen, onClose }) => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <div className={`cart-overlay ${isOpen ? 'open' : ''}`}>
      <div className={`cart-panel ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>Tu Carrito</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="cart-body">
          {cartItems.length === 0 ? (
            <p className="empty-cart">Tu carrito está vacío.</p>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.imagen} alt={item.nombre} />
                <div className="item-details">
                  <p className="item-name">{item.nombre}</p>
                  <p className="item-price">${item.precio.toFixed(2)}</p>
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="remove-item-btn">&times;</button>
              </div>
            ))
          )}
        </div>
        <div className="cart-footer">
          <div className="cart-total">
            <p>Total:</p>
            <p>${cartTotal.toFixed(2)}</p>
          </div>
          <button className="checkout-btn">Finalizar Compra</button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
