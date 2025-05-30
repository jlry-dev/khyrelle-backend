import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ProductPage.css'; // Assuming your CSS is here
import { productImages } from '../../utils/productImages'; // ADD THIS IMPORT
const ProductPage = () => {
  const [allFetchedProducts, setAllFetchedProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    types: { sword: false, shield: false, armor: false, dagger: false, helmet: false },
    materials: { steel: false, iron: false, bronze: false, titanium: false }
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const apiUrl = ` /api/products`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAllFetchedProducts(data);
        setDisplayedProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError(err.message || 'Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const filterProducts = () => {
      if (allFetchedProducts.length === 0 && !isLoading) { // Avoid filtering empty array before load
         setDisplayedProducts([]);
         return;
      }

      const activeTypeFilters = Object.entries(filters.types).filter(([_, value]) => value).map(([key, _]) => key);
      const activeMaterialFilters = Object.entries(filters.materials).filter(([_, value]) => value).map(([key, _]) => key);
      
      if (activeTypeFilters.length === 0 && activeMaterialFilters.length === 0) {
        setDisplayedProducts(allFetchedProducts);
        return;
      }
      
      const filtered = allFetchedProducts.filter(product => {
        const productType = (product.ItemType || product.type || '').toLowerCase();
        const productMaterial = (product.Material || product.material || '').toLowerCase();
        const typeMatch = activeTypeFilters.length === 0 || activeTypeFilters.includes(productType);
        const materialMatch = activeMaterialFilters.length === 0 || activeMaterialFilters.includes(productMaterial);
        return typeMatch && materialMatch;
      });
      setDisplayedProducts(filtered);
    };

    if (!isLoading) { // Only filter if not loading to prevent issues with initial empty data
        filterProducts();
    }
  }, [filters, allFetchedProducts, isLoading]);

  const handleFilterChange = (category, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [category]: { ...prevFilters[category], [value]: !prevFilters[category][value] }
    }));
  };

  const renderStarRating = (rating) => {
    const roundedRating = Math.round(rating || 0);
    return (
      <div className="pl-rating-container">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`pl-star ${i < roundedRating ? 'filled' : ''}`}>★</span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div className="products-page"><div className="products-container"><h1>Our Products</h1><p className="loading-message">Loading products...</p></div></div>;
  }

  if (error) {
    return <div className="products-page"><div className="products-container"><h1>Our Products</h1><p className="error-message">Error: {error}</p></div></div>;
  }

  return (
    <div className="products-page">
      <div className="products-container">
        <h1>Our Products</h1>
        <div className="products-content">
          <div className="filters-sidebar">
            <h3>Filters</h3>
            <div className="filter-section">
              <h4>ITEM TYPE</h4>
              <div className="filter-options">
                {Object.keys(filters.types).map(typeKey => (
                  <label key={typeKey}>
                    <input type="checkbox" checked={filters.types[typeKey]} onChange={() => handleFilterChange('types', typeKey)} />
                    {typeKey.charAt(0).toUpperCase() + typeKey.slice(1) + (typeKey === 'armor' ? 's' : !typeKey.endsWith('s') ? 's' : '')} 
                  </label>
                ))}
              </div>
            </div>
            <div className="filter-section">
              <h4>MATERIAL</h4>
              <div className="filter-options">
                {Object.keys(filters.materials).map(materialKey => (
                  <label key={materialKey}>
                    <input type="checkbox" checked={filters.materials[materialKey]} onChange={() => handleFilterChange('materials', materialKey)} />
                    {materialKey.charAt(0).toUpperCase() + materialKey.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="products-grid">
            {displayedProducts.length > 0 ? displayedProducts.map(product => (
              <div className="pl-product-card" key={product.ProductID || product.id}>
                <div className="pl-product-image">
                <img src={productImages[product.ImagePath]} alt={product.Name} />
                </div>
                <div className="pl-product-info">
                  <h4>{product.Name}</h4>
                  <p className="pl-product-type">{(product.ItemType || '').toUpperCase()}</p>
                  <div className="pl-product-rating">
                    {renderStarRating(product.Rating)}
                    <span className="pl-review-count">({Math.round((product.Rating || 0) * 10)} reviews)</span>
                  </div>
                  <p className="pl-product-price">₱ {(product.Price || 0).toLocaleString()}</p>
                </div>
                <Link to={`/productdetails/${product.ProductID || product.id}`} className="view-details-button">
                  VIEW DETAILS
                </Link>
              </div>
            )) : (
              <p className="no-products-message">No products match your current filters or no products available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductPage;