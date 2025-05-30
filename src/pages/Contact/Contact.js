import React, { useState, useEffect } from 'react';
import './Contact.css';
import locationIcon from './Contactassets/location.svg';
import callIcon from './Contactassets/call.svg';

const Contact = () => {
  // State management
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [animated, setAnimated] = useState(false);

  // Animation trigger on mount
  useEffect(() => {
    setAnimated(true);
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!formData.message.trim()) errors.message = 'Message is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Simulate API call
      setTimeout(() => {
        console.log('Form submitted:', formData);
        setIsSubmitting(false);
        setSubmitSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
        
        // Reset success message after 3 seconds
        setTimeout(() => setSubmitSuccess(false), 3000);
      }, 1000);
    }
  };

  return (
    <div className={`contact-container ${animated ? 'animated' : ''}`}>
      <div className="contact-header">
        <h2>Contact Us</h2>
        <p>We welcome and value your feedback about our product and services.</p>
      </div>
      
      {submitSuccess && (
        <div className="success-message">
          Thank you! Your message has been sent successfully.
        </div>
      )}
      
      <div className="contact-content">
        <div className="contact-form">
          <form onSubmit={handleSubmit}>
            <div className="co-form-group">
              <label htmlFor="name">Your Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className={formErrors.name ? 'error' : ''}
              />
              {formErrors.name && <span className="error-message">{formErrors.name}</span>}
            </div>
            
            <div className="co-form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                className={formErrors.email ? 'error' : ''}
              />
              {formErrors.email && <span className="error-message">{formErrors.email}</span>}
            </div>
            
            <div className="co-form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="co-form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="co-form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="Your message here"
                value={formData.message}
                onChange={handleInputChange}
                className={formErrors.message ? 'error' : ''}
              />
              {formErrors.message && <span className="error-message">{formErrors.message}</span>}
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={isSubmitting ? 'submitting' : ''}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>
        
        <div className="contact-info">
          <h3>Head Office</h3>
          <div className="info-item" title="Our location">
            <img src={locationIcon} alt="Location" className="icon" />
            <p>Lapasan, Cagayan De Oro City,<br />Philippines (Postal 9000)</p>
          </div>
          <div className="info-item" title="Call us">
            <img src={callIcon} alt="Phone" className="icon" />
            <p>+6396528651640</p>
          </div>
          
          {/* Additional interactive element */}
          <div className="business-hours">
            <h4>Business Hours</h4>
            <p>Monday-Friday: 9AM-5PM</p>
            <p>Saturday-Sunday: Closed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;