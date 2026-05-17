import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Products.css'

interface Product {
  id: number
  name: string
  category: string
  subCategory: string
  description: string
  price: string
  unit: string
  origin: string
  badge?: string
  emoji: string
}

const products: Product[] = [
  // Beverages
  {
    id: 1,
    name: 'Sunrise Orange Juice',
    category: 'Beverages',
    subCategory: 'Juices',
    description: '100% cold-pressed orange juice with no added sugar or preservatives. Sourced from Valencia oranges.',
    price: '$3.49',
    unit: '1 L',
    origin: 'Spain',
    badge: 'Best Seller',
    emoji: '🍊',
  },
  {
    id: 2,
    name: 'Alpine Mineral Water',
    category: 'Beverages',
    subCategory: 'Water',
    description: 'Naturally filtered mineral water from the Swiss Alps. Rich in calcium and magnesium.',
    price: '$1.29',
    unit: '500 ml',
    origin: 'Switzerland',
    emoji: '💧',
  },
  {
    id: 3,
    name: 'Green Leaf Herbal Tea',
    category: 'Beverages',
    subCategory: 'Tea & Coffee',
    description: 'Premium blend of chamomile, peppermint and lemongrass. Caffeine-free and organic certified.',
    price: '$5.99',
    unit: '20 bags',
    origin: 'India',
    badge: 'Organic',
    emoji: '🍵',
  },
  // Snacks
  {
    id: 4,
    name: 'Harvest Grain Crackers',
    category: 'Snacks',
    subCategory: 'Crackers & Biscuits',
    description: 'Whole grain crackers baked with sunflower seeds and sea salt. High in fibre, low in saturated fat.',
    price: '$2.79',
    unit: '200 g',
    origin: 'Netherlands',
    emoji: '🌾',
  },
  {
    id: 5,
    name: 'Dark Cocoa Almonds',
    category: 'Snacks',
    subCategory: 'Nuts & Seeds',
    description: 'Roasted California almonds coated in 70% dark cocoa. A rich, guilt-free indulgence.',
    price: '$4.49',
    unit: '150 g',
    origin: 'USA',
    badge: 'New',
    emoji: '🍫',
  },
  {
    id: 6,
    name: 'Sea Salt Popcorn',
    category: 'Snacks',
    subCategory: 'Popcorn',
    description: 'Air-popped popcorn lightly seasoned with Himalayan pink salt. Gluten-free and vegan.',
    price: '$2.19',
    unit: '100 g',
    origin: 'USA',
    emoji: '🍿',
  },
  // Dairy
  {
    id: 7,
    name: 'Full Cream Milk',
    category: 'Dairy',
    subCategory: 'Milk',
    description: 'Farm-fresh full cream milk from grass-fed cows. Pasteurised and homogenised for freshness.',
    price: '$2.49',
    unit: '2 L',
    origin: 'Australia',
    badge: 'Farm Fresh',
    emoji: '🥛',
  },
  {
    id: 8,
    name: 'Greek Style Yoghurt',
    category: 'Dairy',
    subCategory: 'Yoghurt',
    description: 'Thick, creamy Greek yoghurt with live cultures. High in protein, no artificial flavours.',
    price: '$3.99',
    unit: '500 g',
    origin: 'Greece',
    emoji: '🫙',
  },
  {
    id: 9,
    name: 'Aged Cheddar Cheese',
    category: 'Dairy',
    subCategory: 'Cheese',
    description: '18-month aged cheddar with a sharp, nutty flavour. Made from unpasteurised cow\'s milk.',
    price: '$6.99',
    unit: '250 g',
    origin: 'UK',
    emoji: '🧀',
  },
  // Personal Care
  {
    id: 10,
    name: 'Aloe Vera Shampoo',
    category: 'Personal Care',
    subCategory: 'Hair Care',
    description: 'Sulphate-free shampoo enriched with aloe vera and argan oil. Suitable for all hair types.',
    price: '$7.49',
    unit: '300 ml',
    origin: 'France',
    badge: 'Sulphate-Free',
    emoji: '🧴',
  },
  {
    id: 11,
    name: 'Charcoal Face Wash',
    category: 'Personal Care',
    subCategory: 'Skin Care',
    description: 'Deep-cleansing face wash with activated charcoal and tea tree oil. Removes impurities and excess oil.',
    price: '$8.99',
    unit: '150 ml',
    origin: 'South Korea',
    badge: 'New',
    emoji: '🫧',
  },
  // Household
  {
    id: 12,
    name: 'Citrus Multi-Surface Spray',
    category: 'Household',
    subCategory: 'Cleaning',
    description: 'Plant-based multi-surface cleaner with a fresh citrus scent. Biodegradable formula, safe around children.',
    price: '$3.99',
    unit: '750 ml',
    origin: 'Germany',
    badge: 'Eco',
    emoji: '🧹',
  },
]

const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))]

const badgeColor: Record<string, string> = {
  'Best Seller': 'badge-green',
  Organic: 'badge-green',
  New: 'badge-purple',
  'Farm Fresh': 'badge-blue',
  'Sulphate-Free': 'badge-blue',
  Eco: 'badge-green',
}

export default function Products() {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered =
    activeCategory === 'All' ? products : products.filter((p) => p.category === activeCategory)

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <Link to="/" className="back-link" aria-label="Back to home">
          ← Back
        </Link>
        <h1>Product Portfolio</h1>
        <p className="page-subtitle">Our FMCG product range — {products.length} products across {categories.length - 1} categories</p>
      </header>

      <div className="ticks"></div>

      {/* Category filter */}
      <nav className="category-filter" aria-label="Filter by category">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-btn${activeCategory === cat ? ' filter-btn-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            aria-pressed={activeCategory === cat}
          >
            {cat}
          </button>
        ))}
      </nav>

      <div className="ticks"></div>

      {/* Products grid */}
      <section className="products-grid" aria-label="Product list">
        {filtered.map((p) => (
          <article key={p.id} className="product-card">
            <div className="product-emoji" aria-hidden="true">{p.emoji}</div>
            <div className="product-card-top">
              <span className="product-category">{p.subCategory}</span>
              {p.badge && (
                <span className={`product-badge ${badgeColor[p.badge] ?? 'badge-blue'}`}>
                  {p.badge}
                </span>
              )}
            </div>
            <h2>{p.name}</h2>
            <p className="product-desc">{p.description}</p>
            <div className="product-meta">
              <span className="product-origin">🌍 {p.origin}</span>
              <span className="product-price">
                {p.price} <span className="product-unit">/ {p.unit}</span>
              </span>
            </div>
          </article>
        ))}
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </div>
  )
}
