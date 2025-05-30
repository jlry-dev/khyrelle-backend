import React, { useState, useEffect } from "react";
import "./About.css";
import fbIcon from "./Aboutassets/fb.png";
import instaIcon from "./Aboutassets/insta.png";
import linkedinIcon from "./Aboutassets/linkedin.png";

// Social media data (static, so declared outside component)
const SOCIAL_MEDIA = [
  {
    name: "Facebook",
    handle: "@metalworksfb",
    url: "https://www.facebook.com/metalworksfb",
    icon: fbIcon,
    alt: "Metalworks Facebook Page"
  },
  {
    name: "Instagram",
    handle: "@metalworksig",
    url: "https://www.instagram.com/metalworksig",
    icon: instaIcon,
    alt: "Metalworks Instagram Profile"
  },
  {
    name: "LinkedIn",
    handle: "@metalworks",
    url: "https://www.linkedin.com/company/metalworks",
    icon: linkedinIcon,
    alt: "Metalworks LinkedIn Page"
  }
];

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('mission');

  // Tab content to avoid duplicate JSX
  const TAB_CONTENT = {
    mission: (
      <p>
        To connect skilled blacksmiths with customers worldwide by offering a 
        trusted online marketplace for high-quality, handcrafted metal goods. 
        We aim to support traditional craftsmanship while delivering exceptional 
        value and service to our customers.
      </p>
    ),
    vision: (
      <p>
        To become the leading online destination for premium blacksmith products 
        by fostering a community built on authenticity, craftsmanship, and 
        customer satisfaction.
      </p>
    )
  };

  return (
    <div className="about-page">
      <main className="about-main">
        <h2 className="section-title">About Us</h2>
        <p className="description">
          Metalworks Online Market is built on a passion for quality craftsmanship. 
          We bring together skilled makers and customers who appreciate authentic, 
          handcrafted metal goods – all in one trusted, easy-to-use platform.
        </p>
      </main>

      {/* Mission/Vision Tabs */}
      <section className="mission-vision-container">
        {['mission', 'vision'].map((tab) => (
          <div
            key={tab}
            className={`${tab}-box ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setActiveTab(tab)}
            aria-pressed={activeTab === tab}
            aria-label={`View ${tab} statement`}
          >
            <h3 className="section-heading">
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </h3>
            {TAB_CONTENT[tab]}
          </div>
        ))}
      </section>

      {/* Contact & Social */}
      <section className="contact-social-container">
        <div className="contact-box">
          <h3 className="section-heading">Contact Details</h3>
          <ul className="contact-list">
            <li><strong>Business Name:</strong> Metalworks</li>
            <li><strong>Customer Support:</strong> metalsupport@metalworks.com</li>
            <li><strong>Phone Number:</strong> +63-9652-865-1640</li>
            <li><strong>Working Hours:</strong> Monday–Friday: 9AM–5PM (EST)</li>
          </ul>
        </div>

        <div className="social-box">
          <h3 className="section-heading">Social Media</h3>
          <div className="about-socials">
            {SOCIAL_MEDIA.map(({ name, handle, url, icon, alt }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-item"
                aria-label={`Visit our ${name} page`}
              >
                <img 
                  src={icon} 
                  alt={alt} 
                  className="social-icon" 
                  loading="lazy"
                />
                <div className="social-text">
                  <p>{name}</p>
                  <p>{handle}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}