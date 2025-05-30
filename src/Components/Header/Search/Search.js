import React from 'react';
import { useLocation } from 'react-router-dom';
import './Search.css'; // Optional: style this page

const Search = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = queryParams.get('q')?.toLowerCase() || '';

  // Simulated product list (empty for now — update later)
  const products = []; // Replace with your real products when ready

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm)
  );

  return (
    <div className="search-page">
      <h2>Search Results for "{searchTerm}"</h2>
      {filteredProducts.length > 0 ? (
        <ul className="product-list">
          {filteredProducts.map(product => (
            <li key={product.id} className="product-item">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No products found.</p>
      )}
    </div>
  );
};

export default Search;
