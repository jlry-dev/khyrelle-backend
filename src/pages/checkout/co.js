// src/pages/checkout/co.js (or your CheckoutPage.js path)
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './co.css'; // Make sure this CSS file exists and is styled
import { useCart } from '../../data/CartProvider'; 
import { useAuth } from '../../data/AuthProvider'; 

// --- Address Form Component (No longer a modal overlay) ---
const AddressForm = ({ onClose, onSave, currentAddress, initialUserData }) => {
  const [addressForm, setAddressForm] = useState({
    recipientName: '', line1: '', line2: '', city: '', 
    postalCode: '', country: '', contactPhone: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Pre-fill form:
    // 1. If editing an existing, valid address.
    // 2. If adding a new address AND initialUserData (from logged-in user) is available for pre-fill.
    // 3. Otherwise, empty form for a completely new address.
    if (currentAddress && currentAddress.line1) { // Check if currentAddress is substantial
      setAddressForm(currentAddress);
    } else if (initialUserData) { 
      setAddressForm({
        recipientName: `${initialUserData.firstName || ''} ${initialUserData.lastName || ''}`.trim() || '',
        contactPhone: initialUserData.phone || '',
        line1: '', line2: '', city: '', postalCode: '', country: '' // Address fields start empty
      });
    } else { 
      setAddressForm({ // Default empty state
        recipientName: '', line1: '', line2: '', city: '', 
        postalCode: '', country: '', contactPhone: ''
      });
    }
  }, [currentAddress, initialUserData]); // Effect runs when these change

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!addressForm.recipientName.trim()) newErrors.recipientName = "Recipient name is required.";
    if (!addressForm.line1.trim()) newErrors.line1 = "Address line 1 is required.";
    if (!addressForm.city.trim()) newErrors.city = "City is required.";
    if (!addressForm.postalCode.trim()) newErrors.postalCode = "Postal code is required.";
    if (!addressForm.country.trim()) newErrors.country = "Country is required.";
    if (!addressForm.contactPhone.trim()) newErrors.contactPhone = "Contact phone is required.";
    else if (!/^\+?[0-9\s-()]{7,20}$/.test(addressForm.contactPhone)) newErrors.contactPhone = "Invalid phone number format.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(addressForm);
      // onClose(); // Parent (CheckoutPage) will hide the form by setting showAddressForm to false
    }
  };

  return (
    // This container will be styled to appear "below" the button in the page flow
    <div className="co-address-form-inline-container"> 
      <div className="co-address-form-content"> {/* Add styles for this box if needed */}
        <h3>{currentAddress && currentAddress.line1 ? 'Edit Delivery Address' : 'Add Delivery Address'}</h3>
        <div className="address-form-fields"> 
          <div className="form-group-co">
            <label htmlFor="modalRecipientName">Recipient Name*</label>
            <input type="text" id="modalRecipientName" name="recipientName" value={addressForm.recipientName} onChange={handleChange} />
            {errors.recipientName && <p className="error-text-co">{errors.recipientName}</p>}
          </div>
          <div className="form-group-co">
            <label htmlFor="modalLine1">Address Line 1*</label>
            <input type="text" id="modalLine1" name="line1" value={addressForm.line1} onChange={handleChange} />
            {errors.line1 && <p className="error-text-co">{errors.line1}</p>}
          </div>
          <div className="form-group-co">
            <label htmlFor="modalLine2">Address Line 2 (Optional)</label>
            <input type="text" id="modalLine2" name="line2" value={addressForm.line2} onChange={handleChange} />
          </div>
          <div className="form-group-co">
            <label htmlFor="modalCity">City*</label>
            <input type="text" id="modalCity" name="city" value={addressForm.city} onChange={handleChange} />
            {errors.city && <p className="error-text-co">{errors.city}</p>}
          </div>
          <div className="form-group-co">
            <label htmlFor="modalPostalCode">Postal Code*</label>
            <input type="text" id="modalPostalCode" name="postalCode" value={addressForm.postalCode} onChange={handleChange} />
            {errors.postalCode && <p className="error-text-co">{errors.postalCode}</p>}
          </div>
          <div className="form-group-co">
            <label htmlFor="modalCountry">Country*</label>
            <input type="text" id="modalCountry" name="country" value={addressForm.country} onChange={handleChange} />
            {errors.country && <p className="error-text-co">{errors.country}</p>}
          </div>
          <div className="form-group-co">
            <label htmlFor="modalContactPhone">Contact Phone*</label>
            <input type="tel" id="modalContactPhone" name="contactPhone" value={addressForm.contactPhone} onChange={handleChange} />
            {errors.contactPhone && <p className="error-text-co">{errors.contactPhone}</p>}
          </div>
        </div>
        <div className="co-form-actions"> 
          {/* Apply button styles similar to 'Place Order' */}
          <button onClick={handleSave} className="co-primary-action-btn">Save Address</button>
          <button onClick={onClose} className="co-secondary-action-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};


const CheckoutPage = () => {
  const navigate = useNavigate();
  const { 
    cartItems, 
    handleQuantityChange: updateCartQuantity, 
    handleRemoveItem: removeFromCart,
    clearCart 
  } = useCart();
  const { user, isAuthenticated } = useAuth(); 

  const [message, setMessage] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash On Delivery');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  const [deliveryAddress, setDeliveryAddress] = useState(null); 
  const [showAddressForm, setShowAddressForm] = useState(false); // To toggle inline form visibility

  const validPromoCode = 'METAL10'; 
  const promoDiscountPercentage = 0.10; 

  const initialAddressDataForForm = useMemo(() => {
    if (isAuthenticated && user) {
      return {
        firstName: user.firstName, 
        lastName: user.lastName,
        phone: user.phone 
      };
    }
    return null; 
  }, [user, isAuthenticated]);

  const handleSaveAddressFromForm = (newAddress) => {
    setDeliveryAddress(newAddress); 
    setShowAddressForm(false); // Close the inline form after saving
  };

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

  const applyDiscount = () => { /* ... same as before ... */ };

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
        alert("Please add or confirm your delivery address.");
        setShowAddressForm(true); // Open the form if address is missing
        return;
    }

    setIsPlacingOrder(true); setOrderError('');
    const isRushOrderOverall = cartItems.some(item => item.rushOrder);

    const orderPayloadToBackend = {
      items: cartItems.map(item => ({
        productId: item.id, quantity: item.quantity,
        unitPrice: Number(item.price) || 0, isRushItem: item.rushOrder,
      })),
      paymentMethod: paymentMethod,
      finalTotal: totalPayment,
      isRushOrder: isRushOrderOverall,
      messageForSeller: message, 
      discountCode: discountApplied ? discountCode : null,
      appliedDiscountAmount: discountAmount,
      merchandiseSubtotal: merchandiseSubtotal,
      shippingFee: shipping,
      deliveryAddress: deliveryAddress 
    };
    
    try {
      const apiUrl = `/api/orders`; 
      const headers = { 'Content-Type': 'application/json' };
      if (user && user.CustomerID) {
        headers['temp-user-id'] = user.CustomerID;
      } else {
        throw new Error("User CustomerID not found for placing order. Please log in again.");
      }

      const response = await fetch(apiUrl, {
        method: 'POST', headers: headers, body: JSON.stringify(orderPayloadToBackend)
      });
      const backendResponseData = await response.json(); 
      if (!response.ok) {
        if (response.headers.get("content-type") && !response.headers.get("content-type").includes("application/json")) {
            const textError = await response.text(); console.error("Backend Error (Non-JSON Response):", textError);
        }
        throw new Error(backendResponseData.message || `Failed to place order. Status: ${response.status}`);
      }
      
      const orderDataForConfirmation = {
        orderId: backendResponseData.orderDetails.orderId,
        orderDate: backendResponseData.orderDetails.orderDate || new Date().toLocaleDateString(),
        paymentMethod: paymentMethod, 
        items: cartItems.map(item => ({ 
          id: item.id, name: item.name, quantity: item.quantity,
          price: Number(item.price) || 0, totalItemPrice: item.totalPrice, 
          image: item.image, description: item.description,
          rushOrder: item.rushOrder, ImagePath: item.ImagePath 
        })),
        merchandiseSubtotal: merchandiseSubtotal, shippingFee: shipping,
        appliedDiscountAmount: discountAmount, finalTotal: totalPayment, 
        customerDetails: { 
            name: deliveryAddress.recipientName, 
            shippingAddress: `${deliveryAddress.line1}${deliveryAddress.line2 ? ', ' + deliveryAddress.line2 : ''}, ${deliveryAddress.city}, ${deliveryAddress.postalCode}, ${deliveryAddress.country}`,
            contactPhone: deliveryAddress.contactPhone
        }
      };
      
      console.log("CheckoutPage: Data being SENT to confirmation:", JSON.stringify(orderDataForConfirmation, null, 2));

      if (typeof clearCart === 'function') clearCart(); 
      else console.warn("clearCart function not available from useCart().");
      
      navigate('/orderconfirm', { state: { orderData: orderDataForConfirmation } });
    } catch (error) {
      console.error("Error placing order:", error);
      if (error.message.includes("Unexpected token '<'")) {
        setOrderError("Failed to communicate with the order server. Please check backend logs.");
      } else { setOrderError(error.message || "An unexpected error occurred."); }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="checkout-page">
      <main className="checkout-container">
        <h1>Checkout</h1>
        
        <div className="checkout-sections">
          {/* Order Items Section */}
          <div className="order-items-section">
            <h2>Your Items ({cartItems.length})</h2>
            {cartItems.length === 0 ? ( <p>Your cart is empty. <Link to="/products">Continue Shopping</Link></p> ) : ( 
                cartItems.map(item => (
                  <div key={`${item.id}-${item.rushOrder}`} className="order-item">
                    <div className="item-image"><img src={item.image || '/placeholder.png'} alt={item.name} className="checkout-item-thumbnail"/></div>
                    <div className="item-details">
                      <div className="item-info">
                        <h3>{item.name}</h3>
                        <p className="item-description">{item.description}</p>
                        {item.rushOrder && <p className="rush-order-tag-checkout">Rush Order</p>}
                        <p className="item-price">₱ {(Number(item.price) || 0).toFixed(2)} / unit</p>
                      </div>
                      <div className="item-actions">
                        <div className="quantity-control">
                          <button onClick={() => updateCartQuantity(item.cartItemId || {productId: item.id, rushOrder: item.rushOrder}, -1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.cartItemId || {productId: item.id, rushOrder: item.rushOrder}, 1)}>+</button>
                        </div>
                        <button className="remove-btn" onClick={() => removeFromCart(item.cartItemId || {productId: item.id, rushOrder: item.rushOrder})}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="order-details-and-summary"> 
                <div className="customer-details-section"> 
                    <div className="delivery-address-summary">
                        <h2>Delivery Details</h2>
                        {deliveryAddress && deliveryAddress.line1 ? (
                            <div className="address-display-box">
                                <p><strong>Recipient:</strong> {deliveryAddress.recipientName}</p>
                                <p>{deliveryAddress.line1}</p>
                                {deliveryAddress.line2 && <p>{deliveryAddress.line2}</p>}
                                <p>{deliveryAddress.city}, {deliveryAddress.postalCode}</p>
                                <p>{deliveryAddress.country}</p>
                                <p><strong>Phone:</strong> {deliveryAddress.contactPhone}</p>
                                <button onClick={() => setShowAddressForm(true)} className="co-primary-action-btn">Change Address</button>
                            </div>
                        ) : (
                            <div className="address-prompt">
                                <p>Please add your delivery address.</p>
                                <button onClick={() => setShowAddressForm(true)} className="co-primary-action-btn co-add-address-btn">Add Delivery Address</button>
                            </div>
                        )}
                    </div>
                    
                    {/* Conditionally render the AddressForm inline */}
                    {showAddressForm && (
                        <AddressForm 
                            onClose={() => setShowAddressForm(false)}
                            onSave={handleSaveAddressFromForm}
                            currentAddress={deliveryAddress} // Pass current to pre-fill if editing
                            initialUserData={initialAddressDataForForm} // Pass user data to pre-fill new address
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
                      {discountApplied && discountAmount > 0 && (<tr><td>Discount</td><td>- ₱ {(Number(discountAmount) || 0).toFixed(2)}</td></tr>)}
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
                        <button className="apply-btn" onClick={applyDiscount} disabled={discountApplied && discountCode === validPromoCode}>
                          {discountApplied && discountCode === validPromoCode ? 'Applied' : 'Apply'}
                        </button>
                      </div>
                      {promoError && <p className="promo-error">{promoError}</p>}
                      {discountApplied && discountCode === validPromoCode && <p className="promo-success">Promo code applied! Discount: ₱ {discountAmount.toFixed(2)}</p>}
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
                  <button className="place-order-btn" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
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
