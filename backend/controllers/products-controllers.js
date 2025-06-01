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
  const page = 1; 
  const limit = 100; 
  const offset = (page - 1) * limit;

  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
    return res.status(400).json({ message: 'Search term is required.' });
  }
  let connection;
  try {
    connection = await dbPool.getConnection();
    const searchPattern = `%${searchTerm.trim()}%`;

    const countQuery = `
      SELECT COUNT(*) as total FROM products 
      WHERE Name LIKE ? OR Description LIKE ? OR ItemType LIKE ? OR Material LIKE ?
    `;
    const [countResult] = await connection.execute(countQuery, [searchPattern, searchPattern, searchPattern, searchPattern]);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    const resultsQuery = `
      SELECT * FROM products 
      WHERE Name LIKE ? OR Description LIKE ? OR ItemType LIKE ? OR Material LIKE ?
      ORDER BY Name ASC
      LIMIT ? OFFSET ? 
    `;
    const [results] = await connection.execute(resultsQuery, [searchPattern, searchPattern, searchPattern, searchPattern, limit, offset]);

    console.log(`Search for "${searchTerm}" returned ${results.length} products (total matching: ${total}).`);

    res.status(200).json({
      results: results,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: totalPages
      }
    });
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