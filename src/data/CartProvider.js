// src/data/CartProvider.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('metalworksCart');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Could not parse cart from localStorage", error);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false); // For API cart operations
  const [error, setError] = useState(null); // For API cart errors

  // Save to localStorage whenever cartItems change
  useEffect(() => {
    localStorage.setItem('metalworksCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // TODO: Implement fetchCartFromAPI if user is logged in
  // useEffect(() => {
  //   // if (userIsLoggedIn) {
  //   //   fetchCartFromAPI();
  //   // }
  // }, [/* user */]);

  // const fetchCartFromAPI = async () => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cart`); // Assuming GET fetches current user's cart
  //     if (!response.ok) throw new Error("Failed to fetch cart from server.");
  //     const data = await response.json();
  //     // Transform data if needed to match frontend structure (e.g., imageMap for images)
  //     // For now, assuming data matches structure with 'imagePath'
  //     const transformedData = data.map(item => ({
  //       ...item,
  //       image: imageMap[item.imagePath] || imageMap['default_placeholder.png'] // Example
  //     }));
  //     setCartItems(transformedData);
  //   } catch (err) {
  //     setError(err.message);
  //     console.error("API fetchCart error:", err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleAddToCart = useCallback(async (newItem) => {
    // Client-side update first for responsiveness
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item =>
        item.id === newItem.id &&
        item.rushOrder === newItem.rushOrder
      );
      
      let updatedItems;
      if (existingItem) {
        updatedItems = prevItems.map(item =>
          (item.id === newItem.id && item.rushOrder === newItem.rushOrder)
            ? { 
                ...item, 
                quantity: item.quantity + (newItem.quantity || 1),
                totalPrice: (item.price * (item.quantity + (newItem.quantity || 1))) * (item.rushOrder ? 1.2 : 1)
              } 
            : item
        );
      } else {
        updatedItems = [...prevItems, { 
          ...newItem, 
          quantity: newItem.quantity || 1,
          // image should already be the imported variable from ProductDetail/ProductPage
          totalPrice: (newItem.price * (newItem.quantity || 1)) * (newItem.rushOrder ? 1.2 : 1)
        }];
      }
      return updatedItems;
    });

    // TODO: API call to save to backend
    // try {
    //   const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cart/items`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json', /* Add Auth token if needed */ },
    //     body: JSON.stringify({ 
    //         productId: newItem.id, 
    //         quantity: newItem.quantity || 1, 
    //         price: newItem.price, // unit price
    //         rushOrder: newItem.rushOrder 
    //     })
    //   });
    //   if (!response.ok) throw new Error("Failed to add item to server cart.");
    //   // const data = await response.json();
    //   // Optionally re-fetch cart or update based on response: fetchCartFromAPI();
    // } catch (err) {
    //   console.error("API addToCart error:", err);
    //   // Handle error, maybe revert client-side change or notify user
    //   setError(err.message);
    // }
  }, []);

  const handleQuantityChange = useCallback(async (itemId, change, itemRushOrder) => {
    let clientUpdatedItem = null;
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId && item.rushOrder === itemRushOrder) {
          const newQuantity = Math.max(1, item.quantity + change);
          clientUpdatedItem = { 
            ...item, 
            quantity: newQuantity,
            totalPrice: item.price * newQuantity * (item.rushOrder ? 1.2 : 1)
          };
          return clientUpdatedItem;
        }
        return item;
      })
    );

    // TODO: API call to update backend
    // if (clientUpdatedItem) {
    //   try {
    //     // Find cartDbId if you store it on the item, or use productId and rushOrder to identify
    //     const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cart/items/${clientUpdatedItem.cartDbId || clientUpdatedItem.id}`, { // Adjust endpoint
    //       method: 'PUT',
    //       headers: { 'Content-Type': 'application/json', /* Auth token */ },
    //       body: JSON.stringify({ quantity: clientUpdatedItem.quantity })
    //     });
    //     if (!response.ok) throw new Error("Failed to update item quantity on server.");
    //     // fetchCartFromAPI(); // Or update based on response
    //   } catch (err) {
    //     console.error("API quantityChange error:", err);
    //     setError(err.message);
    //   }
    // }
  }, []);
const clearCart = () => {
  setCartItems([]);
  // localStorage.removeItem('metalworksCart'); // Or set to '[]'
};
  const handleRemoveItem = useCallback(async (itemId, itemRushOrder) => {
    setCartItems(prevItems => prevItems.filter(item => !(item.id === itemId && item.rushOrder === itemRushOrder)));

    // TODO: API call to remove from backend
    // try {
    //   // Find cartDbId or use productId and rushOrder
    //   const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cart/items/${itemId}`, { // Adjust endpoint
    //     method: 'DELETE',
    //     headers: { /* Auth token */ }
    //   });
    //   if (!response.ok) throw new Error("Failed to remove item from server cart.");
    //   // fetchCartFromAPI(); // Or update based on response
    // } catch (err) {
    //   console.error("API removeItem error:", err);
    //   setError(err.message);
    // }
  }, []);

  const cartTotal = cartItems.reduce((total, item) => total + (item.totalPrice || 0), 0);
  const itemCount = cartItems.reduce((count, item) => count + (item.quantity || 0), 0);

  return (
    <CartContext.Provider 
      value={{ 
        cartItems,
        cartTotal,
        itemCount,
        isLoading, // Expose loading/error for API operations if implemented
        error,     //
        handleAddToCart, 
        handleQuantityChange, 
        handleRemoveItem,
        // fetchCartFromAPI // Expose if implemented
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
