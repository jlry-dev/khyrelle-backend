import { useNavigate } from 'react-router-dom';
import './Home.css';
import { useAppStore } from '../../stores/useStore';
import Overlay from '../../Components/Overlay/Overlay.js';
import ironShieldImage from '../../assets/iron_shield.png';
import steelArmorImage from '../../assets/steel_armor.png';
import steelSwordImage from '../../assets/steel_sword.png';
import kristineImage from '../../assets/kristine.png';
import deborahImage from '../../assets/deborah.png';
import jereveImage from '../../assets/jereve.png';
import icon from '../../assets/icon.jpg';
import banner from '../../assets/bannerr.png';
import character from '../../assets/guide.png';

export default function Home() {
  const { openOverlay } = useAppStore();
  const navigate = useNavigate();

  const images = {
    icons: {
      services: icon,
      events: icon,
      promos: icon,
    },
    deals: {
      ironShield: ironShieldImage,
      steelArmor: steelArmorImage,
      steelSword: steelSwordImage,
    },
    blacksmiths: {
      kristine: kristineImage,
      deborah: deborahImage,
      jereve: jereveImage,
    },
    heroBanner: banner,
    charac: character
  };

  const dealItems = [
    { 
      id: 2, 
      title: 'IRON SHIELD', 
      price: '900', 
      description: 'Forged with precision for warriors', 
      onSale: true,
      image: images.deals.ironShield
    },
    { 
      id: 3, 
      title: 'STEEL ARMOR',  
      price: '900', 
      description: 'Protective gear for brave fighters', 
      onSale: true,
      image: images.deals.steelArmor
    },
    { 
      id: 1, 
      title: 'STEEL SWORD', 
      price: '800', 
      description: 'Legendary weapon for champions', 
      onSale: true,
      image: images.deals.steelSword
    },
  ];

  const blacksmiths = [
    { id: 1, name: 'Blacksmith Kristine', image: images.blacksmiths.kristine },
    { id: 2, name: 'Elven Deborah', image: images.blacksmiths.deborah },
    { id: 3, name: 'Dwarven Jereve', image: images.blacksmiths.jereve },
  ];

  return (
     <div className="dashboard">

      <Overlay />

      <div 
  className="hero-section" 
  style={{ 
    backgroundImage: `url(${images.heroBanner})`,
    width: '100%',
    height: '250px', 
    backgroundSize: 'cover',
    backgroundPosition: 'center', 
    backgroundRepeat: 'no-repeat', 
    paddingTop: '50px'
  }}
></div>
 
 <div 
  className="charac-section" 
  style={{ 
    backgroundImage: `url(${images.charac})`,
    width: '200px',
    height: '200px', 
    backgroundSize: 'cover',
    backgroundPosition: 'center', 
    backgroundRepeat: 'no-repeat', 
    paddingTop: '20px',
    justifyContent: 'center',
    display: 'flex',
    margin: 'auto',
    marginTop: '-150px'
  }}
></div>

      <div className="quick-access-buttons">
        <button 
          className="overlay-trigger services-btn"
          onClick={() => openOverlay('services')}
        >
          <span className="btn-icon">🔧</span> Services
        </button>
        <button 
          className="overlay-trigger events-btn"
          onClick={() => openOverlay('events')}
        >
          <span className="btn-icon">🎉</span> Events
        </button>
        <button 
          className="overlay-trigger promos-btn"
          onClick={() => openOverlay('promos')}
        >
          <span className="btn-icon">💰</span> Promos
        </button>
      </div>

      <div className="section">
        <h3 className="section-title">Best Deals</h3>
        <div className="deals-grid">
          {dealItems.map((item) => (
            <div key={item.id} className="deal-card">
              <div className="deal-image">
                <img src={item.image} alt={item.title} />
                {item.onSale && <span className="sale-badge">SALE</span>}
              </div>
              <div className="deal-info">
                <h4 className="deal-title">{item.title}</h4>
                <p className="deal-description">{item.description}</p>
                <div className="deal-price-row">
                  <span className="deal-price">{item.price}</span>
                  <button 
                    className="buy-button" 
                    onClick={() => navigate(`/productdetails/${item.id}`)}
                  >
                    VIEW DEAL
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Blacksmiths Section */}
      <div className='blacksmith'>
        <div className="blacksmiths-section">
          <h3 className="section-title">Top Blacksmiths</h3>
          <div className="blacksmiths-grid">
            {blacksmiths.map((smith) => (
              <div key={smith.id} className="blacksmith-card">
                <div className="blacksmith-image">
                  <img src={smith.image} alt={smith.name} />
                </div>
                <p className="blacksmith-name">{smith.name}</p>
              </div>
            ))}
          </div>
          <div className="view-all-row">
            <span className="view-all-text"><a href='/list'>VIEW BLACKSMITH LIST</a></span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="feature">
          <h4 className="feature-title">Your trusted forge for heavy and crafting with skill.</h4>
          <p className="feature-text">Join our artisans.</p>
        </div>
        <div className="limited-deals">
          <h4 className="limited-deals-title">Limited-Time Deals</h4>
          <p className="limited-deals-text">Expires in 12h 24m 45s!</p>
        </div>
      </div>
    </div>
  );
}