// src/pages/ProductDetail/ProductDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ProductDetails.css'; // Make sure this CSS file exists and is styled
import { useCart } from '../../data/CartProvider'; // Adjust path if necessary
import { productImages } from '../../utils/productImages'; // ADD THIS IMPORT
// !!! IMPORTANT: YOU MUST IMPORT ALL YOUR PRODUCT IMAGES FROM src/assets HERE !!!
// AND ADD THEM TO THE imageMap BELOW. THESE ARE EXAMPLES.
// Adjust paths relative to this file's location (e.g., '../../assets/image.png' 
// if ProductDetail.js is in 'src/pages/ProductDetail/' and images are in 'src/assets/').

import steelSwordImg from '../../assets/steel_sword.png'; 
import ironShieldImg from '../../assets/iron_shield.png';
import bronzeHelmetImg from '../../assets/bronze_helmet.png';
// ... ADD IMPORTS FOR ALL YOUR OTHER PRODUCT IMAGES ...
// Example: import steelArmorImg from '../../assets/steel_armor.png';

const imageMap = {
  // !!! Keys should be the EXACT ImagePath filename string from your API/database !!!
  'steel_sword.png': steelSwordImg,
  'iron_shield.png': ironShieldImg,
  'bronze_helmet.png': bronzeHelmetImg,
  // ... ADD MAPPINGS FOR ALL YOUR IMPORTED IMAGES ...
  // Example: 'steel_armor.png': steelArmorImg,
  'default_placeholder.png': null // Optional: for a fallback image
};

