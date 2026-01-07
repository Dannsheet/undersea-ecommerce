import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import './CartPage.css';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user, profile, session } = useAuth(); // <-- Obtener el perfil del usuario

  const handleCheckout = async () => {

    if (!user || !profile) { // <-- Verificar que el perfil también esté cargado
      toast.error('Por favor, inicia sesión para finalizar la compra.');
      return;
    }

    const adminPhoneNumber = '593963868146'; // <-- ACTION REQUIRED: REPLACE WITH YOUR REAL WHATSAPP NUMBER

    const itemsForDb = cartItems.map((item) => ({
      producto_id: item.producto_id,
      color: item.color,
      talla: item.talla,
      cantidad: item.quantity,
    }));

    // 1. Formatear mensaje para WhatsApp
    const orderItemsText = cartItems.map(item => 
      `- ${item.nombre} (x${item.quantity}) - $${(item.precio * item.quantity).toFixed(2)}`
    ).join('\n');

    let orderId = null;

    // 2. Preparar y enviar email de confirmación
    const templateParams = {
      to_name: profile.nombre || user.email, // <-- Usar el nombre del perfil
      to_email: user.email, // <-- El email siempre viene del objeto user de Supabase Auth
      order_details: orderItemsText.replace(/\n/g, '<br>'), // Usar <br> para saltos de línea en HTML
      total_amount: cartTotal.toFixed(2),
    };

    try {

      const {
        data: { session: liveSession },
      } = await supabase.auth.getSession();

      const accessToken = liveSession?.access_token || session?.access_token;

      if (!accessToken) {
        throw new Error('Sesión inválida: no se encontró access_token');
      }
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-order', {
        body: { items: itemsForDb },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (orderError) {
        throw orderError;
      }

      orderId = orderData?.orderId || null;

      const whatsappMessage = `¡Nuevo pedido!\n\nID: ${orderId || 'N/A'}\nCliente: ${profile.nombre || 'No especificado'}\nEmail: ${user.email}\n\nDetalles:\n${orderItemsText}\n\nTotal: $${cartTotal.toFixed(2)}`;
      const whatsappUrl = `https://wa.me/${adminPhoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_USER_ID
      );
      toast.success('¡Pedido realizado! Revisa tu correo para más detalles.');

      // 3. Abrir WhatsApp y limpiar carrito
      window.open(whatsappUrl, '_blank');
      clearCart();

    } catch (error) {
      console.error('Error al enviar el correo:', error);
      toast.error('Hubo un problema al procesar tu pedido. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div className="cart-page-container">
      <h1>Tu Carrito</h1>
      {cartItems.length === 0 ? (
        <div className="empty-cart-message">
          <p>Tu carrito está vacío.</p>
          <Link to="/" className="btn-primary">Seguir comprando</Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items-list">
            {cartItems.map(item => (
              <div key={item.id} className="cart-page-item">
                <img src={item.imagen} alt={item.nombre} className="item-image" />
                <div className="item-info">
                  <h2>{item.nombre}</h2>
                  <p className="item-price">${item.precio.toFixed(2)}</p>
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="remove-button">&times;</button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h2>Resumen de Compra</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <button className="btn-checkout" onClick={handleCheckout}>Finalizar Compra</button>
            <div className="payment-methods-placeholder">
              {/* Futuro botón para pasarela de pago */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;