// src/pages/Dashboard/Dashboard.js
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Dashboard.css'; 
import { useAuth } from '../../data/AuthProvider'; 
import { productImages } from '../../utils/productImages'; // For displaying item images in order history

import cloud1 from '../../assets/cloud1.png'; // Assuming path is correct relative to src/pages/Dashboard/

const DashboardContext = createContext(null);

// This hook will fetch and manage all data specific to the dashboard for the logged-in user
const useDashboardData = () => {
  const { user, isAuthenticated, isLoading: isLoadingAuth } = useAuth(); 
  const [userOrders, setUserOrders] = useState([]);
  const [userProfileData, setUserProfileData] = useState({
    firstName: '', lastName: '', email: '', phone: ''
  });
  const [addresses, setAddresses] = useState([]); 
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [error, setError] = useState(null);

  // Calculated dashboard stats
  const [totalOrdersPlaced, setTotalOrdersPlaced] = useState(0); 
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);

  // API_BASE_URL is no longer needed here as we'll use relative paths for proxy
  // const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; 

  const getAuthHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('authToken'); 
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (user?.CustomerID && typeof user.CustomerID === 'number' && !isNaN(user.CustomerID)) { 
        console.log(`Dashboard/getAuthHeaders: Setting 'temp-user-id' to ${user.CustomerID}`);
        headers['temp-user-id'] = user.CustomerID;
    } else {
        console.warn("Dashboard/getAuthHeaders: No valid CustomerID in user object or no token. Header for user ID not set.", {user});
    }
    return headers;
  }, [user, isAuthenticated]); 

  useEffect(() => {
    console.log("Dashboard/useDashboardData useEffect: Auth state update:", 
      { isLoadingAuth, isAuthenticated, customerID: user?.CustomerID, userObj: user }
    );

    if (isLoadingAuth) {
      console.log("Dashboard/useDashboardData: Auth is still loading. Waiting...");
      setIsLoadingData(true); 
      return; 
    }

    if (isAuthenticated && user?.CustomerID && typeof user.CustomerID === 'number' && !isNaN(user.CustomerID)) {
      setIsLoadingData(true);
      setError(null);
      console.log(`Dashboard/useDashboardData: Auth confirmed. Fetching data for CustomerID: ${user.CustomerID}`);
      
      const fetchData = async () => {
        const headers = getAuthHeaders();
        
        if (!headers['temp-user-id'] && !headers['Authorization'] ) { 
            console.error("Dashboard/fetchData: CRITICAL - No authentication identifier (temp-user-id or Authorization token) in headers. Aborting fetch.");
            setError("User authentication identifier is missing. Cannot fetch dashboard data.");
            setIsLoadingData(false);
            return;
        }
        console.log("Dashboard/fetchData: Attempting to fetch with headers:", JSON.stringify(headers));

        try {
          // Use relative paths for API calls, assuming proxy is set up in package.json
          const [profileRes, ordersRes, addressesRes] = await Promise.all([
            fetch(`/api/user/profile`, { headers }).catch(e => { console.error("Profile fetch network error:", e); return {ok: false, statusText: e.message, status: 503, json: () => Promise.resolve({message: e.message})} ;}),
            fetch(`/api/user/orders`, { headers }).catch(e => { console.error("Orders fetch network error:", e); return {ok: false, statusText: e.message, status: 503, json: () => Promise.resolve({message: e.message})} ;}),
            fetch(`/api/user/addresses`, { headers }).catch(e => { console.error("Addresses fetch network error:", e); return {ok: false, statusText: e.message, status: 503, json: () => Promise.resolve({message: e.message})} ;})
          ]);

          // Process Profile
          if (!profileRes.ok) {
            const profileErrData = await profileRes.json().catch(() => ({message: `Profile fetch failed with status: ${profileRes.status}`}));
            throw new Error(`Failed to fetch profile: ${profileErrData.message || profileRes.statusText} (${profileRes.status})`);
          }
          const profileData = await profileRes.json();
          setUserProfileData({
            firstName: profileData.firstName || user.firstName || '',
            lastName: profileData.lastName || user.lastName || '',
            email: profileData.email || user.email || '', 
            phone: profileData.phone || ''
          });

          // Process Orders
          if (!ordersRes.ok) {
            const ordersErrData = await ordersRes.json().catch(() => ({message: `Orders fetch failed with status: ${ordersRes.status}`}));
            throw new Error(`Failed to fetch orders: ${ordersErrData.message || ordersRes.statusText} (${ordersRes.status})`);
          }
          const ordersData = await ordersRes.json();
          const processedOrders = ordersData.map(order => ({
            ...order, total: Number(order.total) || 0, date: order.date, 
            items: (order.items || []).map(item => ({ 
              ...item, image: productImages[item.imagePath] || productImages['default_placeholder.png'],
              price: Number(item.price) || 0
            }))
          }));
          setUserOrders(processedOrders);
          setTotalOrdersPlaced(processedOrders.length);
          const totalSpent = processedOrders.reduce((sum, order) => sum + order.total, 0);
          setLoyaltyPoints(Math.floor(totalSpent * 0.10));
          setRecentActivities(processedOrders.slice(0, 3).map(o => ({ type: 'order', description: `Order #${o.id} status: ${o.status}`, date: o.date, id: o.id })));
          
          // Process Addresses
          if (addressesRes.ok) {
            const addressesData = await addressesRes.json();
            if (addressesData.message === "Addresses GET not implemented") { setAddresses([]); } 
            else { setAddresses(addressesData); }
          } else { console.warn(`Failed to fetch addresses. API might not be ready.`); setAddresses([]); }

        } catch (err) {
          console.error("Dashboard/fetchData: Error during API calls:", err);
          setError(err.message || "Could not load dashboard data.");
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    } else if (!isLoadingAuth && !isAuthenticated) {
      console.log("Dashboard/useDashboardData: User not authenticated. Clearing data.");
      setIsLoadingData(false); 
      setUserOrders([]); setUserProfileData({ firstName: '', lastName: '', email: '', phone: ''});
      setAddresses([]); setTotalOrdersPlaced(0); setLoyaltyPoints(0); setRecentActivities([]);
    }
  }, [isAuthenticated, user, isLoadingAuth, getAuthHeaders]); 
  
  return { 
    userOrders, setUserOrders, userProfileData, setUserProfileData, addresses, setAddresses,
    isLoadingData, error, totalOrdersPlaced, loyaltyPoints, recentActivities, getAuthHeaders 
  };
};


const DashboardProvider = ({ children }) => {
  const dashboardDataHook = useDashboardData();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user, logout } = useAuth(); 
  const navigate = useNavigate(); 
  // API_BASE_URL removed

  const handleLogout = () => { logout(); navigate("/login"); };
  const handleShopNow = () => navigate('/products');
  const handleTrackOrder = (orderId) => navigate('/ordertrack', { state: { orderId } });
  const handleBuyAgain = (orderId) => alert('Buy Again feature coming soon!');
  const handleCancelOrder = (orderId) => alert('Order cancellation feature coming soon!');
  const handleChangeAvatar = () => alert('Avatar change coming soon!');

  const handleSaveProfile = async (profileToSave) => {
    if (!user?.CustomerID) { alert("Not authenticated."); return false; }
    try {
      const response = await fetch(`/api/user/profile`, { // Relative path
        method: 'PUT', headers: dashboardDataHook.getAuthHeaders(), body: JSON.stringify(profileToSave)
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || "Failed to save profile.");
      dashboardDataHook.setUserProfileData(prev => ({...prev, ...profileToSave, email: prev.email})); 
      alert('Profile changes saved successfully!'); return true;
    } catch (error) { console.error("Error saving profile:", error); alert(`Failed to save profile: ${error.message}`); return false; }
  };
  
  const handleChangePassword = async (currentPassword, newPassword) => {
    if (!user?.CustomerID) { alert("Not authenticated."); return false; }
    try {
        const response = await fetch(`/api/user/password`, { // Relative path
            method: 'POST', headers: dashboardDataHook.getAuthHeaders(), body: JSON.stringify({ currentPassword, newPassword })
        });
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || "Failed to change password.");
        alert("Password changed successfully!"); return true;
    } catch (error) { console.error("Error changing password:", error); alert(`Password change failed: ${error.message}`); return false;}
  };

  const handleAddAddress = async (newAddress) => alert('Add address API not implemented.'); 
  const handleEditAddress = async (addressId, updatedAddress) => alert('Edit address API not implemented.'); 
  const handleDeleteAddress = async (addressId) => { if(window.confirm('Sure?')) alert('Delete address API not implemented.'); };
  const handleSetDefaultAddress = async (addressId) => alert('Set default address API not implemented.');
  
  const value = {
    ...dashboardDataHook, activeSection, setActiveSection,
    getStatusClass: useCallback((status) => { 
        switch (status?.toLowerCase()) {
            case 'completed': return 'status-completed'; case 'shipped': return 'status-shipped';
            case 'processing': return 'status-processing'; case 'pending': return 'status-pending';
            case 'cancelled': return 'status-cancelled'; default: return '';
        }
    }, []),
    handleLogout, handleShopNow, handleTrackOrder, handleBuyAgain, handleCancelOrder,
    handleChangeAvatar, handleSaveProfile, handleChangePassword,
    handleAddAddress, handleEditAddress, handleDeleteAddress, handleSetDefaultAddress
  };
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

const useDashboard = () => { 
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
  return context;
};

const DashboardOverview = ({/* ...props as before... */}) => { /* ... Full JSX from previous version ... */ 
  const { userProfileData, totalOrdersPlaced, loyaltyPoints, recentActivities, handleShopNow, setActiveSection, isLoadingData, error } = useDashboard();
  if (isLoadingData && totalOrdersPlaced === undefined ) return <div className="loading-message">Loading dashboard overview...</div>; 
  if (error && totalOrdersPlaced === undefined ) {
      return <p style={{color: 'red'}}>Could not load dashboard overview data: {error}</p>;
  }
  return (
    <div className="dashboard-overview">
      <h2>Welcome Back, {userProfileData.firstName || 'Adventurer'}!</h2>
      <div className="stats-container">
        <div className="stat-card" onClick={() => setActiveSection('order-history')} style={{cursor: 'pointer'}} aria-label={`Orders placed: ${totalOrdersPlaced}`}>
          <h3>Orders Placed</h3> <p className="stat-number">{totalOrdersPlaced}</p>
        </div>
        <div className="stat-card" aria-label={`Loyalty points: ${loyaltyPoints}`}>
          <h3>Loyalty Points</h3> <p className="stat-number">{loyaltyPoints}</p>
        </div>
      </div>
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        {recentActivities && recentActivities.length > 0 ? ( 
            <div className="activity-list">
            {recentActivities.map((activity, index) => (
                <div key={activity.id || index} className="activity-item">
                <div className={`activity-icon ${activity.type}-icon`} aria-hidden="true">{activity.type === 'order' ? '📜' : '👤'}</div>
                <div className="activity-details"> <p>{activity.description}</p> <p className="activity-date">{new Date(activity.date).toLocaleDateString()}</p> </div>
                </div>
            ))}</div>
        ) : ( <p>No recent orders to display.</p> )}
      </div>
      <button className="primary-button" onClick={handleShopNow} style={{marginTop: '20px'}}> Continue Your Quest (Shop Now) </button>
    </div>
  );
};
const OrderHistorySection = ({/* ... props ... */}) => { /* ... Full JSX from previous version ... */ 
  const { userOrders, getStatusClass, handleTrackOrder, handleBuyAgain, handleCancelOrder, isLoadingData, error } = useDashboard();
  if (isLoadingData) return <p className="loading-message">Loading order history...</p>;
  if (error) return <p className="error-message" style={{color: 'red'}}>Error loading order history: {error}</p>;
  if (!userOrders || userOrders.length === 0) return <p>You have no past orders to display.</p>;
  return (
    <div className="order-history-section">
      <h2>Your Crafted Orders</h2>
      <div className="orders-container">
        {userOrders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div><h3>Order #{order.id}</h3><p>Ordered on: {new Date(order.date).toLocaleDateString()}</p><p>Total: ₱{(Number(order.total) || 0).toFixed(2)}</p></div>
              <div className={`order-status ${getStatusClass(order.status)}`}>{order.status}</div>
            </div>
            <div className="order-items"><h4>Items:</h4>
              {order.items && order.items.length > 0 ? order.items.map((item, index) => (
                <div key={item.id || index} className="order-item-summary">
                  <img src={item.image || productImages['default_placeholder.png']} alt={item.name} className="order-item-image-sm" />
                  <span>{item.name} (Qty: {item.quantity || 1}) - ₱{(Number(item.price) || 0).toFixed(2)}</span>
                </div>
              )) : <p>No item details available.</p>}
            </div>
            <div className="order-actions">
              <button className="secondary-button" onClick={() => handleTrackOrder(order.id)}>Track Order</button>
              {(order.status === 'Completed' || order.status === 'Shipped') && (<button className="primary-button" onClick={() => handleBuyAgain(order.id)}>Buy Again</button>)}
              {(order.status === 'Processing' || order.status === 'Pending') && (<button className="secondary-button" onClick={() => handleCancelOrder(order.id)}>Cancel Order</button>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const ProfileSection = ({/* ... props ... */}) => { /* ... Full JSX from previous version ... */ 
  const { userProfileData, handleSaveProfile, handleChangePassword } = useDashboard();
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => { 
    if (userProfileData) {
        setProfileForm({
            firstName: userProfileData.firstName || '',
            lastName: userProfileData.lastName || '',
            phone: userProfileData.phone || ''
        });
    }
  }, [userProfileData]);

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    setProfileError(''); setProfileSuccess('');
  };
  
  const handleLocalSave = async () => {
    setProfileError(''); setProfileSuccess('');
    if (!profileForm.firstName || !profileForm.lastName) { setProfileError("First and last name are required."); return; }
    const success = await handleSaveProfile(profileForm); 
    if (success) { setIsEditing(false); setProfileSuccess("Profile updated!");}
    else { setProfileError("Failed to update profile. Please try again or check console."); }
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordError(''); setPasswordSuccess('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(''); setPasswordSuccess('');
    if (passwordData.newPassword !== passwordData.confirmPassword) { setPasswordError("New passwords do not match."); return; }
    if (passwordData.newPassword.length < 8) { setPasswordError("New password must be at least 8 characters."); return; }
    const success = await handleChangePassword(passwordData.currentPassword, passwordData.newPassword); 
    if (success) {
        setPasswordSuccess("Password changed successfully!");
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
        setPasswordError("Password change failed. Please check your current password.");
    }
  };

  return (
    <div className="profile-section">
      <h2>Blacksmith's Profile</h2>
      {profileError && <p style={{color: 'red'}}>{profileError}</p>}
      {profileSuccess && <p style={{color: 'green'}}>{profileSuccess}</p>}
      <div className="profile-card">
        <div className="profile-form">
          <div className="form-group"><label htmlFor="firstNameD">First Name</label><input id="firstNameD" name="firstName" type="text" value={profileForm.firstName} onChange={handleProfileInputChange} readOnly={!isEditing} /></div>
          <div className="form-group"><label htmlFor="lastNameD">Last Name</label><input id="lastNameD" name="lastName" type="text" value={profileForm.lastName} onChange={handleProfileInputChange} readOnly={!isEditing} /></div>
          <div className="form-group"><label htmlFor="emailD">Email Address</label><input id="emailD" name="email" type="email" value={userProfileData.email} readOnly /></div>
          <div className="form-group"><label htmlFor="phoneD">Phone Number</label><input id="phoneD" name="phone" type="tel" value={profileForm.phone} onChange={handleProfileInputChange} readOnly={!isEditing} /></div>
          {isEditing ? (
            <div className="form-actions">
              <button className="secondary-button" onClick={() => { setIsEditing(false); setProfileForm(userProfileData || { firstName: '', lastName: '', phone: '' }); setProfileError(''); setProfileSuccess(''); }}>Cancel</button>
              <button className="primary-button" onClick={handleLocalSave}>Save Changes</button>
            </div>
          ) : ( <button className="primary-button" onClick={() => setIsEditing(true)}>Edit Profile</button> )}
          <h3 style={{marginTop: '30px'}}>Change Password</h3>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group"><label htmlFor="currentPasswordD">Current Password</label><input id="currentPasswordD" name="currentPassword" type="password" placeholder="Enter current password" value={passwordData.currentPassword} onChange={handlePasswordFormChange} /></div>
            <div className="form-group"><label htmlFor="newPasswordD">New Password</label><input id="newPasswordD" name="newPassword" type="password" placeholder="Enter new password" value={passwordData.newPassword} onChange={handlePasswordFormChange} /></div>
            <div className="form-group"><label htmlFor="confirmPasswordD">Confirm New Password</label><input id="confirmPasswordD" name="confirmPassword" type="password" placeholder="Confirm new password" value={passwordData.confirmPassword} onChange={handlePasswordFormChange} /></div>
            {passwordError && <p style={{color: 'red'}}>{passwordError}</p>}
            {passwordSuccess && <p style={{color: 'green'}}>{passwordSuccess}</p>}
            <button type="submit" className="primary-button">Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};
const AddressesSection = ({/* ... props ... */}) => { /* ... Full JSX from previous version ... */ 
  const { addresses, isLoadingData, error } = useDashboard(); 
  if (isLoadingData) return <p>Loading addresses...</p>;
  if (error && (!addresses || addresses.length === 0)) return <p style={{color: 'red'}}>Error loading addresses: {error}</p>;

  return (
    <div className="addresses-section">
      <h2>Delivery Strongholds</h2>
      <button className="primary-button add-address" onClick={() => alert("Add address form/modal coming soon!")}> Forge New Delivery Point </button>
      <div className="addresses-container">
        {addresses && addresses.length > 0 ? addresses.map((address) => (
          <div key={address.AddressID || address.id} className={`address-card ${address.IsDefault ? 'default-address' : ''}`}>
            {address.IsDefault && <div className="default-badge">Default</div>}
            <h3>{address.Nickname || `Address ${address.AddressID}`}</h3>
            <div className="address-details">
              <p>{address.Line1}</p> {address.Line2 && <p>{address.Line2}</p>}
              <p>{address.City}, {address.Region} {address.PostalCode}</p> <p>{address.Country}</p>
            </div>
            <div className="address-actions">
              <button className="secondary-button" onClick={() => alert(`Edit for AddressID ${address.AddressID} coming soon!`)}>Edit</button>
            </div>
          </div>
        )) : <p>No delivery addresses on record.</p>}
      </div>
    </div>
  );
};
const DashboardContent = ({/* ... props ... */}) => { /* ... Full JSX from previous version ... */ 
  const { activeSection, setActiveSection, handleLogout, isLoadingData, totalOrdersPlaced } = useDashboard(); 
  return (
    <div className="ds-dashboard-layout"> 
      <div className="ds-sidebar">
        <div className="ds-nav-container">
          <ul className="ds-nav-menu">
            <li className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}><span className="nav-icon" aria-hidden="true">⚔️</span> Dashboard</li>
            <li className={activeSection === 'order-history' ? 'active' : ''} onClick={() => setActiveSection('order-history')}><span className="nav-icon" aria-hidden="true">📜</span> Order History</li>
            <li className={activeSection === 'profile-details' ? 'active' : ''} onClick={() => setActiveSection('profile-details')}><span className="nav-icon" aria-hidden="true">👤</span> Profile Details</li>
            <li className={activeSection === 'addresses' ? 'active' : ''} onClick={() => setActiveSection('addresses')}><span className="ds-nav-icon" aria-hidden="true">🏰</span> Addresses</li>
            <li className="logout-btn-sidebar" onClick={handleLogout}> <span className="ds-nav-icon" aria-hidden="true">🚪</span> Logout</li>
          </ul>
        </div>
        <div className="ds-sidebar-footer"> 
            <img src={cloud1} alt="Decorative cloud background" className="sidebar-cloud-bg" />
            <div className="forge-branding"><h3>MetalWorks</h3><p>Your trusted forge.</p></div>
        </div>
      </div>
      <div className="ds-main-content-area"> 
        {activeSection === 'dashboard' && (isLoadingData && totalOrdersPlaced === undefined ? <p>Loading Dashboard...</p> : <DashboardOverview />)}
        {activeSection === 'order-history' && <OrderHistorySection />}
        {activeSection === 'profile-details' && <ProfileSection />}
        {activeSection === 'addresses' && <AddressesSection />}
      </div>
    </div>
  );
};
const DashboardPage = ({/* ... props ... */}) => { /* ... Full JSX from previous version ... */ 
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate('/login', { state: { message: "Please login to view your dashboard." }});
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  if (isLoadingAuth || !isAuthenticated) { 
    return <div className="ds-dashboard-container"><div className="loading-overlay"><p>Verifying adventurer status...</p></div></div>;
  }
  return (
    <DashboardProvider> 
      <div className="ds-dashboard-container">
        <DashboardContent />
      </div>
    </DashboardProvider>
  );
};

export default DashboardPage;
