import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-container">
      <div className="privacy-header">
        <h1>Privacy Policy</h1>
      </div>
      <div className="privacy-content">
        <p>
          We are committed to protecting your privacy. Any information collected
          from you will only be used in accordance with this policy.
        </p>

        <h2>Information Collection</h2>
        <p>
          We may collect personal information such as your name, email, and contact
          details to process orders or provide support.
        </p>

        <h2>Use of Information</h2>
        <ul>
          <li>To process your orders</li>
          <li>To personalize your experience</li>
          <li>To improve our website and services</li>
        </ul>

        <h2>Security</h2>
        <p>
          We are committed to ensuring that your information is secure. We implement
          suitable physical, electronic, and managerial procedures to safeguard your data.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          We do not sell, trade, or rent your personal information to others. Some
          trusted third parties may assist in operating our site, so long as those
          parties agree to keep this information confidential.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
