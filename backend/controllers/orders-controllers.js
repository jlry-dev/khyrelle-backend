require('dotenv').config();

const dbPool = require("../config/db-config")

const postOrder = async (req, res) => { 
  // After authenticateUser, req.user should be set if temp-user-id was valid.
  // If not, authenticateUser would have sent a 401 for this path.
  if (!req.user || !req.user.CustomerID) {
    return res.status(401).json({ message: "User authentication failed for order placement." });
  }
  const customerId = req.user.CustomerID; 
  
  const { items: itemsInPayload, paymentMethod, finalTotal, isRushOrder } = req.body;

  if (!itemsInPayload || itemsInPayload.length === 0) return res.status(400).json({ message: 'Order must contain at least one item.' });
  if (!paymentMethod || finalTotal === undefined) return res.status(400).json({ message: 'Payment method and total amount are required.' });

  let connection;
  try {
    connection = await dbPool.getConnection();
    await connection.beginTransaction();
    const orderDate = new Date().toISOString().slice(0, 10); 
    const rushOrderText = isRushOrder ? '1' : '0';
    const approvalStatus = 'Pending'; 
    const [orderResult] = await connection.execute(
      'INSERT INTO `order` (`CustomerID`, `OrderDate`, `RushOrder`, `ApprovalStatus`, `TotalCost`) VALUES (?, ?, ?, ?, ?)',
      [customerId, orderDate, rushOrderText, approvalStatus, finalTotal]
    );
    const newOrderId = orderResult.insertId;
    for (const cartItem of itemsInPayload) {
      const itemTotalCost = (Number(cartItem.unitPrice) || 0) * (cartItem.quantity || 1);
      const placeholderPricingTierID = 0; 
      await connection.execute(
        'INSERT INTO `item` (`OrderID`, `PricingTierID`, `UnitPrice`, `TotalCost`, `Quantity`, `ProductID`) VALUES (?, ?, ?, ?, ?, ?)',
        [newOrderId, placeholderPricingTierID, cartItem.unitPrice, itemTotalCost, cartItem.quantity, cartItem.productId]
      );
    }
    const paymentAddressPlaceholder = "Order Payment - Address N/A"; 
    const placeholderOriginalPaymentID = newOrderId; // Using newOrderId for PaymentID in paymentmethod table
    await connection.execute(
      'INSERT INTO `paymentmethod` (`CustomerID`, `OrderID`, `PaymentID`, `Details`, `Address`) VALUES (?, ?, ?, ?, ?)',
      [customerId, newOrderId, placeholderOriginalPaymentID, paymentMethod, paymentAddressPlaceholder] 
    );
    await connection.commit();
    res.status(201).json({ 
      message: 'Order placed successfully!', 
      orderDetails: { 
        orderId: newOrderId, customerId, orderDate, totalAmount: finalTotal,
        paymentMethod, itemCount: itemsInPayload.length 
      } 
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error placing order:', error); 
    res.status(500).json({ message: 'Failed to place order. Please check server logs.' });
  } finally {
    if (connection) connection.release();
  }
}

const getOrders = async (req, res) => { 
    if (!req.user || !req.user.CustomerID) return res.status(401).json({ message: "User not properly authenticated." });
    const customerId = req.user.CustomerID;
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [orders] = await connection.execute(
            'SELECT OrderID, OrderDate, TotalCost, ApprovalStatus as Status FROM `order` WHERE `CustomerID` = ? ORDER BY OrderDate DESC',
            [customerId]
        );
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [items] = await connection.execute(
                `SELECT i.Quantity, i.UnitPrice, p.Name as ProductName, p.ImagePath, p.ProductID 
                 FROM item i JOIN products p ON i.ProductID = p.ProductID WHERE i.OrderID = ?`,
                [order.OrderID]
            );
            return { 
                id: order.OrderID, date: order.OrderDate, total: order.TotalCost, status: order.Status,
                items: items.map(it => ({
                    id: it.ProductID, name: it.ProductName, price: it.UnitPrice, quantity: it.Quantity,
                    imagePath: it.ImagePath 
                }))
            };
        }));
        res.status(200).json(ordersWithItems);
    } catch (error) {
        console.error(`Error fetching order history for CustomerID ${customerId}:`, error);
        res.status(500).json({ message: 'Failed to retrieve order history.' });
    } finally { if (connection) connection.release(); }
}

module.exports = {
    postOrder,
    getOrders
}