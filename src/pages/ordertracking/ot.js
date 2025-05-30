import './ot.css';
import { useNavigate } from 'react-router-dom';

const TrackOrder = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/orderconfirm');
  };

  const statusIcons = {
    created: '⚒️',
    picked: '📦',
    sorting: '🔍',
    delivery: '🏍️',
    delivered: '✅'
  };

  return (
    <div className="track-order-container">
      <div className="track-order-content">
        <button className="back-button" onClick={handleBack}>
          ⬅ Back to Forge
        </button>

        <h2 className="pixel-title">⚔️ Order Tracking ⚔️</h2>
        
        <div className="status-bar">
          <div className="step completed">{statusIcons.created} Order Created</div>
          <div className="step completed">{statusIcons.picked} Picked Up</div>
          <div className="step active">{statusIcons.sorting} Sorting</div>
          <div className="step">{statusIcons.delivery} Out for Delivery</div>
          <div className="step">{statusIcons.delivered} Delivered</div>
        </div>

        <div className="metal-border">
          <div className="order-section">
            <div className="order-info">
              <h3>🔧 Order Information</h3>
              <p><strong>Order Number:</strong> 2023300851</p>
              <p><strong>Recipient Name:</strong> Arthur Pendragon</p>
              <p><strong>Contact Number:</strong> +6396528651640</p>
              <div className="anvil-icon">⚒️</div>
            </div>

            <div className="delivery-status">
              <h3>📜 Delivery Log</h3>
              <ul>
                <li><span className="time">18 Apr 2025 | 10:10 AM</span> – <strong>[Parañaque DC]</strong> Your order has been picked up from our forge</li>
                <li><span className="time">18 Apr 2025 – 10:10 AM</span> – [Parañaque DC] Package picked up by our dwarven couriers</li>
                <li><span className="time">18 Apr 2025 – 08:45 AM</span> – [Blacksmiths Workshop] Item quenched and packaged</li>
                <li><span className="time">17 Apr 2025 – 03:20 PM</span> – [Blacksmiths Workshop] Steel passed the hammer test</li>
                <li><span className="time">17 Apr 2025 – 09:00 AM</span> – [Blacksmiths Workshop] Production completed</li>
                <li><span className="time">16 Apr 2025 – 01:10 PM</span> – Order confirmed with blood seal</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="forge-effects">
          <div className="sparks"></div>
          <div className="sparks"></div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;