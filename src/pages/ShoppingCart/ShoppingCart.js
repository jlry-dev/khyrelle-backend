// src/pages/ShoppingCart/ShoppingCart.js
import React, { useMemo } from 'react';
import './ShoppingCart.css'; // Make sure this CSS file exists and is styled
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../data/CartProvider'; // Adjust path

// Example image imports for recommended items (if they are static and from src/assets)
// Ensure these paths are correct relative to ShoppingCart.js
import bronzeDaggerImg from '../../assets/bronze_dagger.png';
import ironArmorImg from '../../assets/iron_armor.png';
import steelHelmetImg from '../../assets/steel_helmet.png';
import titaniumDaggerImg from '../../assets/titanium_dagger.png';
// The imageMap is primarily managed in ProductDetail/ProductPage.
// item.image coming from CartProvider should already be the imported variable.

export default function ShoppingCart() {
  const { 
    cartItems, 
    cartTotal,
    itemCount,
    handleQuantityChange, 
    handleRemoveItem, 
    handleAddToCart 
  } = useCart();

  const navigate = useNavigate();

  const recommendedItems = [ // Static example, ensure these items have necessary fields for handleAddToCart
    { id: 5, ProductID: 5, Name: "Bronze Dagger", Price: 1000, ImagePath: 'bronze_dagger.png', image: bronzeDaggerImg, Description: "A trusty sidearm.", ItemType: 'dagger', Material: 'bronze', Stock: 10, Rating: 4, CraftedBy: "Artisan" },
    { id: 6, ProductID: 6, Name: "Iron Armor", Price: 1200, ImagePath: 'iron_armor.png', image: ironArmorImg, Description: "Solid protection.", ItemType: 'armor', Material: 'iron', Stock: 10, Rating: 4, CraftedBy: "Artisan" },
    { id: 7, ProductID: 7, Name: "Steel Helmet", Price: 600, ImagePath: 'steel_helmet.png', image: steelHelmetImg, Description: "Head safety first.", ItemType: 'helmet', Material: 'steel', Stock: 10, Rating: 4, CraftedBy: "Artisan" },
    { id: 8, ProductID: 8, Name: "Titanium Dagger", Price: 1700, ImagePath: 'titanium_dagger.png', image: titaniumDaggerImg, Description: "Light and sharp.", ItemType: 'dagger', Material: 'titanium', Stock: 10, Rating: 4, CraftedBy: "Artisan" }
  ];
  
  // Subtotal for display (base price * quantity, without rush fee for this line item)
  const subtotal = useMemo(() => (
    cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  ), [cartItems]);

  const shipping = 0; // Placeholder
  const tax = 0;      // Placeholder
  // cartTotal from useCart() includes rushOrder fees.

  return (
    <div className="shopping-cart-container">
      <header className="cart-header">
        <h1>Your Shopping Cart</h1>
        <div className="cart-count">Items: {itemCount}</div>
      </header>
      
      <div className="main-container">
        <div className="cart-layout">
          <div className="cart-items-section">
            {cartItems.length === 0 ? (
              <p className="empty-cart-message">Your cart is currently empty. <Link to="/products">Continue Shopping</Link></p>
            ) : (
              cartItems.map(item => (
                <CartItem 
                  key={`${item.id}-${item.rushOrder}`} 
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))
            )}
          </div>
          
          {cartItems.length > 0 && (
            <OrderSummary 
              subtotal={subtotal} 
              shipping={shipping}
              tax={tax}
              total={cartTotal} 
            />
          )}
        </div>
        
        <RecommendedItems 
          items={recommendedItems}
          onAddToCart={handleAddToCart} 
        />
      </div>
    </div>
  );
}

const CartItem = ({ item, onQuantityChange, onRemove }) => (
  <div className="cart-item">
    <div className="item-image">
      <div className="image-placeholder">
        {/* item.image should be the imported image variable if added correctly from ProductDetail */}
        <img src={item.image || '/placeholder.png'} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
    </div>
    <div className="item-details">
      <h3>{item.name}</h3>
      <p className="item-description">{item.description}</p>
      {item.rushOrder && <p className="rush-order-tag">Rush Order (+20%)</p>}
      <div className="quantity-control">
        <button className="quantity-btn decrease" onClick={() => onQuantityChange(item.id, -1, item.rushOrder)} >−</button>
        <span className="quantity-display">{item.quantity}</span>
        <button className="quantity-btn increase" onClick={() => onQuantityChange(item.id, 1, item.rushOrder)} >+</button>
        <button className="remove-btn" onClick={() => onRemove(item.id, item.rushOrder)}>Remove</button>
      </div>
    </div>
    <div className="item-price">
      ₱{(item.totalPrice || 0).toFixed(2)}
    </div>
  </div>
);

const OrderSummary = ({ subtotal, shipping, tax, total }) => {
  const navigate = useNavigate();
  return (
    <div className="summary-section">
      <div className="summary-container">
        <h2 className="summary-title">Order Summary</h2>
        <div className="summary-details">
          <div className="summary-row"><span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span></div>
          <div className="summary-row"><span>Estimated Shipping</span><span>₱{shipping.toFixed(2)}</span></div>
          <div className="summary-row"><span>Tax</span><span>₱{tax.toFixed(2)}</span></div>
          <div className="summary-divider"></div>
          <div className="summary-row total"><span>Total</span><span>₱{total.toFixed(2)}</span></div>
        </div>
        <button className="checkout-btn">
          <Link to="/checkout">Proceed to Checkout</Link>
        </button>
        <button className="continue-btn" onClick={() => navigate('/products')}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

const RecommendedItems = ({ items, onAddToCart }) => (
  <div className="recommended-section">
    <h2 className="recommended-title">You Might Also Like</h2>
    <div className="recommended-grid">
      {items.map(item => (
        <div key={item.id} className="recommended-item">
          <div className="recommended-image">
            <img src={item.image} alt={item.Name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="recommended-details">
            <h3>{item.Name}</h3>
            <p className="recommended-price">₱{item.Price.toFixed(2)}</p>
            <button 
              className="add-to-cart-btn"
              onClick={() => onAddToCart({ 
                  id: item.ProductID, 
                  name: item.Name,
                  price: item.Price,
                  quantity: 1, 
                  image: item.image, 
                  description: item.Description,
                  rushOrder: false, 
                  ItemType: item.ItemType,
                  Material: item.Material,
                  Stock: item.Stock,
                  Rating: item.Rating,
                  CraftedBy: item.CraftedBy,
                  ImagePath: item.ImagePath 
              })}
            >
              <span className="icon-bag">🛍️</span> Add to Cart
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);
