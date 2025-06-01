// src/pages/SearchResultsPage/SearchResultsPage.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { productImages } from '../../utils/productImages'; // Adjust path as needed
import { useCart } from '../../data/CartProvider'; // Adjust path for useCart
// You'll need a CSS file for this page, e.g., SearchResultsPage.css
import './SearchResultsPage.css'; 

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleAddToCart } = useCart(); // To add items to cart

  const query = searchParams.get('q');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query) {
      const fetchSearchResults = async () => {
        setIsLoading(true);
        setError(null);
        console.log(`Searching for: ${query}`);
        try {
          // Use relative path if proxy is set up in package.json
          const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Search failed. Status: ${response.status}`);
          }
          const data = await response.json();
          
          // Process images using the centralized map
          const processedResults = data.map(product => ({
            ...product,
            image: productImages[product.ImagePath] || productImages['default_placeholder.png']
          }));
          setSearchResults(processedResults);

        } catch (err) {
          console.error("Error fetching search results:", err);
          setError(err.message);
          setSearchResults([]); // Clear results on error
        } finally {
          setIsLoading(false);
        }
      };
      fetchSearchResults();
    } else {
      setSearchResults([]); // Clear results if no query
    }
  }, [query]); // Re-fetch when the query parameter changes

  const handleViewDetails = (productId) => {
    navigate(`/productdetails/${productId}`);
  };

  if (isLoading) {
    return <div className="search-results-loading">Forging your results for "{query}"...</div>;
  }

  if (error) {
    return <div className="search-results-error">Error searching for "{query}": {error}</div>;
  }

  return (
    <div className="search-results-page">
      <h1 className="search-results-title">
        Search Results for: <span className="search-query-display">"{query}"</span>
      </h1>
      {searchResults.length > 0 ? (
        <div className="search-results-grid">
          {searchResults.map(product => (
            <div className="srp-product-card" key={product.ProductID}>
              <Link to={`/productdetails/${product.ProductID}`} className="srp-product-link">
                <div className="srp-product-image-container">
                  <img 
                    src={product.image} // This is the resolved image variable
                    alt={product.Name} 
                    className="srp-product-image" 
                  />
                </div>
                <div className="srp-product-info">
                  <h4 className="srp-product-name">{product.Name}</h4>
                  <p className="srp-product-type">{(product.ItemType || '').toUpperCase()}</p>
                  <p className="srp-product-price">₱{(Number(product.Price) || 0).toFixed(2)}</p>
                  {/* Add rating if available */}
                </div>
              </Link>
              <div className="srp-product-actions">
                <button 
                  className="srp-add-to-cart-btn" 
                  onClick={() => handleAddToCart({
                    id: product.ProductID,
                    name: product.Name,
                    price: product.Price,
                    image: product.image, // Pass the resolved image variable
                    description: product.Description,
                    rushOrder: false, // Default, or allow configuration
                    ImagePath: product.ImagePath, // Pass original filename if needed by cart/checkout
                    // Add other necessary product fields that handleAddToCart expects
                    ItemType: product.ItemType,
                    Material: product.Material,
                    Stock: product.Stock,
                  })}
                >
                  Add to Cart
                </button>
                <button 
                  className="srp-view-details-btn" 
                  onClick={() => handleViewDetails(product.ProductID)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && <p className="search-no-results">No products found matching "{query}". Try a different forge!</p>
      )}
    </div>
  );
};

export default SearchResultsPage;
