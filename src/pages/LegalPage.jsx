import './LegalPage.css';

const LegalPage = ({ title }) => {
  return (
    <div className="site-container" style={{ padding: '24px 16px' }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#111827' }}>{title}</h1>
    </div>
  );
};

export default LegalPage;