const ProductDetail = () => {
  const { id } = useParams(); // Get product ID from the URL
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [rushOrder, setRushOrder] = useState(false);
  const [activeTab, setActiveTab] = useState('Description');
  
  const { handleAddToCart } = useCart(); // Get the function from CartContext
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductDetails = async () => {
      setIsLoading(true);
      setError(null);
      setProduct(null); // Reset product on ID change
      setRelatedProducts([]); // Reset related products

      try {
        // Fetch the main product details from your backend API
        const productApiUrl = `/api/products/${id}`;
        const productResponse = await fetch(productApiUrl);

        if (!productResponse.ok) {
          if (productResponse.status === 404) {
            setError(`Product with ID ${id} not found.`);
          } else {
            throw new Error(`Failed to fetch product. Status: ${productResponse.status}`);
          }
          return; // Stop execution if product fetch fails
        }
        
        const productData = await productResponse.json();
        setProduct(productData); // Set the fetched product

        // Fetch all products to find related ones (based on Material, excluding current product)
        // For a large number of products, a dedicated backend endpoint for related items would be more efficient.
        if (productData && productData.Material) { 
          const allProductsApiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/products`;
          const allProductsResponse = await fetch(allProductsApiUrl);
          if (allProductsResponse.ok) {
            const allProductsData = await allProductsResponse.json();
            const related = allProductsData.filter(p => 
              p.Material === productData.Material && 
              p.ProductID !== productData.ProductID // Compare with ProductID from API
            ).slice(0, 4); // Limit to 4 related products
            setRelatedProducts(related);
          }
        }
      } catch (err) {
        console.error("Error in fetchProductDetails:", err);
        setError(err.message || 'Failed to load product details.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProductDetails();
    }
  }, [id]); // Re-run effect if the product ID in the URL changes

  const incrementQuantity = () => {
    // Use product.Stock from API data. Default to a sensible max if Stock is not available.
    if (product && quantity < (product.Stock || 10)) { 
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const toggleRushOrder = () => {
    setRushOrder(!rushOrder);
  };

  const addToCartHandler = () => {
    if (!product) return; // Ensure product data is loaded
    
    const itemToAdd = {
      id: product.ProductID, // Use ProductID from your API response
      name: product.Name,
      price: product.Price,
      quantity: quantity,
      // Use the imageMap to get the imported image variable based on ImagePath from API
      image: imageMap[product.ImagePath] || imageMap['default_placeholder.png'], 
      description: product.Description,
      rushOrder: rushOrder,
      // Include other relevant fields from 'product' that CartProvider or CartItem might need
      ItemType: product.ItemType,
      Material: product.Material,
      Stock: product.Stock, 
      Rating: product.Rating,
      CraftedBy: product.CraftedBy,
      ImagePath: product.ImagePath // Store original filename for reference if needed
    };

    handleAddToCart(itemToAdd); // Call the function from CartContext
    alert(`${quantity} ${product.Name}(s) added to cart${rushOrder ? ' (Rush Order)' : ''}!`);
  };

  const renderStarRating = (rating) => {
    const roundedRating = Math.round(rating || 0); // Handle null or undefined rating
    return Array(5).fill(null).map((_, i) => (
      <span key={i} className={`pd-star ${i < roundedRating ? 'filled' : ''}`}>★</span>
    ));
  };
  
  const handleCheckout = () => {
    // If the user clicks "Checkout" on this page, it makes sense to add the current item configuration to the cart first
    if(product) {
        addToCartHandler();
    }
    navigate('/cart'); // Then navigate to the cart page (or a dedicated checkout page)
  };

  // --- Render Logic ---
  if (isLoading) return <div className="pd-loading">Loading product details...</div>;
  if (error) return <div className="pd-error">Error: {error} <Link to="/products">Go back to Products</Link></div>;
  if (!product) return <div className="pd-error">Product not found. <Link to="/products">Go back to Products</Link></div>;

  return (
    <div className="pd-product-detail-page">
      <div className="pd-product-detail-container">
        {/* Product Gallery */}
        <div className="pd-product-gallery">
          <div className="pd-main-image">
              <img src={productImages[product.ImagePath]} alt={product.Name} />
          </div>
          <div className="pd-thumbnail-gallery">
            {relatedProducts.map((related) => (
              <div key={related.ProductID} className="pd-thumbnail">
                {/* Use imageMap for related product images as well */}
                   <img src={productImages[product.ImagePath]} alt={product.Name} />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="pd-product-info">
          <h1 className="pd-product-title">{product.Name}</h1>
          <div className="pd-price-rating-container">
            <span className="pd-product-price">₱ {product.Price ? product.Price.toLocaleString() : 'N/A'}</span>
            <div className="pd-product-rating">
              {renderStarRating(product.Rating)}
              <span className="pd-review-count">({Math.round((product.Rating || 0) * 10)} reviews)</span>
            </div>
          </div>
          <p className="pd-product-number">Item #{product.ProductID}</p>
          <p className="pd-crafted-by">Crafted by: {product.CraftedBy}</p>
          <div className="pd-stock-info">
            <span className="pd-in-stock">● In Stock</span>
            <span className="pd-stock-quantity">({product.Stock || 0} available)</span>
          </div>
          <div className="pd-product-material">
            <h3>Material:</h3>
            <div className="pd-material-selector">
              {/* This select might be for display or could be interactive if materials change product variants */}
              <select defaultValue={product.Material} disabled> 
                <option value="steel">Steel</option>
                <option value="iron">Iron</option>
                <option value="bronze">Bronze</option>
                <option value="titanium">Titanium</option>
              </select>
            </div>
          </div>
          <div className="pd-product-quantity">
            <h3>Quantity:</h3>
            <div className="pd-quantity-selector">
              <button className="pd-quantity-button" onClick={decrementQuantity}>-</button>
              <input 
                type="number" 
                value={quantity} 
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  // Ensure quantity is within valid range (1 to stock)
                  if (!isNaN(value) && value > 0 && value <= (product.Stock || 10)) {
                    setQuantity(value);
                  } else if (!isNaN(value) && value <= 0) {
                    setQuantity(1); // Reset to 1 if input is invalid
                  }
                }}
                min="1"
                max={product.Stock || 10} // Use product.Stock from API
              />
              <button className="pd-quantity-button" onClick={incrementQuantity}>+</button>
            </div>
          </div>
          <div className="pd-rush-order">
            <input 
              type="checkbox" 
              id="pd-rush-order-checkbox" 
              checked={rushOrder} 
              onChange={toggleRushOrder} 
            />
            <label htmlFor="pd-rush-order-checkbox">Rush Order (+20% fee)</label>
          </div>
          <div className="pd-action-buttons">
            <button className="pd-add-to-cart" onClick={addToCartHandler}>ADD TO CART</button>
            <button className="pd-checkout" onClick={handleCheckout}>CHECKOUT</button>
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="pd-product-tabs">
        <div className="pd-tab-header">
          <div className={`pd-tab ${activeTab === 'Description' ? 'pd-active' : ''}`} onClick={() => setActiveTab('Description')}>Description</div>
          <div className={`pd-tab ${activeTab === 'Specification' ? 'pd-active' : ''}`} onClick={() => setActiveTab('Specification')}>Specification</div>
          <div className={`pd-tab ${activeTab === 'Reviews' ? 'pd-active' : ''}`} onClick={() => setActiveTab('Reviews')}>Reviews</div>
        </div>
        <div className="pd-tab-content">
          {activeTab === 'Description' && <p>{product.Description}</p>}
          {activeTab === 'Specification' && (
            <div>
              <p><strong>Type:</strong> {product.ItemType}</p>
              <p><strong>Material:</strong> {product.Material}</p>
              {/* Add more relevant specifications from your product data */}
            </div>
          )}
          {activeTab === 'Reviews' && (
            <div><p>No reviews yet. Be the first to review this product!</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
