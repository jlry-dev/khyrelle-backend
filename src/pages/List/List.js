import React, { useState, useEffect, useMemo } from "react";
import "./List.css";
import blacksmith1 from "./Listassets/blacksmith_1.png";
import blacksmith2 from "./Listassets/blacksmith_2.png";
import blacksmith3 from "./Listassets/blacksmith_3.png";
import blacksmith4 from "./Listassets/blacksmith_4.png";
import blacksmith5 from "./Listassets/blacksmith_5.png";

// Memoized rating calculation
const useRating = (rating) => {
  return useMemo(() => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return [
      ...Array(fullStars).fill('filled'),
      ...(hasHalfStar ? ['half'] : []),
      ...Array(emptyStars).fill('empty')
    ];
  }, [rating]);
};

const BlacksmithCard = ({ 
  name, 
  title, 
  image, 
  description, 
  rating,
  isActive,
  onClick
}) => {
  const stars = useRating(rating);
  const [expanded, setExpanded] = useState(false);

  const handleToggle = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div 
      className={`card horizontal ${isActive ? 'active' : ''}`}
      onClick={onClick}
      aria-expanded={isActive}
      role="button"
      tabIndex={0}
    >
      <div className="image-wrapper">
        <img src={image} alt={`Portrait of ${name}`} className="profile-image" />
        <div className="rating">
          {stars.map((type, i) => (
            <span key={i} className={`star ${type}`} aria-hidden="true"></span>
          ))}
          <span className="rating-value">{rating.toFixed(1)}</span>
        </div>
      </div>
      <div className="info">
        <h3>{name}</h3>
        <p className="title">"{title}"</p>
        <p className={`description ${expanded ? 'expanded' : ''}`}>
          {description}
        </p>
        <button 
          onClick={handleToggle}
          className="toggle-expand"
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} description for ${name}`}
        >
          {expanded ? 'Show Less' : 'Read More'}
        </button>
      </div>
    </div>
  );
};

const BlacksmithsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBlacksmiths, setFilteredBlacksmiths] = useState(blacksmiths);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    const results = blacksmiths.filter(smith =>
      smith.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      smith.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      smith.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBlacksmiths(results);
    setActiveCard(null);
  }, [searchTerm]);

  const handleCardClick = (index) => {
    setActiveCard(activeCard === index ? null : index);
  };

  return (
    <div className="container">
      <h1>Blacksmiths List</h1>
      
      <div className="list-search-container">
        <input
          type="search"
          placeholder="Search blacksmiths..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="list-search-bar"
          aria-label="Search blacksmiths"
        />
      </div>
      
      <div className="grid fixed-grid">
        {filteredBlacksmiths.length > 0 ? (
          filteredBlacksmiths.map((smith, index) => (
            <BlacksmithCard
              key={`${smith.name}-${index}`}
              {...smith}
              isActive={activeCard === index}
              onClick={() => handleCardClick(index)}
            />
          ))
        ) : (
          <div className="no-results">
            No blacksmiths found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

const blacksmiths = [
  {
    name: "Kristine",
    title: "Master Blacksmith",
    image: blacksmith1,
    description:
      "Kristine is a Master Blacksmith renowned for her exceptional sword-making skills. With years of experience, she blends traditional techniques with innovative designs to create blades of unparalleled quality. Her dedication ensures each sword is both a functional weapon and a work of art.",
    rating: 4.4,
  },
  {
    name: "Deborah",
    title: "Apprentice",
    image: blacksmith2,
    description:
      "Deborah is a rising talent in the forge, specializing in durable and detailed armor. As an Apprentice Blacksmith, she focuses on perfecting protection with every piece she crafts. Her passion and precision make her work reliable for both training and battle.",
    rating: 4.4,
  },
  {
    name: "Jereve",
    title: "Expert Blacksmith",
    image: blacksmith3,
    description:
      "Jereve is an Expert Blacksmith renowned for forging strong, dependable shields. Her craftsmanship combines resilience and refined design, perfect for adventurers who never back down. With every piece she creates, protection and precision come hand in hand.",
    rating: 4.4,
  },
  {
    name: "Raizhi",
    title: "Journeyman",
    image: blacksmith4,
    description:
      "Raizhi is a skilled Journeyman Blacksmith with a focus on crafting high-quality helmets. Her designs offer both protection and comfort, perfect for long battles or everyday defense. Each helmet is forged with care, reflecting her dedication to both form and function.",
    rating: 4.4,
  },
  {
    name: "Pia",
    title: "Senior Blacksmith",
    image: blacksmith5,
    description:
      "Pia is a Senior Blacksmith with a sharp edge in crafting finely tuned daggers. Her blades are swift, precise, and trusted by rogues and warriors alike. Every dagger she forges reflects years of mastery and an eye for deadly detail.",
    rating: 4.4,
  },
];

export default BlacksmithsList;