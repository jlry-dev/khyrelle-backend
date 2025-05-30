import React, { useState } from 'react';
import './TermsAndConditions.css';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="terms-container">
      <div className="terms-header">
        <h1>Terms and Conditions</h1>
      </div>

      <div className="terms-content">
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={() => setAgreed(!agreed)}
          />
          <label htmlFor="agree" className="checkbox-label">
            I certify that I have read and accept the <Link to="/terms-of-use" className="link">[Terms of Use]</Link> and
           <Link to="/PrivacyPolicy" className="link">[Privacy Policy]</Link>, and I understand the item care instructions,
            safety warnings, and return policy related to my purchase.
          </label>
        </div>

        <h2>Return & Crafting Policy</h2>
        <ul>
          <li>Custom forged items are non-refundable once the forging process begins.</li>
          <li>Due to the handmade nature of our products, slight variations in size, finish, and texture may occur.</li>
          <li>If your order is not confirmed or picked up within 7 days, it may be canceled.</li>
          <li>Misuse or failure to follow care instructions may void any return eligibility.</li>
        </ul>
      </div>
    </div>
  );
};

export default TermsAndConditions;