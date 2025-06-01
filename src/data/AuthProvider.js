// src/data/AuthProvider.js (or your chosen path e.g., src/context/AuthProvider.js)
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); 
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 

  useEffect(() => {
    console.log("AuthProvider: Initializing session from localStorage...");
    const token = localStorage.getItem('authToken');
    const userDataString = localStorage.getItem('metalworksUser');
    console.log("AuthProvider: Found in localStorage:", { tokenExists: !!token, userDataStringExists: !!userDataString });
    
    if (token && userDataString) {
      try {
        const parsedUserData = JSON.parse(userDataString);
        console.log("AuthProvider: Parsed userData from localStorage:", parsedUserData);
        
        // CRITICAL CHECK: Ensure CustomerID is present and is a number
        if (parsedUserData && typeof parsedUserData.CustomerID === 'number' && !isNaN(parsedUserData.CustomerID)) {
          setUser(parsedUserData);
          setIsAuthenticated(true);
          console.log("AuthProvider: User session RESTORED successfully:", parsedUserData);
        } else {
          console.warn("AuthProvider: Restored userData MISSING or has INVALID CustomerID. Clearing stored session.", parsedUserData);
          localStorage.removeItem('authToken');
          localStorage.removeItem('metalworksUser');
          // No need to set user/isAuthenticated to null/false, they are already default
        }
      } catch (error) {
        console.error("AuthProvider: Failed to parse user data from localStorage. Clearing stored session.", error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('metalworksUser');
      }
    } else {
        console.log("AuthProvider: No token or user data in localStorage.");
    }
    setIsLoadingAuth(false); 
    console.log("AuthProvider: Initial auth check complete. isLoadingAuth:", false, "isAuthenticated:", isAuthenticated);
  }, []); // Empty dependency array: runs once on mount

  const login = (userDataFromBackend, token) => {
    console.log("AuthProvider: login function called with userDataFromBackend:", userDataFromBackend, "and token:", !!token);
    // CRITICAL CHECK: Ensure userDataFromBackend has CustomerID and it's a number
    if (userDataFromBackend && typeof userDataFromBackend.CustomerID === 'number' && !isNaN(userDataFromBackend.CustomerID) && token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('metalworksUser', JSON.stringify(userDataFromBackend)); 
      setUser(userDataFromBackend);
      setIsAuthenticated(true);
      console.log("AuthProvider: User LOGGED IN and session stored:", userDataFromBackend);
    } else {
      console.error("AuthProvider: Login FAILED - Invalid userData (missing/invalid CustomerID) or token from backend.", {userDataFromBackend, token});
      // Optionally, clear any partial storage if login data is bad
      localStorage.removeItem('authToken');
      localStorage.removeItem('metalworksUser');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const logout = () => {
    console.log("AuthProvider: logout called.");
    localStorage.removeItem('authToken');
    localStorage.removeItem('metalworksUser');
    setUser(null);
    setIsAuthenticated(false);
    // Navigation is typically handled by the component calling logout or by App.js
  };

  const contextValue = {
    isAuthenticated,
    user, 
    login,
    logout,
    isLoadingAuth 
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!isLoadingAuth && children} 
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) { 
    throw new Error('useAuth must be used within an AuthProvider. Make sure AuthProvider wraps your component tree.');
  }
  return context;
};
