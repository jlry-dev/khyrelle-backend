require('dotenv').config();

const dbPool = require("../config/db-config")

const postOrder = async (req, res) => {
  if (!req.user || !req.user.CustomerID) {
    return res.status(401).json({ message: "User authentication failed for order placement." });
  }
  const customerId = req.user.CustomerID;
  const { items: itemsInPayload, paymentMethod, finalTotal, isRushOrder, messageForSeller, deliveryAddress } = req.body;

  if (!itemsInPayload || itemsInPayload.length === 0) return res.status(400).json({ message: 'Order must contain at least one item.' });
  if (!paymentMethod || finalTotal === undefined) return res.status(400).json({ message: 'Payment method and total amount are required.' });
  if (!deliveryAddress || !deliveryAddress.line1 || !deliveryAddress.city || !deliveryAddress.postalCode || !deliveryAddress.country || !deliveryAddress.recipientName || !deliveryAddress.contactPhone) {
    return res.status(400).json({ message: 'Complete delivery address including recipient name and phone is required.' });
  }

  let connection;
  try {
    connection = await dbPool.getConnection();
    await connection.beginTransaction();
    const orderDate = new Date().toISOString().slice(0, 10);
    const rushOrderText = isRushOrder ? '1' : '0';
    const approvalStatus = 'Pending';

    const [orderResult] = await connection.execute(
      'INSERT INTO `order` (`CustomerID`, `OrderDate`, `RushOrder`, `ApprovalStatus`, `TotalCost`, `OrderNotes`, `ShippingRecipientName`, `ShippingAddressLine1`, `ShippingAddressLine2`, `ShippingCity`, `ShippingPostalCode`, `ShippingCountry`, `ShippingContactPhone`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [customerId, orderDate, rushOrderText, approvalStatus, finalTotal, messageForSeller || null,
        deliveryAddress.recipientName, deliveryAddress.line1, deliveryAddress.line2 || null,
        deliveryAddress.city, deliveryAddress.postalCode, deliveryAddress.country, deliveryAddress.contactPhone
      ]
    );
    const newOrderId = orderResult.insertId;

    for (const cartItem of itemsInPayload) {
      const itemTotalCost = (Number(cartItem.unitPrice) || 0) * (cartItem.quantity || 1);
      const placeholderPricingTierID = 0;
      await connection.execute(
        'INSERT INTO `item` (`OrderID`, `PricingTierID`, `UnitPrice`, `TotalCost`, `Quantity`, `ProductID`) VALUES (?, ?, ?, ?, ?, ?)',
        [newOrderId, placeholderPricingTierID, cartItem.unitPrice, itemTotalCost, cartItem.quantity, cartItem.productId]
      );

      // --- BEGIN STOCK UPDATE ---
      const productIdToUpdate = parseInt(cartItem.productId);
      const quantityOrdered = parseInt(cartItem.quantity);

      if (isNaN(productIdToUpdate) || isNaN(quantityOrdered) || quantityOrdered <= 0) {
        throw new Error(`Invalid product ID or quantity for stock update: ProductID ${cartItem.productId}, Quantity ${cartItem.quantity}`);
      }

      // Update stock, ensuring it doesn't go negative by checking current stock
      const [stockUpdateResult] = await connection.execute(
        'UPDATE `products` SET `Stock` = `Stock` - ? WHERE `ProductID` = ? AND `Stock` >= ?',
        [quantityOrdered, productIdToUpdate, quantityOrdered]
      );

      if (stockUpdateResult.affectedRows === 0) {
        // Check if the product exists to differentiate between "not found" and "insufficient stock"
        const [productCheck] = await connection.execute('SELECT Stock FROM `products` WHERE `ProductID` = ?', [productIdToUpdate]);
        if (productCheck.length > 0 && productCheck[0].Stock < quantityOrdered) {
             throw new Error(`Insufficient stock for ProductID ${productIdToUpdate}. Available: ${productCheck[0].Stock}, Requested: ${quantityOrdered}`);
        }
        // If product doesn't exist or other reason for update failure (e.g., stock became insufficient between check and update, though less likely with `Stock >= ?`)
        throw new Error(`Failed to update stock for ProductID ${productIdToUpdate}. Product may not exist or stock may have been insufficient.`);
      }
      console.log(`Stock updated for ProductID ${productIdToUpdate}, quantity reduced by ${quantityOrdered}`);
      // --- END STOCK UPDATE ---
    }

    const paymentAddressPlaceholder = "Order Payment - Address N/A";
    const placeholderOriginalPaymentID = newOrderId; // Or 0 if that's the intent for a placeholder
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
     // Send a more specific error message to the client if it's a stock issue or known validation failure
    if (error.message.includes('Insufficient stock') || error.message.includes('Failed to update stock')) {
        return res.status(409).json({ message: error.message }); // 409 Conflict for stock issues
    }
    if (error.message.includes('Invalid product ID or quantity')) {
        return res.status(400).json({message: error.message });
    }
    res.status(500).json({ message: 'Failed to place order. Please check server logs for specific database errors.' });
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