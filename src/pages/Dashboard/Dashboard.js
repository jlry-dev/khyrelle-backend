import React, { useState, useCallback, createContext, useContext } from 'react';
import './Dashboard.css';
import bronzeArmorImg from './dashassets/bronze_armor.png';
import steelHelmetImg from './dashassets/steel_helmet.png';
import ironSwordImg from './dashassets/iron_sword.png';
import titaniumHelmetImg from './dashassets/titanium_helmet.png';
import ironShieldImg from './dashassets/iron_shield.png';
import cloud1 from '../../assets/cloud1.png';

const DashboardContext = createContext();

const useOrders = () => {
  const [orders, setOrders] = useState([
    {
      id: 'BS-20240328-7429',
      date: 'March 28, 2024',
      total: '₱3,400',
      status: 'Completed',
      items: [
        { id: 1, name: 'Bronze Armor', price: '₱1,500', image: bronzeArmorImg },
        { id: 2, name: 'Steel Helmet', price: '₱600', image: steelHelmetImg },
        { id: 3, name: 'Iron Sword', price: '₱1,000', image: ironSwordImg },
        { id: 4, name: 'Titanium Helmet', price: '₱1,800', image: titaniumHelmetImg }
      ]
    },
    {
      id: 'BS-20240215-3842',
      date: 'February 15, 2024',
      total: '₱900',
      status: 'Shipped',
      items: [
        { id: 1, name: 'Iron Shield', price: '₱900', image: ironShieldImg }
      ]
    },
    {
      id: 'BS-20240103-1267',
      date: 'January 3, 2024',
      total: '₱2,500',
      status: 'Processing',
      items: [
        { id: 1, name: 'Bronze Armor', price: '₱1,500', image: bronzeArmorImg },
        { id: 2, name: 'Iron Sword', price: '₱1,000', image: ironSwordImg }
      ]
    }
  ]);

  return { orders, setOrders };
};

const useAddresses = () => {
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      nickname: 'Castle',
      default: true,
      line1: 'Royal Tower, Castle Keep',
      line2: 'Kingdom of Camelot',
      city: 'Avalon',
      region: 'Mythical Lands',
      postal: '12345',
      country: 'Britannia'
    },
    {
      id: 2,
      nickname: 'Barracks',
      default: false,
      line1: 'Northern Battalion HQ',
      line2: 'Military Quarter',
      city: 'Camelot',
      region: 'Central Kingdom',
      postal: '67890',
      country: 'Britannia'
    }
  ]);

  return { addresses, setAddresses };
};

const useStatus = () => {
  const getStatusClass = useCallback((status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'status-completed';
      case 'shipped':
        return 'status-shipped';
      case 'processing':
        return 'status-processing';
      default:
        return '';
    }
  }, []);

  return { getStatusClass };
};

