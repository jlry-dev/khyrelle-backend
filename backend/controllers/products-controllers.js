require('dotenv').config();

const dbPool = require("../config/db-config")

const getProducts = async (req, res) => { 
  let connection;
  try {
    connection = await dbPool.getConnection();
    const [products] = await connection.execute('SELECT * FROM `products`');
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to retrieve products.' });
  } finally {
    if (connection) connection.release();
  }
}

const getProduct = async (req, res) => { 
  const { id } = req.params;
  let connection;
  try {
    connection = await dbPool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM `products` WHERE `ProductID` = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    res.status(500).json({ message: 'Failed to retrieve product details.' });
  } finally {
    if (connection) connection.release();
  }
}

const getSearchProducts = async (req, res) => {
  const searchTerm = req.query.q; 
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
    return res.status(400).json({ message: 'Search term is required.' });
  }

  let connection;
  try {
    connection = await dbPool.getConnection();
    const query = `
      SELECT
    ProductID,
    Name,
    Description,
    ItemType,
    Material,
    Stock
FROM
    products
WHERE
    Name LIKE ? OR
    Description LIKE ? OR
    ItemType LIKE ? OR
    Material LIKE ?;
    `;
    const searchPattern = `%${searchTerm.trim()}%`; 
    const [results] = await connection.execute(query, [searchPattern, searchPattern, searchPattern, searchPattern]);
    
    console.log(`Search for "${searchTerm}" returned ${results.length} products.`);
    // Always return 200 OK. If no results, it's an empty array.
    // The frontend will handle displaying "No products found".
    res.status(200).json(results); 

  } catch (error) {
    console.error('Error during product search:', error);
    res.status(500).json({ message: 'Failed to search for products.' });
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
    getProducts,
    getProduct,
    getSearchProducts
}