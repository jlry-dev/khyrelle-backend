import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { productImages } from '../../../utils/productImages';
import { useCart } from '../../../data/CartProvider';
import './Search.css';

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleAddToCart } = useCart();

  const query = searchParams.get('q');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const fetchSearchResults = useCallback(async (page) => {
    setIsLoading(true);
    setError(null);
    try {
  // The backend route is /api/products/search?q=...
  const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`); // Ensure query is URI encoded

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Search failed with status: ${response.status}` }));
    throw new Error(errorData.message);
  }

  // Backend directly returns an array of results, not an object with 'results' and 'pagination'
  const resultsArray = await response.json(); // Expecting an array directly

  const processedResults = resultsArray.map(product => ({
    ...product,
    image: productImages[product.ImagePath] || productImages['default_placeholder.png'] || '/placeholder.png', // Added a final fallback
    price: Number(product.Price) || 0
  }));

  setSearchResults(processedResults);

  // Since backend doesn't send pagination, set a simple pagination state based on current results
  setPagination({
    page: 1, // Assuming all results are on one page for now
    limit: processedResults.length,
    total: processedResults.length,
    totalPages: 1
  });

} catch (err) {
  console.error("Search error:", err);
  setError(err.message);
  setSearchResults([]);
} finally {
  setIsLoading(false);
}

  }, [query]);

  useEffect(() => {
    if (query && query.trim() !== '') {
      fetchSearchResults(1);
    }
  }, [query, fetchSearchResults]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchSearchResults(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleViewDetails = (productId) => {
    navigate(`/productdetails/${productId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="search-results-loading">
        <div className="spinner"></div>
        <p>Searching for "{query}"...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="search-results-error">
        <h2>Search Error</h2>
        <p>{error}</p>
        <button onClick={() => fetchSearchResults(pagination.page)}>
          Retry Search
        </button>
      </div>
    );
  }

  // Empty query state
  if (!query || query.trim() === '') {
    return (
      <div className="search-results-empty">
        <h2>Search Products</h2>
        <p>Enter a search term in the box above</p>
      </div>
    );
  }

  // No results state
  if (searchResults.length === 0) {
    return (
      <div className="search-results-none">
        <h2>No results found for "{query}"</h2>
        <p>Try different search terms or browse our categories</p>
      </div>
    );
  }

  return (
    <div className="search-results-container">
      <h1>Results for "{query}"</h1>
      <p className="results-count">
        Showing {(pagination.page - 1) * pagination.limit + 1}-
        {Math.min(pagination.page * pagination.limit, pagination.total)} 
        of {pagination.total} products
      </p>

      <div className="product-grid">
        {searchResults.map(product => (
          <div key={product.ProductID} className="product-card">
            <img 
              src={product.image} 
              alt={product.Name}
              onClick={() => handleViewDetails(product.ProductID)}
            />
            <h3>{product.Name}</h3>
            <p className="product-type">{product.ItemType} - {product.Material}</p>
            <p className="price">₱{product.price.toFixed(2)}</p>
            {product.Stock <= 5 && (
              <p className="stock-warning">
                {product.Stock > 0 ? `Only ${product.Stock} left!` : 'Out of stock'}
              </p>
            )}
            <button 
              onClick={() => handleAddToCart({
                id: product.ProductID,
                name: product.Name,
                price: product.price,
                image: product.image,
                description: product.Description,
                ImagePath: product.ImagePath,
                ItemType: product.ItemType,
                Material: product.Material,
                Stock: product.Stock
              })}
              disabled={product.Stock <= 0}
            >
              {product.Stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </button>
          
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          
          <button 
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Search;