const DashboardProvider = ({ children }) => {
  const { orders, setOrders } = useOrders();
  const { addresses, setAddresses } = useAddresses();
  const { getStatusClass } = useStatus();
  const [activeSection, setActiveSection] = useState('dashboard');
  
  const handleLogout = () => {
  console.log('Logging out...');
  localStorage.removeItem('user'); 
  localStorage.removeItem('token'); 
  window.location.href = "/login";
};


  const handleShopNow = () => {
    console.log('Navigating to shop...');
    alert('Redirecting to shop page');
  };

  const handleViewDetails = () => {
    console.log('Showing product details...');
    alert('Showing product details for Dragon Scale Armor');
  };

  const handleTrackOrder = (orderId) => {
    console.log(`Tracking order ${orderId}...`);
    alert(`Tracking order ${orderId}`);
  };

  const handleBuyAgain = (orderId) => {
    console.log(`Buying again from order ${orderId}...`);
    alert(`Adding items from order ${orderId} to cart`);
  };

  const handleCancelOrder = (orderId) => {
    console.log(`Canceling order ${orderId}...`);
    alert(`Canceling order ${orderId}`);
  };

  const handleChangeAvatar = () => {
    console.log('Changing avatar...');
    alert('Opening avatar upload dialog');
  };

  const handleSaveProfile = () => {
    console.log('Saving profile changes...');
    alert('Profile changes saved');
  };

  const handleCancelProfile = () => {
    console.log('Canceling profile changes...');
    alert('Profile changes discarded');
  };

  const handleAddAddress = () => {
    console.log('Adding new address...');
    alert('Opening new address form');
  };

  const handleEditAddress = (addressId) => {
    console.log(`Editing address ${addressId}...`);
    alert(`Editing address ${addressId}`);
  };

  const handleDeleteAddress = (addressId) => {
    console.log(`Deleting address ${addressId}...`);
    if (window.confirm('Are you sure you want to delete this address?')) {
      alert(`Address ${addressId} deleted`);
    }
  };

  const handleSetDefaultAddress = (addressId) => {
    console.log(`Setting address ${addressId} as default...`);
    alert(`Address ${addressId} set as default`);
  };

  const value = {
    orders,
    setOrders,
    addresses,
    setAddresses,
    activeSection,
    setActiveSection,
    getStatusClass,
    handleLogout,
    handleShopNow,
    handleViewDetails,
    handleTrackOrder,
    handleBuyAgain,
    handleCancelOrder,
    handleChangeAvatar,
    handleSaveProfile,
    handleCancelProfile,
    handleAddAddress,
    handleEditAddress,
    handleDeleteAddress,
    handleSetDefaultAddress
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

const DashboardContent = () => {
  const {
    activeSection,
    setActiveSection,
    isLoading,
    handleLogout
  } = useDashboard();

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="ds-dashboard-content">
      <div className="ds-sidebar">
        <div className="ds-nav-container">
          <ul className="ds-nav-menu">
            <li 
              className={activeSection === 'dashboard' ? 'active' : ''}
              onClick={() => setActiveSection('dashboard')}
              aria-current={activeSection === 'dashboard' ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">⚔️</span> Dashboard
            </li>
            <li 
              className={activeSection === 'order-history' ? 'active' : ''}
              onClick={() => setActiveSection('order-history')}
              aria-current={activeSection === 'order-history' ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">📜</span> Order History
            </li>
            <li 
              className={activeSection === 'profile-details' ? 'active' : ''}
              onClick={() => setActiveSection('profile-details')}
              aria-current={activeSection === 'profile-details' ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">👤</span> Profile Details
            </li>
            <li 
              className={activeSection === 'addresses' ? 'active' : ''}
              onClick={() => setActiveSection('addresses')}
              aria-current={activeSection === 'addresses' ? 'page' : undefined}
            >
              <span className="ds-nav-icon" aria-hidden="true">🏰</span> Addresses
            </li>
            <li className="logout-btn" onClick={handleLogout}>
              <span className="ds-nav-icon" aria-hidden="true">🚪</span> Logout
            </li>
          </ul>
        </div>
        <div className="ds-main-panel">
          <img src={cloud1} alt="Decorative cloud background" className="zoomed-full-image" />
        </div>

        <div className="forge-branding">
          <h3>MetalWorks</h3>
          <p>Your trusted forge for tools and upgrades, crafted with skill, built for adventurers.</p>
        </div>
      </div>

      <div className="ds-main-content">
        {activeSection === 'dashboard' && (
          <DashboardOverview />
        )}

        {activeSection === 'order-history' && (
          <OrderHistorySection />
        )}

        {activeSection === 'profile-details' && (
          <ProfileSection />
        )}

        {activeSection === 'addresses' && (
          <AddressesSection />
        )}
      </div>
    </div>
  );
};

const DashboardOverview = () => {
  const { handleShopNow, handleViewDetails } = useDashboard();

  return (
    <div className="dashboard-overview">
      <h2>Your Dashboard</h2>
      <div className="stats-container">
        <div className="stat-card" tabIndex="0" aria-label="Orders placed: 6" onClick={() => console.log('Stat card clicked')}>
          <h3>Orders Placed</h3>
          <p className="stat-number">6</p>
        </div>
        <div className="stat-card" tabIndex="0" aria-label="Loyalty points: 450">
          <h3>Loyalty Points</h3>
          <p className="stat-number">450</p>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon order-icon" aria-hidden="true"></div>
            <div className="activity-details">
              <p>Order #BS-20240328-7429 has been completed</p>
              <p className="activity-date">March 28, 2024</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon profile-icon" aria-hidden="true"></div>
            <div className="activity-details">
              <p>Profile information updated</p>
              <p className="activity-date">March 15, 2024</p>
            </div>
          </div>
        </div>
      </div>

      <div className="special-offers">
        <h3>Exclusive Offers</h3>
        <div className="offers-grid">
          <div className="offer-card" tabIndex="0">
            <div className="offer-badge">15% OFF</div>
            <h4>Seasonal Sale</h4>
            <p>Premium steel products for knights and warriors</p>
            <button className="primary-button" onClick={handleShopNow}>Shop Now</button>
          </div>
          <div className="offer-card" tabIndex="0">
            <div className="offer-badge">NEW</div>
            <h4>Dragon Scale Armor</h4>
            <p>Limited edition, fire-resistant protection</p>
            <button className="primary-button" onClick={handleViewDetails}>View Details</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderHistorySection = () => {
  const { 
    orders, 
    getStatusClass, 
    handleTrackOrder, 
    handleBuyAgain, 
    handleCancelOrder 
  } = useDashboard();

  return (
    <div className="order-history-section">
      <h2>Your Crafted Orders</h2>
      <div className="orders-container">
        {orders.map((order) => (
          <div key={order.id} className="order-card" tabIndex="0">
            <div className="order-header">
              <div>
                <h3>Order #{order.id}</h3>
                <p>Ordered on: {order.date}</p>
                <p>Total: {order.total}</p>
              </div>
              <div className={`order-status ${getStatusClass(order.status)}`}>
                {order.status}
              </div>
            </div>
            <div className="order-items">
              {order.items.map((item) => (
                <div key={item.id} className="order-item">
                  <div 
                    className="item-image" 
                    style={{ backgroundImage: `url(${item.image})` }}
                    aria-label={`Image of ${item.name}`}
                  ></div>
                  <div className="item-details">
                    <p className="item-name">{item.name}</p>
                    <p className="item-price">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="order-actions">
              <button 
                className="secondary-button" 
                onClick={() => handleTrackOrder(order.id)}
              >
                Track your Order
              </button>
              {order.status === 'Completed' || order.status === 'Shipped' ? (
                <button 
                  className="primary-button" 
                  onClick={() => handleBuyAgain(order.id)}
                >
                  Buy Again
                </button>
              ) : (
                <button 
                  className="secondary-button" 
                  onClick={() => handleCancelOrder(order.id)}
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfileSection = () => {
  const { 
    handleChangeAvatar, 
    handleSaveProfile, 
    handleCancelProfile 
  } = useDashboard();

  return (
    <div className="profile-section">
      <h2>Blacksmith's Profile</h2>
      <div className="profile-card">
        <div className="profile-avatar">
          <div className="avatar-placeholder" aria-hidden="true"></div>
          <button 
            className="secondary-button" 
            onClick={handleChangeAvatar}
          >
            Change Avatar
          </button>
        </div>
        <div className="profile-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input id="fullName" type="text" defaultValue="Arthur Pendragon" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" defaultValue="kingarthur@camelot.realm" />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input id="phone" type="tel" defaultValue="123-456-7890" />
          </div>
          <h3>Change Password</h3>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input id="currentPassword" type="password" placeholder="Enter current password" />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input id="newPassword" type="password" placeholder="Enter new password" />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" placeholder="Confirm new password" />
          </div>
          <div className="form-actions">
            <button 
              className="secondary-button" 
              onClick={handleCancelProfile}
            >
              Cancel
            </button>
            <button 
              className="primary-button" 
              onClick={handleSaveProfile}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddressesSection = () => {
  const { 
    addresses, 
    handleAddAddress, 
    handleEditAddress, 
    handleDeleteAddress, 
    handleSetDefaultAddress 
  } = useDashboard();

  return (
    <div className="addresses-section">
      <h2>Delivery Strongholds</h2>
      <button 
        className="primary-button add-address" 
        onClick={handleAddAddress}
      >
        Add New Address
      </button>
      <div className="addresses-container">
        {addresses.map((address) => (
          <div 
            key={address.id} 
            className={`address-card ${address.default ? 'default-address' : ''}`}
            tabIndex="0"
          >
            {address.default && <div className="default-badge">Default</div>}
            <h3>{address.nickname}</h3>
            <div className="address-details">
              <p>{address.line1}</p>
              <p>{address.line2}</p>
              <p>{address.city}, {address.region} {address.postal}</p>
              <p>{address.country}</p>
            </div>
            <div className="address-actions">
              <button 
                className="secondary-button" 
                onClick={() => handleEditAddress(address.id)}
              >
                Edit
              </button>
              <button 
                className="secondary-button delete-btn" 
                onClick={() => handleDeleteAddress(address.id)}
              >
                Delete
              </button>
              {!address.default && (
                <button 
                  className="secondary-button" 
                  onClick={() => handleSetDefaultAddress(address.id)}
                >
                  Set as Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
};

export default Dashboard;