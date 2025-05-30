import React, { useState, useEffect } from 'react';
import './Header.css';
import logo from './Headerassets/logo.png';
import avatarIcon from './Headerassets/avatar.svg';
import { ReactComponent as CartIcon } from './Headerassets/cart.svg';
import { FaSearch } from 'react-icons/fa';
import { useNavigate, Link, useLocation } from 'react-router-dom'; 

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleCartClick = () => {
    navigate('/ShoppingCart');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setShowProfile(false);
    navigate('/login');
  };

  const profile = () => {
    navigate('/Dashboard');
  }

  const products = () => {
    navigate('/product');
  }

  const FAQ = () => {
    navigate('/Faq');
  }

  const isHome = location.pathname === '/';

  return (
    <header className="the-header">
      <div className="the-header-left">
        <Link to="/" className="home-link">
          <img src={logo} alt="Logo" className="logo" />
          <span className={`site-title ${isHome ? 'active' : ''}`}>Metalworks</span>
        </Link>
      </div>

      <div className="the-header-right">
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit"><FaSearch /></button>
        </form>

        <button className="cart-btn" onClick={handleCartClick}>
          <CartIcon className="cart-icon" />
        </button>

        <div className="profile-container">
          <button className="profile-btn" onClick={() => setShowProfile(!showProfile)}>
            <img src={avatarIcon} alt="Profile" className="profile-icon" />
          </button>
          {showProfile && (
            <div className="profile-dropdown">
              <p className="profile-name">{user?.firstName} {user?.lastName}</p>
              <p className="profile-email">{user?.email}</p>
              <button className="logout-btn" onClick={profile}>Profile</button>
              <button className="logout-btn" onClick={products}>Products</button>
              <button className="logout-btn" onClick={FAQ}>FAQ</button>
              <button className="logout-btn" onClick={handleLogout}>Log out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
