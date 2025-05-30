// src/pages/orderconfirm/oc.js (or your OrderConfirmation.js path)
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './oc.css'; // Make sure this CSS file exists and is styled
import receiptImage from './ocassets/RCPT.png'; // For fallback print

// If item.image in the received orderData.items is just a filename string
// AND you are using the "images in src/assets" strategy, you would need
// to import all images and use an imageMap here, similar to ProductDetail.js.
// However, if CheckoutPage.js passes the *already imported image variable*
// in orderData.items[...].image, then no separate map is needed here.
// For example, if CheckoutPage passes: { ..., image: steelSwordImgFromImport, ... }

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { state } = useLocation(); // This contains the data passed from CheckoutPage

  // Define a more minimal default structure
  const defaultOrderData = {
    orderId: 'N/A',
    items: [],
    finalTotal: 0,
    // Add other fields with simple defaults if necessary for initial render
    orderDate: new Date().toLocaleDateString(),
    paymentMethod: 'N/A',
    merchandiseSubtotal: 0,
    shippingFee: 0,
    appliedDiscountAmount: 0,
    customerDetails: { shippingAddress: "Not available" }
  };

  // Use the passed state or the default.
  const orderData = state?.orderData || defaultOrderData;

  // Log the effective orderData being used for rendering
  console.log("%cOrderConfirmation: Effective orderData for render:", "color: green; font-weight: bold;", JSON.stringify(orderData, null, 2));
  if (orderData && orderData.items && Array.isArray(orderData.items)) {
    console.log("%cOrderConfirmation: Effective orderData.items for render:", "color: green;", JSON.stringify(orderData.items, null, 2));
  } else {
    console.warn("%cOrderConfirmation: Effective orderData has no 'items' array or is using default.", "color: orange;");
  }

  const [isCanceled, setIsCanceled] = useState(false);

  useEffect(() => {
    console.log("%cOrderConfirmation Page Mounted or State Changed", "color: blue; font-weight: bold;");
    console.log("Full location.state received:", JSON.stringify(state, null, 2));

    if (state && state.orderData) {
      console.log("Received orderData object in state:", JSON.stringify(state.orderData, null, 2));
      if (state.orderData.items && Array.isArray(state.orderData.items) && state.orderData.items.length > 0) {
        console.log("Received items array in state.orderData.items:", JSON.stringify(state.orderData.items, null, 2));
      } else {
        console.warn("Received orderData in state, but 'items' array is empty, missing, or not an array.", state.orderData.items);
      }
    } else {
      console.warn("No orderData found in location.state. Component will use default/empty order info.");
    }
  }, [state]); // Dependency array ensures this runs when `state` (from useLocation) changes

  const handlePrintOrder = () => {
    const printableArea = document.getElementById('order-receipt-printable-area');
    if (printableArea) {
        const printWindow = window.open('', '_blank', 'height=700,width=900');
        printWindow.document.write('<html><head><title>Metalworks Order Receipt</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
          body { font-family: sans-serif; margin: 20px; }
          .order-details-print h2, .order-details-print h3 { margin-bottom: 10px; color: #333; }
          .shipping-info-print, .items-list-print, .order-total-print { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
          .item-print { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px dotted #ccc; }
          .item-print:last-child { border-bottom: none; }
          .item-image-oc-print-container { flex-shrink: 0; width: 60px; height: 60px; margin-right: 10px; }
          .item-image-oc-print { max-width: 100%; max-height: 100%; object-fit: contain; }
          .item-info-oc-print { flex-grow: 1; }
          .item-name-oc-print { font-weight: bold; display: block; margin-bottom: 3px; }
          .item-qty-oc-print, .item-price-oc-print span { font-size: 0.9em; color: #555; }
          .item-price-oc-print { text-align: right; min-width: 120px; }
          .total-line-print { display: flex; justify-content: space-between; padding: 5px 0; }
          .final-total-print span { font-weight: bold; font-size: 1.1em; }
          .rush-tag-oc-print { font-size: 0.8em; color: orange; margin-left: 5px; }
          .print-header { text-align: center; margin-bottom: 20px; }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write('<div class="order-details-print">');
        printWindow.document.write(`<div class="print-header"><h1>Order Receipt - Metalworks</h1></div>`);
        printWindow.document.write(`<h3>Order No. ${orderData.orderId}</h3>`);
        printWindow.document.write(`<p>Date: ${new Date(orderData.orderDate || Date.now()).toLocaleDateString()}</p>`);
        printWindow.document.write(`<p>Payment Method: ${orderData.paymentMethod}</p>`);
        printWindow.document.write(printableArea.innerHTML);
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { 
            printWindow.print();
            printWindow.close();
        }, 750); // Increased timeout to allow styles and images to potentially load
    } else {
        console.warn("Printable area 'order-receipt-printable-area' not found. Using fallback image download.");
        const link = document.createElement('a');
        link.href = receiptImage; 
        link.download = `Metalworks_Order_${orderData.orderId}_Receipt.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleCancelOrder = () => {
    console.log("Attempting to cancel order:", orderData.orderId);
    setIsCanceled(true);
    alert(`Order ${orderData.orderId} cancellation requested (Demo Feature).`);
  };

  const handleTrackOrder = () => {
    navigate('/ordertrack', { 
      state: { orderId: orderData.orderId }
    });
  };

  // Display this if orderData is essentially the default because no valid state was passed.
  if (orderData === defaultOrderData && (!state || !state.orderData)) {
      return (
          <div className="order-confirmation-container">
              <div className="confirmation-content">
                  <h1 className="confirmation-title">Order Information Not Found</h1>
                  <p>We could not retrieve your order details. This might happen if you refreshed this page or navigated here directly.</p>
                  <p>Please check your email for confirmation or <Link to="/products">continue shopping</Link>.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="order-confirmation-container">
      <div className="confirmation-content">
        <h1 className="confirmation-title">Your order has been forged!</h1>
        
        <div className="order-summary-box">
          <h2>Order Summary</h2>
          <div className="order-number">
            <h3>Order No. {orderData.orderId}</h3>
            <p>Date: {new Date(orderData.orderDate || Date.now()).toLocaleDateString()}</p>
            <p>Payment Method: {orderData.paymentMethod}</p>
            <p>We've sent a confirmation email with your order details (simulated).</p>
          </div>
        </div>
        
        <div id="order-receipt-printable-area"> 
            <div className="order-details"> 
            <h2>Order Details</h2>
            
            <div className="shipping-info">
                <h3>Shipping To:</h3>
                <p>{orderData.customerDetails?.shippingAddress || "Customer Address Not Provided"}</p>
            </div>
            
            <div className="items-list">
                <h3>Items:</h3>
                {orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0 ? (
                    orderData.items.map((item, index) => (
                    <div className="item" key={`${item.id}-${index}-${item.rushOrder || ''}`}> 
                        <div className="item-image-container">
                            <img 
                                src={item.image || '/placeholder.png'} 
                                alt={item.name || 'Product Image'} 
                                className="item-image-oc" 
                            />
                        </div>
                        <div className="item-info-oc">
                            <span className="item-name-oc">{item.name || 'N/A'}</span>
                            {item.rushOrder && <span className="rush-tag-oc">(Rush Order)</span>}
                            <span className="item-qty-oc">Qty: {item.quantity || 0}</span>
                        </div>
                        <div className="item-price-oc">
                            <span>Unit: ₱ {(Number(item.price) || 0).toFixed(2)}</span>
                            <span>Total: ₱ {(Number(item.totalItemPrice) || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    ))
                ) : (
                    <p>No items found in this order.</p>
                )}
            </div>
            
            <div className="order-total">
                <h3>Order Total:</h3>
                <div className="total-line">
                <span>Merchandise Subtotal</span>
                <span>₱ {(Number(orderData.merchandiseSubtotal) || 0).toFixed(2)}</span>
                </div>
                <div className="total-line">
                <span>Shipping Fee</span>
                <span>₱ {(Number(orderData.shippingFee) || 0).toFixed(2)}</span>
                </div>
                {orderData.appliedDiscountAmount > 0 && (
                    <div className="total-line discount-line">
                    <span>Promo Code Discount</span>
                    <span>- ₱ {(Number(orderData.appliedDiscountAmount) || 0).toFixed(2)}</span>
                    </div>
                )}
                <div className="total-line final-total">
                <span>Total Payment:</span>
                <span>₱ {(Number(orderData.finalTotal) || 0).toFixed(2)}</span>
                </div>
            </div>
            </div>
        </div> 
        
        <div className="order-actions">
          <button className="action-btn print-btn" onClick={handlePrintOrder}>
            Print Order Details
          </button>
          <button className="action-btn track-btn" onClick={handleTrackOrder}>
            Track My Order
          </button>
          {!isCanceled && (
            <button className="action-btn cancel-btn" onClick={handleCancelOrder}>
              Cancel Order (Demo)
            </button>
          )}
        </div>
         <Link to="/products" className="continue-shopping-link-oc">Continue Shopping</Link>
      </div>
      
      {isCanceled && (
        <div className="cancel-notification">
          Order ({orderData.orderId}) Cancellation Request Submitted (Demo).
        </div>
      )}
    </div>
  );
};

export default OrderConfirmation;
