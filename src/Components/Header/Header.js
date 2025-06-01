// Header.js (Using AuthProvider, CartProvider, and Retaining Design)
import React, { useState } from 'react'; 
// Removed useEffect for localStorage, as AuthProvider handles this
import './Header.css'; 

import logo from './Headerassets/logo.png'; 
import avatarIcon from './Headerassets/avatar.svg';
import { ReactComponent as CartIcon } from './Headerassets/cart.svg'; 
import { FaSearch } from 'react-icons/fa';
import { useNavigate, Link, useLocation } from 'react-router-dom'; 
import { useAuth } from '../../data/AuthProvider'; // Adjust path
import { useCart } from '../../data/CartProvider'; // Adjust path

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false); // Using this state name
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get state and functions from AuthProvider and CartProvider
  const { isAuthenticated, user, logout, isLoadingAuth } = useAuth(); 
  const { itemCount } = useCart(); 

  // LocalStorage direct access is removed, AuthProvider manages user state

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      // Navigate to your dedicated SearchResultsPage with the search query
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`); 
      setSearchTerm(''); // Clear search term after navigation
    } else {
      // If search term is empty, do nothing or navigate to a general products page
      // navigate('/products'); // Example if you want to navigate on empty search
      console.log("Search term is empty.");
    }
  };

  const handleCartClick = () => {
    navigate('/ShoppingCart'); // Or '/cart' - ensure this matches your App.js routes
  };

  const handleLogout = () => {
    logout(); // Call logout from AuthContext
    setShowProfileDropdown(false);  
    navigate('/login');             
  };

  // Renaming these to match your second example's intent for clarity,
  // but they still just navigate.
  const profile = () => { // This will be navigateToProfileDashboard
    setShowProfileDropdown(false); 
    navigate('/dashboard'); 
  };

  const products = () => { // This will be navigateToProducts
    setShowProfileDropdown(false);
    navigate('/product'); // Using '/products' consistently
  };

  const FAQ = () => { // This will be navigateToFAQ
    setShowProfileDropdown(false);
    navigate('/Faq'); // Ensure this route exists
  };

  const isHome = location.pathname === '/';

  // Loading state from AuthProvider
  if (isLoadingAuth) {
    return (
        <header className="the-header">
            <div className="the-header-left">
                <Link to="/" className="home-link">
                <img src={logo} alt="Logo" className="logo" />
                <span className={`site-title ${isHome ? 'active' : ''}`}>Metalworks</span>
                </Link>
            </div>
            {/* Minimal header during auth loading to prevent layout shift */}
            <div className="the-header-right" style={{ minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                {/* You can add a small loading indicator here if desired */}
            </div>
        </header>
    );
  }

  return (
    <header className="the-header">
      <div className="the-header-left">
        <Link to="/" className="home-link">
          <img src={logo} alt="Logo" className="logo" />
          <span className={`site-title ${isHome ? 'active' : ''}`}>Metalworks</span>
        </Link>
      </div>

      <div className="the-header-right">


        <button className="cart-btn" onClick={handleCartClick}>
          <CartIcon className="cart-icon" />
          {/* Show item count only if user is authenticated and items exist */}
          {isAuthenticated && itemCount > 0 && (
            <span className="cart-item-count">{itemCount}</span>
          )}
        </button>

        {/* Conditional rendering based on isAuthenticated from AuthProvider */}
        {isAuthenticated && user ? ( 
          <div className="profile-container">
            <button className="profile-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
              <img src={avatarIcon} alt="Profile" className="profile-icon" />
            </button>
            {showProfileDropdown && (
              <div className="profile-dropdown">
                {/* Use user data from AuthContext */}
                <p className="profile-name">{user.firstName} {user.lastName}</p>
                <p className="profile-email">{user.email || user.userEmail /* Handle variations */}</p>
                {/* Using your requested class "logout-btn" for all, though "dropdown-item" might be more semantic for non-logout actions */}
                <button className="logout-btn" onClick={profile}>Profile</button>
                <button className="logout-btn" onClick={products}>Products</button>
                <button className="logout-btn" onClick={FAQ}>FAQ</button>
                <button className="logout-btn" onClick={handleLogout}>Log out</button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="login-link-header" style={{color: 'white', textDecoration: 'none', marginLeft: '15px'}}>Login</Link>
        )}
      </div>
    </header>
  );
};

export default Header;
