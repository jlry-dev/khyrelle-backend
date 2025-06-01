// src/pages/checkout/co.js
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './co.css';
import { useCart } from '../../data/CartProvider';
import { useAuth } from '../../data/AuthProvider';

// Helper function for API calls (can be moved to a shared utils file)
const fetchApi = async (url, options = {}, customerId) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (customerId) {
    headers['temp-user-id'] = customerId;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  return response.json();
};


// --- Address Form Component (Inline) ---
const AddressForm = ({ onClose, onSave, currentAddress, initialUserData }) => {
  const [addressForm, setAddressForm] = useState({
    Nickname: '', RecipientName: '', ContactPhone: '',
    Line1: '', Line2: '', City: '', Region: '', PostalCode: '', Country: '', IsDefault: false
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentAddress && currentAddress.Line1) { // Editing an existing, complete address for THIS checkout instance
      setAddressForm({
        Nickname: currentAddress.Nickname || '',
        RecipientName: currentAddress.RecipientName || '',
        ContactPhone: currentAddress.ContactPhone || '',
        Line1: currentAddress.Line1 || '',
        Line2: currentAddress.Line2 || '',
        City: currentAddress.City || '',
        Region: currentAddress.Region || '',
        PostalCode: currentAddress.PostalCode || '',
        Country: currentAddress.Country || '',
        IsDefault: !!currentAddress.IsDefault // This is more for profile management, less for checkout override
      });
    } else if (initialUserData) { // Pre-fill for a new address using logged-in user's basic info
      setAddressForm({
        Nickname: '', // Nickname usually user-defined
        RecipientName: `${initialUserData.firstName || ''} ${initialUserData.lastName || ''}`.trim() || '',
        ContactPhone: initialUserData.phone || '',
        Line1: '', Line2: '', City: '', PostalCode: '', Country: '', IsDefault: false
      });
    } else { // Default empty state for a completely new address by a guest or if no initial data
      setAddressForm({
        Nickname: '', RecipientName: '', ContactPhone: '', Line1: '', Line2: '',
        City: '', PostalCode: '', Country: '', IsDefault: false
      });
    }
  }, [currentAddress, initialUserData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!addressForm.RecipientName.trim()) newErrors.RecipientName = "Recipient name is required.";
    if (!addressForm.Line1.trim()) newErrors.Line1 = "Address line 1 is required.";
    if (!addressForm.City.trim()) newErrors.City = "City is required.";
    if (!addressForm.PostalCode.trim()) newErrors.PostalCode = "Postal code is required.";
    if (!addressForm.Country.trim()) newErrors.Country = "Country is required.";
    if (!addressForm.ContactPhone.trim()) newErrors.ContactPhone = "Contact phone is required.";
    else if (!/^\+?[0-9\s-()]{7,20}$/.test(addressForm.ContactPhone)) newErrors.contactPhone = "Invalid phone number format.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      // We pass the full addressForm state, which now includes Nickname and IsDefault
      onSave(addressForm);
      // Parent (CheckoutPage) will hide the form by setting showAddressForm to false
    }
  };

  return (
    <div className="co-address-form-inline-container">
      <div className="co-address-form-content">
        <h3>{currentAddress && currentAddress.Line1 ? 'Edit Delivery Address for this Order' : 'Add New Delivery Address'}</h3>
        <div className="address-form-fields">
           <div className="form-group-co">
            <label htmlFor="modalNickname">Address Nickname (e.g., Home, Work)</label>
            <input type="text" id="modalNickname" name="Nickname" value={addressForm.Nickname} onChange={handleChange} />
          </div>
          <div className="form-group-co">
            <label htmlFor="modalRecipientName">Recipient Name*</label>
            <input type="text" id="modalRecipientName" name="RecipientName" value={addressForm.RecipientName} onChange={handleChange} />
            {errors.RecipientName && <p className="error-text-co">{errors.RecipientName}</p>}
          </div>
          <div className="form-group-co">
            <label htmlFor="modalLine1">Address Line 1*</label>
            <input type="text" id="modalLine1" name="Line1" value={addressForm.Line1} onChange={handleChange} />
            {errors.Line1 && <p className="error-text-co">{errors.Line1}</p>}
          </div>
          <div className="form-group-co">
            <label htmlFor="modalLine2">Address Line 2 (Optional)</label>
            <input type="text" id="modalLine2" name="Line2" value={addressForm.Line2} onChange={handleChange} />
          </div>
          <div className="form-group-co">
            <label htmlFor="modalCity">City*</label>
            <input type="text" id="modalCity" name="City" value={addressForm.City} onChange={handleChange} />
            {errors.City && <p className="error-text-co">{errors.City}</p>}
          </div>
          <div className="form-group-co">
            <label htmlFor="modalPostalCode">Postal Code*</label>
            <input type="text" id="modalPostalCode" name="PostalCode" value={addressForm.PostalCode} onChange={handleChange} />
            {errors.PostalCode && <p className="error-text-co">{errors.PostalCode}</p>}
          </div>
          <div className="form-group-co">
            <label htmlFor="modalCountry">Country*</label>
            <input type="text" id="modalCountry" name="Country" value={addressForm.Country} onChange={handleChange} />
            {errors.Country && <p className="error-text-co">{errors.Country}</p>}
          </div>
          <div className="form-group-co">
            <label htmlFor="modalContactPhone">Contact Phone*</label>
            <input type="tel" id="modalContactPhone" name="ContactPhone" value={addressForm.ContactPhone} onChange={handleChange} />
            {errors.ContactPhone && <p className="error-text-co">{errors.ContactPhone}</p>}
          </div>
           {/* IsDefault is more for profile management, but include if AddressForm is reused there */}
           {/* <div className="form-group-co" style={{ display: 'flex', alignItems: 'center' }}>
            <input type="checkbox" id="modalIsDefault" name="IsDefault" checked={addressForm.IsDefault} onChange={handleChange} style={{marginRight: '10px', width: 'auto'}}/>
            <label htmlFor="modalIsDefault" style={{marginBottom: 0}}>Set as default in profile</label>
          </div> */}
        </div>
        <div className="co-form-actions">
          <button onClick={handleSave} className="co-primary-action-btn">Save Address for this Order</button>
          <button onClick={onClose} className="co-secondary-action-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};


const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, handleQuantityChange: updateCartQuantity, handleRemoveItem: removeFromCart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const customerId = user?.CustomerID;

  const [message, setMessage] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash On Delivery');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  const [deliveryAddress, setDeliveryAddress] = useState(null); // This will hold the address for the CURRENT order
  const [userAddresses, setUserAddresses] = useState([]); // Holds addresses fetched from user's profile
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const validPromoCode = 'METAL10';
  const promoDiscountPercentage = 0.10;

  const initialAddressDataForForm = useMemo(() => {
    if (isAuthenticated && user) {
      return { firstName: user.firstName, lastName: user.lastName, phone: user.phone };
    }
    return null;
  }, [user, isAuthenticated]);

  // Fetch user's saved addresses from their profile
  const fetchUserAddresses = useCallback(() => {
    if (isAuthenticated && customerId) {
      setIsLoadingAddresses(true);
      fetchApi('/api/user/addresses', {}, customerId)
        .then(data => {
          setUserAddresses(Array.isArray(data) ? data : []);
          // If no deliveryAddress is set for the order yet, try to pre-fill with default from profile
          if (!deliveryAddress && Array.isArray(data) && data.length > 0) {
            const defaultAddr = data.find(addr => addr.IsDefault);
            if (defaultAddr) {
              handleSelectSavedAddress(defaultAddr); // Selects it for the current order
            }
          }
        })
        .catch(err => {
          console.error("Error fetching user addresses:", err);
          setUserAddresses([]); // Ensure it's an array on error
        })
        .finally(() => setIsLoadingAddresses(false));
    }
  }, [isAuthenticated, customerId, deliveryAddress]); // Rerun if deliveryAddress changes, to ensure list is fresh if user adds then wants to select

  useEffect(() => {
    fetchUserAddresses();
  }, [fetchUserAddresses]); // Initial fetch and if dependencies of fetchUserAddresses change

  const merchandiseSubtotal = useMemo(() => (
    cartItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * (item.quantity || 1)), 0)
  ), [cartItems]);

  const shipping = cartItems.length > 0 ? 100.00 : 0;

  useEffect(() => {
    if (discountApplied) {
      setDiscountAmount(merchandiseSubtotal * promoDiscountPercentage);
    } else {
      setDiscountAmount(0);
    }
  }, [discountApplied, merchandiseSubtotal, promoDiscountPercentage]);

  const totalPayment = merchandiseSubtotal + shipping - discountAmount;

  const applyDiscount = () => {
    setPromoError('');
    if (discountCode === validPromoCode) {
      setDiscountApplied(true);
      setDiscountAmount(merchandiseSubtotal * promoDiscountPercentage);
    } else {
      setDiscountApplied(false);
      setDiscountAmount(0);
      setPromoError('Invalid promo code.');
    }
  };

  // Sets a selected address from user's profile as the deliveryAddress for THIS order
  const handleSelectSavedAddress = (profileAddress) => {
    setDeliveryAddress({
      // Map fields from profileAddress (which comes from customer_addresses table)
      // to the structure expected by the order payload (deliveryAddress field)
      recipientName: profileAddress.RecipientName,
      line1: profileAddress.Line1,
      line2: profileAddress.Line2 || '',
      city: profileAddress.City,
      postalCode: profileAddress.PostalCode,
      country: profileAddress.Country,
      contactPhone: profileAddress.ContactPhone,
      // Optionally, keep a reference to the original AddressID for UI indication
      _originalAddressID: profileAddress.AddressID
    });
    setShowAddressForm(false); // Hide form if they select a saved address
  };

  // Saves address from the form to be used for THIS order,
  // AND saves it to the user's profile if they are logged in.
  const handleSaveAddressFromForm = async (addressFormData) => {
    // `addressFormData` is from the AddressForm state, e.g., { RecipientName, Line1, ... Nickname, IsDefault (if used) }
    const addressForOrder = { // Structure for `deliveryAddress` in order payload
        recipientName: addressFormData.RecipientName,
        line1: addressFormData.Line1,
        line2: addressFormData.Line2 || '',
        city: addressFormData.City,
        postalCode: addressFormData.PostalCode,
        country: addressFormData.Country,
        contactPhone: addressFormData.ContactPhone
    };

    if (isAuthenticated && customerId) {
      try {
        // Save this new address to the user's profile
        // The backend /api/user/addresses expects fields like Nickname, RecipientName, Line1, etc.
        const savedToProfile = await fetchApi('/api/user/addresses', {
          method: 'POST',
          body: JSON.stringify({
            Nickname: addressFormData.Nickname, // From form
            RecipientName: addressFormData.RecipientName,
            ContactPhone: addressFormData.ContactPhone,
            Line1: addressFormData.Line1,
            Line2: addressFormData.Line2,
            City: addressFormData.City,
            Region: addressFormData.Region,
            PostalCode: addressFormData.PostalCode,
            Country: addressFormData.Country,
            IsDefault: addressFormData.IsDefault // From form, if you enable this checkbox
          }),
        }, customerId);

        // If successfully saved to profile, refresh the list of user addresses
        fetchUserAddresses();
        // And use this (potentially augmented by backend, e.g., with AddressID) for the current order
        setDeliveryAddress({
            ...addressForOrder,
            _originalAddressID: savedToProfile.address?.AddressID // If backend returns the new ID
        });

      } catch (error) {
        console.error("Error saving new address to user's profile:", error);
        alert("Could not save address to your profile, but will use for this order.");
        // Fallback: still use the entered address for this order even if profile save failed
        setDeliveryAddress(addressForOrder);
      }
    } else {
      // For guest users or if not saving to profile, just use it for this order
      setDeliveryAddress(addressForOrder);
    }
    setShowAddressForm(false);
  };


  const handlePlaceOrder = async () => {
    if (!isAuthenticated || !user?.CustomerID) {
      alert("Please log in to place an order.");
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (cartItems.length === 0) {
      alert("Your cart is empty. Please add items before placing an order.");
      return;
    }
    if (!deliveryAddress || !deliveryAddress.line1) {
      alert("Please add or select your delivery address.");
      setShowAddressForm(true); // Open the form if address is missing
      return;
    }

    setIsPlacingOrder(true); setOrderError('');
    const isRushOrderOverall = cartItems.some(item => item.rushOrder);

    const orderPayloadToBackend = {
      items: cartItems.map(item => ({
        productId: item.id, quantity: item.quantity,
        unitPrice: Number(item.price) || 0, isRushItem: item.rushOrder, // isRushItem seems specific to cart, backend order uses overall
      })),
      paymentMethod: paymentMethod,
      finalTotal: totalPayment,
      isRushOrder: isRushOrderOverall,
      messageForSeller: message,
      discountCode: discountApplied ? discountCode : null,
      appliedDiscountAmount: discountAmount,
      merchandiseSubtotal: merchandiseSubtotal,
      shippingFee: shipping,
      deliveryAddress: deliveryAddress // This is the crucial part
    };

    try {
      const backendResponseData = await fetchApi('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayloadToBackend)
      }, customerId); // Pass customerId for fetchApi helper

      const orderDataForConfirmation = {
        orderId: backendResponseData.orderDetails.orderId,
        orderDate: backendResponseData.orderDetails.orderDate || new Date().toLocaleDateString(),
        paymentMethod: paymentMethod,
        items: cartItems.map(item => ({
          id: item.id, name: item.name, quantity: item.quantity,
          price: Number(item.price) || 0, totalItemPrice: (Number(item.price) || 0) * (item.quantity || 1),
          image: item.image || item.ImagePath, description: item.description,
          rushOrder: item.rushOrder
        })),
        merchandiseSubtotal: merchandiseSubtotal, shippingFee: shipping,
        appliedDiscountAmount: discountAmount, finalTotal: totalPayment,
        customerDetails: {
          name: deliveryAddress.recipientName,
          shippingAddress: `${deliveryAddress.line1}${deliveryAddress.line2 ? ', ' + deliveryAddress.line2 : ''}, ${deliveryAddress.city}, ${deliveryAddress.postalCode}, ${deliveryAddress.country}`,
          contactPhone: deliveryAddress.contactPhone
        }
      };

      if (typeof clearCart === 'function') clearCart();
      else console.warn("clearCart function not available from useCart().");

      navigate('/orderconfirm', { state: { orderData: orderDataForConfirmation } });
    } catch (error) {
      console.error("Error placing order:", error);
      setOrderError(error.message || "An unexpected error occurred while placing the order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="checkout-page">
      <main className="checkout-container">
        <h1>Checkout</h1>

        <div className="checkout-sections">
          <div className="order-items-section">
            <h2>Your Items ({cartItems.length})</h2>
            {cartItems.length === 0 ? (<p>Your cart is empty. <Link to="/products">Continue Shopping</Link></p>) : (
              cartItems.map(item => (
                <div key={`${item.id}-${item.rushOrder ? 'rush' : 'normal'}`} className="order-item">
                  <div className="item-image"><img src={item.image || item.ImagePath || '/placeholder.png'} alt={item.name} className="checkout-item-thumbnail" /></div>
                  <div className="item-details">
                    <div className="item-info">
                      <h3>{item.name}</h3>
                      <p className="item-description">{item.description}</p>
                      {item.rushOrder && <p className="rush-order-tag-checkout">Rush Order</p>}
                      <p className="item-price">₱ {(Number(item.price) || 0).toFixed(2)} / unit</p>
                    </div>
                    <div className="item-actions">
                      <div className="quantity-control">
                        <button onClick={() => updateCartQuantity(item.cartItemId || { productId: item.id, rushOrder: item.rushOrder }, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.cartItemId || { productId: item.id, rushOrder: item.rushOrder }, 1)}>+</button>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromCart(item.cartItemId || { productId: item.id, rushOrder: item.rushOrder })}>Remove</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="order-details-and-summary">
              <div className="customer-details-section">
                <h2>Delivery Details</h2>
                {isLoadingAddresses && <p>Loading addresses...</p>}
                
                {/* Section to select from saved addresses */}
                {isAuthenticated && userAddresses.length > 0 && !showAddressForm && (
                  <div className="saved-addresses-selection" style={{ marginBottom: '15px', padding: '10px', border: '1px solid #556b2f', background: 'rgba(40,45,40,0.7)' }}>
                    <h4>Select a Saved Address:</h4>
                    {userAddresses.map(addr => (
                      <div key={addr.AddressID}
                           className={`saved-address-option ${deliveryAddress?._originalAddressID === addr.AddressID ? 'selected' : ''}`}
                           onClick={() => handleSelectSavedAddress(addr)}
                           style={{ padding: '8px', margin: '5px 0', border: '1px dashed #8a9a5b', cursor: 'pointer', backgroundColor: deliveryAddress?._originalAddressID === addr.AddressID ? '#3a4a3a' : 'transparent' }}
                           role="button" tabIndex="0" onKeyPress={(e) => e.key === 'Enter' && handleSelectSavedAddress(addr)}>
                        <p><strong>{addr.Nickname || `Address`}</strong> {addr.IsDefault ? <span className="default-badge-co">(Default)</span> : ''}</p>
                        <p>{addr.RecipientName}</p>
                        <p>{addr.Line1}, {addr.City}</p>
                      </div>
                    ))}
                    <button onClick={() => { setShowAddressForm(true); setDeliveryAddress(null); /* Clear selection when opening form for new */}}
                            className="co-secondary-action-btn" style={{ marginTop: '10px' }}>
                      Enter New Address
                    </button>
                  </div>
                )}

                {/* Display the currently selected/entered delivery address or prompt to add/select */}
                {deliveryAddress && !showAddressForm ? (
                  <div className="address-display-box">
                    <p><strong>Delivering to:</strong></p>
                    <p><strong>Recipient:</strong> {deliveryAddress.recipientName}</p>
                    <p>{deliveryAddress.line1}</p>
                    {deliveryAddress.line2 && <p>{deliveryAddress.line2}</p>}
                    <p>{deliveryAddress.city}, {deliveryAddress.postalCode}</p>
                    <p>{deliveryAddress.country}</p>
                    <p><strong>Phone:</strong> {deliveryAddress.contactPhone}</p>
                    <button onClick={() => setShowAddressForm(true)} className="co-primary-action-btn">
                      Change/Edit Address
                    </button>
                  </div>
                ) : (
                  !showAddressForm && (
                    <div className="address-prompt">
                      <p>Please add or select your delivery address.</p>
                      <button onClick={() => setShowAddressForm(true)} className="co-primary-action-btn co-add-address-btn">
                        {isAuthenticated && userAddresses.length > 0 ? "Select or Add Address" : "Add Delivery Address"}
                      </button>
                    </div>
                  )
                )}

                {showAddressForm && (
                  <AddressForm
                    onClose={() => setShowAddressForm(false)}
                    onSave={handleSaveAddressFromForm} // This will also save to profile if logged in
                    currentAddress={deliveryAddress} // Pre-fills form if an address was already set for the order
                    initialUserData={initialAddressDataForForm} // Pre-fills new form with user's name/phone
                  />
                )}

                <div className="message-section">
                  <label htmlFor="messageForSeller">Message for Seller (Optional):</label>
                  <textarea id="messageForSeller" placeholder="Any special instructions for your order..." value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
              </div>

              <div className="order-summary-section">
                <h2>Order Summary</h2>
                <table className="summary-table">
                  <tbody>
                    <tr><td>Merchandise Subtotal</td><td>₱ {(Number(merchandiseSubtotal) || 0).toFixed(2)}</td></tr>
                    <tr><td>Shipping Fee</td><td>₱ {(Number(shipping) || 0).toFixed(2)}</td></tr>
                    {discountApplied && discountAmount > 0 && (<tr><td>Discount ({discountCode})</td><td>- ₱ {(Number(discountAmount) || 0).toFixed(2)}</td></tr>)}
                    <tr className="total-row"><td><strong>Total Payment:</strong></td><td><strong>₱ {(Number(totalPayment) || 0).toFixed(2)}</strong></td></tr>
                  </tbody>
                </table>
                <div className="promo-section">
                  <div className="promo-input">
                    <input type="text" placeholder="Enter promo code" value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value); setPromoError('');
                        if (discountApplied) { setDiscountApplied(false); setDiscountAmount(0); }
                      }}
                      disabled={discountApplied && discountCode === validPromoCode} />
                    <button className="apply-btn" onClick={applyDiscount} disabled={discountApplied && discountCode === validPromoCode || !discountCode.trim()}>
                      {discountApplied && discountCode === validPromoCode ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                  {promoError && <p className="promo-error">{promoError}</p>}
                  {discountApplied && discountCode === validPromoCode && <p className="promo-success">Promo code applied! You saved ₱{discountAmount.toFixed(2)}.</p>}
                </div>
                <div className="payment-option-checkout">
                  <span>Payment Option: </span>
                  <div className="payment-selector">
                    <span>{paymentMethod}</span>
                    <button className="payment-toggle" onClick={() => setShowPaymentOptions(!showPaymentOptions)}>Change</button>
                    {showPaymentOptions && (
                      <div className="payment-dropdown">
                        {['Cash On Delivery', 'GCash', 'Credit/Debit Card'].map(method => (
                          <button key={method} onClick={() => { setPaymentMethod(method); setShowPaymentOptions(false); }}>{method}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {orderError && <p className="error-message co-error">{orderError}</p>}
                <button className="place-order-btn" onClick={handlePlaceOrder} disabled={isPlacingOrder || cartItems.length === 0 || !deliveryAddress}>
                  {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default CheckoutPage;