// src/pages/checkout/co.js (or your CheckoutPage.js path)
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './co.css'; // Make sure this CSS file exists and is styled
import { useCart } from '../../data/CartProvider'; // Adjust path to your CartProvider.js

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { 
    cartItems, 
    // cartTotal, // We will use totalPayment calculated locally for the order summary
    handleQuantityChange: updateCartQuantity, 
    handleRemoveItem: removeFromCart,
    clearCart // Assuming CartProvider will have a clearCart function after order placement
  } = useCart();

  const [message, setMessage] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash On Delivery');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false); // For loading state
  const [orderError, setOrderError] = useState(''); // For errors during order placement

  const validPromoCode = 'METAL10'; 
  const promoDiscountPercentage = 0.10; 

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
    if (!discountCode) {
      setPromoError('Please enter a promo code');
      return;
    }
    if (discountCode.trim().toUpperCase() === validPromoCode) {
      setDiscountApplied(true);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code');
      setDiscountApplied(false);
      setDiscountAmount(0);
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
        alert("Your cart is empty. Please add items before placing an order.");
        return;
    }
    setIsPlacingOrder(true);
    setOrderError('');

    // Determine if the overall order is a rush order
    const isRushOrder = cartItems.some(item => item.rushOrder);

    const orderPayload = {
      // CustomerID would come from auth context in a real app
      // For now, backend will use a placeholder or you can pass a default
      // customerId: 1, // Example: if you had user auth
      items: cartItems.map(item => ({
        productId: item.id, // This is ProductID
        quantity: item.quantity,
        unitPrice: Number(item.price) || 0,
        isRushItem: item.rushOrder, // To inform backend if specific items contribute to rush status
        // Backend will calculate total item price based on unitPrice, quantity, and rush status if needed per item
      })),
      messageForSeller: message,
      discountCode: discountApplied ? discountCode : null,
      appliedDiscountAmount: discountAmount,
      paymentMethod: paymentMethod,
      merchandiseSubtotal: merchandiseSubtotal,
      shippingFee: shipping,
      finalTotal: totalPayment,
      isRushOrder: isRushOrder // Overall order rush status
    };
    
    try {
      const response = await fetch(`/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add Authorization header if you have tokens:
          // 'Authorization': `Bearer ${yourAuthToken}`
        },
        body: JSON.stringify(orderPayload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to place order.');
      }

      // Order placed successfully
      console.log("Order Placed Successfully:", responseData);
      if (clearCart) clearCart(); // Clear the cart from CartProvider (and localStorage)
      
      // Pass order details (including the new OrderID from backend) to confirmation page
      navigate('/orderconfirm', { 
        state: { 
          orderDetails: responseData.orderDetails // Assuming backend returns this
        } 
      });

    } catch (error) {
      console.error("Error placing order:", error);
      setOrderError(error.message || "An unexpected error occurred while placing your order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };


  return (
    <div className="checkout-page">
      <main className="checkout-container">
        <h1>Checkout</h1>
        <p className="checkout-description">
          Review your order details, enter your delivery and payment info, and place your order to complete your purchase.
        </p>

        <div className="checkout-sections">
          <div className="order-items-section">
            <h2>Your Items</h2>
            {cartItems.length === 0 ? (
                <p>Your cart is empty. <Link to="/products">Continue Shopping</Link></p>
            ) : (
                cartItems.map(item => (
                  <div key={`${item.id}-${item.rushOrder}`} className="order-item">
                    <div className="item-image">
                      <img src={item.image || '/placeholder.png'} alt={item.name} />
                    </div>
                    <div className="item-details">
                      <div className="item-info">
                        <h3>{item.name}</h3>
                        <p className="item-description">{item.description}</p>
                        {item.rushOrder && <p className="rush-order-tag-checkout">Rush Order</p>}
                        <p className="item-price">₱ {(Number(item.price) || 0).toFixed(2)} / unit</p>
                      </div>
                      <div className="item-actions">
                        <div className="quantity-control">
                          <button onClick={() => updateCartQuantity(item.id, -1, item.rushOrder)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, 1, item.rushOrder)}>+</button>
                        </div>
                        <button className="remove-btn" onClick={() => removeFromCart(item.id, item.rushOrder)}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))
            )}

            {cartItems.length > 0 && (
              <>
                <div className="message-section">
                  <label>Message for Seller (Optional):</label>
                  <textarea
                    placeholder="Any special instructions for your order..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="promo-section">
                  <div className="promo-input">
                    <input 
                      type="text" 
                      placeholder="Enter promo code" 
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value);
                        setPromoError(''); 
                        if (discountApplied) { 
                            setDiscountApplied(false);
                            setDiscountAmount(0);
                        }
                      }}
                      disabled={discountApplied && discountCode === validPromoCode} 
                    />
                    <button 
                      className="apply-btn"
                      onClick={applyDiscount}
                      disabled={discountApplied && discountCode === validPromoCode}
                    >
                      {discountApplied && discountCode === validPromoCode ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                  {promoError && <p className="promo-error">{promoError}</p>}
                  {discountApplied && discountCode === validPromoCode && (
                    <p className="promo-success">
                      Promo code applied! Discount: ₱ {discountAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="order-summary-section">
              <h2>Order Summary</h2>
              <table className="summary-table">
                <tbody>
                  <tr>
                    <td>Merchandise Subtotal</td>
                    <td>₱ {(Number(merchandiseSubtotal) || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Shipping Fee</td>
                    <td>₱ {(Number(shipping) || 0).toFixed(2)}</td>
                  </tr>
                  {discountApplied && discountAmount > 0 && (
                    <tr>
                      <td>Discount</td>
                      <td>- ₱ {(Number(discountAmount) || 0).toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <td><strong>Total Payment:</strong></td>
                    <td><strong>₱ {(Number(totalPayment) || 0).toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>

              <div className="payment-option-checkout">
                <span>Payment Option: </span>
                <div className="payment-selector">
                  <span>{paymentMethod}</span>
                  <button 
                    className="payment-toggle"
                    onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                  >
                    Change
                  </button>
                  {showPaymentOptions && (
                    <div className="payment-dropdown">
                      {['Cash On Delivery', 'GCash', 'Credit/Debit Card'].map(method => (
                        <button key={method} onClick={() => {
                          setPaymentMethod(method);
                          setShowPaymentOptions(false);
                        }}>
                          {method}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {orderError && <p className="error-message" style={{color: 'red', marginTop: '10px'}}>{orderError}</p>}
              <button className="place-order-btn" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
