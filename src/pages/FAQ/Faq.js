import './Faq.css';

const FAQ = () => {
  const categories = [
    {
      title: "Products",
      description: "Everything about our hand-forged creations, from axes and knives to decor and custom pieces.",
      count: null,
      link: "/categories/products"
    },
    {
      title: "Troubleshooting",
      description: "Having issues with your order, delivery, or item care? We've got face and advice right here.",
      count: "3 Articles",
      link: "/categories/troubleshooting"
    },
    {
      title: "Pricing & Plans",
      description: "Details about pricing, shipping costs, bulk orders, and custom project estimates.",
      count: "9 Articles",
      link: "/categories/pricing"
    },
    {
      title: "Use Cases",
      description: "From kitchen to campsite – what our forged products are made for, and how to use them right.",
      count: "9 Articles",
      link: "/categories/use-cases"
    }
  ];

  const suggestedArticles = [
    {
      title: "How to Maintain a Forged Knife",
      description: "Simple steps to keep your blade sharp, clean, and rust-free.",
      link: "/articles/maintain-forged-knife"
    },
    {
      title: "Seasoning Your Cast Iron Cookware",
      description: "Learn the proper way to season and care for your cast iron.",
      link: "/articles/season-cast-iron"
    }
  ];

  const handleCategoryClick = (link) => {
    console.log(`Navigating to: ${link}`);
    
  };

  const handleArticleClick = (link) => {
    console.log(`Opening article: ${link}`);
  
  };

  return (
    <div className="faq-container">
      <header className="faq-header">
        <h1>Metalworks | Help Center</h1>
        <p className="subtitle">Hi, how can we help? 🌟️</p>
      </header>

      <section className="categories-section">
        <h2>All Categories</h2>
        <div className="categories-grid">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className="category-card"
              onClick={() => handleCategoryClick(category.link)}
              role="button"
              tabIndex={0}
              aria-label={`View ${category.title} category`}
            >
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              {category.count && <span className="article-count">{category.count}</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="suggested-section">
        <h2>Suggested Articles</h2>
        <div className="articles-grid">
          {suggestedArticles.map((article, index) => (
            <div 
              key={index} 
              className="article-card"
              onClick={() => handleArticleClick(article.link)}
              role="button"
              tabIndex={0}
              aria-label={`Read article: ${article.title}`}
            >
              <h3>{article.title}</h3>
              <p>{article.description}</p>
              <span className="read-more">Read more →</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FAQ;