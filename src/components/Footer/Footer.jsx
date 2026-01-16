import { FaCcMastercard, FaCcVisa, FaFacebookF, FaInstagram, FaUniversity } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
import './Footer.css';

const STORE_CONTACT = {
  location: 'av. universitaria 2 calle 7',
  email: 'underseaweb@gmail.com',
  phoneOrdersE164: '+593963859875',
  phoneDannyE164: '+593000000000',
  developerWhatsApp: '+593995826144', // Reemplazar con tu número de WhatsApp
};

const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/underseapro',
  instagram: 'https://www.instagram.com/underseapro/',
  tiktok: 'https://www.tiktok.com/@rosi_orosi?lang=es-419',
};

const Footer = () => {
  const orderTelHref = `tel:${STORE_CONTACT.phoneOrdersE164}`;
  const mailHref = `mailto:${STORE_CONTACT.email}`;
  const developerWhatsAppHref = `https://wa.me/${STORE_CONTACT.developerWhatsApp.replace(/[^\d]/g, '')}`;

  return (
    <div className="site-footer-wrapper">
      <section className="footer-payment-strip" aria-label="Compra segura">
        <div className="footer-payment-inner">
          <span className="footer-payment-title">COMPRA SEGURA :</span>
          <div className="footer-payment-logos" aria-label="Métodos de pago">
            <FaCcVisa className="footer-payment-icon" aria-hidden="true" />
            <FaCcMastercard className="footer-payment-icon" aria-hidden="true" />
            <div className="footer-payment-bank" aria-label="Transferencia bancaria">
              <FaUniversity className="footer-payment-icon" aria-hidden="true" />
              <span className="footer-payment-bank-text">Transferencia bancaria</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-grid">
            <div className="footer-col footer-col-contact">
              <h3 className="footer-col-title">CONTACTO</h3>
              <p className="footer-text">{STORE_CONTACT.location}</p>
              <a className="footer-link" href={mailHref}>
                {STORE_CONTACT.email}
              </a>
            </div>

            <div className="footer-col footer-col-help">
              <h3 className="footer-col-title">AYUDA</h3>
              <a className="footer-link" href={orderTelHref}>
                Contáctenos
              </a>
            </div>

            <div className="footer-col footer-col-site">
              <h3 className="footer-col-title">INFORMACIÓN DEL SITIO</h3>
              <a className="footer-link" href="/terminos-y-condiciones">
                Términos y condiciones
              </a>
              <a className="footer-link" href="/politicas-de-privacidad">
                Políticas de privacidad
              </a>
              <a className="footer-link" href="/cambios-y-devoluciones">
                Políticas de Cambios y Devoluciones
              </a>
            </div>

            <div className="footer-col footer-col-social footer-social">
              <div className="footer-social-icons">
                <a className="footer-social-link" href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer">
                  <FaFacebookF aria-label="Facebook" />
                </a>
                <a className="footer-social-link" href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer">
                  <FaInstagram aria-label="Instagram" />
                </a>
                <a className="footer-social-link" href={SOCIAL_LINKS.tiktok} target="_blank" rel="noreferrer">
                  <FaTiktok aria-label="TikTok" />
                </a>
              </div>
            </div>
          </div>

          <div className="site-footer-bottom">
            <span>UNDERSEA 2026 © Todos los derechos reservados |</span>
            <a className="footer-link" href={developerWhatsAppHref} target="_blank" rel="noreferrer">
              Contactar desarrollador
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
