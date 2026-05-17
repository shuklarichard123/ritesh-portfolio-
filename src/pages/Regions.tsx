import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Regions.css'

type RegionKey = 'americas' | 'europe' | 'asia'

interface Country {
  name: string
  flag: string
  cities: string[]
  status: 'active' | 'expanding' | 'planned'
  channels: string[]
  marketShare: string
}

interface RegionData {
  key: RegionKey
  label: string
  emoji: string
  tagline: string
  countries: Country[]
  highlights: { label: string; value: string }[]
}

const regions: RegionData[] = [
  {
    key: 'americas',
    label: 'Americas',
    emoji: '🌎',
    tagline: 'North & South America operations',
    highlights: [
      { label: 'Countries', value: '4' },
      { label: 'Distribution Centres', value: '12' },
      { label: 'Retail Partners', value: '3,200+' },
      { label: 'Annual Revenue', value: '$48M' },
    ],
    countries: [
      {
        name: 'United States',
        flag: '🇺🇸',
        cities: ['New York', 'Los Angeles', 'Chicago', 'Houston'],
        status: 'active',
        channels: ['Supermarkets', 'E-commerce', 'Wholesale', 'Convenience'],
        marketShare: '18%',
      },
      {
        name: 'Canada',
        flag: '🇨🇦',
        cities: ['Toronto', 'Vancouver', 'Montreal'],
        status: 'active',
        channels: ['Supermarkets', 'E-commerce', 'Wholesale'],
        marketShare: '12%',
      },
      {
        name: 'Brazil',
        flag: '🇧🇷',
        cities: ['São Paulo', 'Rio de Janeiro'],
        status: 'expanding',
        channels: ['Supermarkets', 'Wholesale'],
        marketShare: '6%',
      },
      {
        name: 'Mexico',
        flag: '🇲🇽',
        cities: ['Mexico City', 'Guadalajara'],
        status: 'expanding',
        channels: ['Supermarkets', 'Convenience'],
        marketShare: '5%',
      },
    ],
  },
  {
    key: 'europe',
    label: 'Europe',
    emoji: '🌍',
    tagline: 'Western, Central & Eastern Europe',
    highlights: [
      { label: 'Countries', value: '7' },
      { label: 'Distribution Centres', value: '18' },
      { label: 'Retail Partners', value: '5,800+' },
      { label: 'Annual Revenue', value: '$72M' },
    ],
    countries: [
      {
        name: 'United Kingdom',
        flag: '🇬🇧',
        cities: ['London', 'Manchester', 'Birmingham', 'Edinburgh'],
        status: 'active',
        channels: ['Supermarkets', 'E-commerce', 'Wholesale', 'Convenience'],
        marketShare: '22%',
      },
      {
        name: 'Germany',
        flag: '🇩🇪',
        cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'],
        status: 'active',
        channels: ['Supermarkets', 'Wholesale', 'Discount Retail'],
        marketShare: '19%',
      },
      {
        name: 'France',
        flag: '🇫🇷',
        cities: ['Paris', 'Lyon', 'Marseille'],
        status: 'active',
        channels: ['Supermarkets', 'E-commerce', 'Specialty Stores'],
        marketShare: '15%',
      },
      {
        name: 'Netherlands',
        flag: '🇳🇱',
        cities: ['Amsterdam', 'Rotterdam'],
        status: 'active',
        channels: ['Supermarkets', 'E-commerce'],
        marketShare: '11%',
      },
      {
        name: 'Spain',
        flag: '🇪🇸',
        cities: ['Madrid', 'Barcelona'],
        status: 'expanding',
        channels: ['Supermarkets', 'Wholesale'],
        marketShare: '8%',
      },
      {
        name: 'Italy',
        flag: '🇮🇹',
        cities: ['Milan', 'Rome'],
        status: 'expanding',
        channels: ['Supermarkets', 'Specialty Stores'],
        marketShare: '7%',
      },
      {
        name: 'Poland',
        flag: '🇵🇱',
        cities: ['Warsaw', 'Kraków'],
        status: 'planned',
        channels: ['Supermarkets'],
        marketShare: '—',
      },
    ],
  },
  {
    key: 'asia',
    label: 'Asia',
    emoji: '🌏',
    tagline: 'South, South-East & East Asia',
    highlights: [
      { label: 'Countries', value: '6' },
      { label: 'Distribution Centres', value: '22' },
      { label: 'Retail Partners', value: '8,400+' },
      { label: 'Annual Revenue', value: '$95M' },
    ],
    countries: [
      {
        name: 'India',
        flag: '🇮🇳',
        cities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'],
        status: 'active',
        channels: ['Supermarkets', 'E-commerce', 'Kirana Stores', 'Wholesale'],
        marketShare: '24%',
      },
      {
        name: 'China',
        flag: '🇨🇳',
        cities: ['Shanghai', 'Beijing', 'Shenzhen', 'Guangzhou'],
        status: 'active',
        channels: ['E-commerce', 'Supermarkets', 'Convenience'],
        marketShare: '20%',
      },
      {
        name: 'Japan',
        flag: '🇯🇵',
        cities: ['Tokyo', 'Osaka', 'Nagoya'],
        status: 'active',
        channels: ['Convenience', 'Supermarkets', 'E-commerce'],
        marketShare: '14%',
      },
      {
        name: 'Singapore',
        flag: '🇸🇬',
        cities: ['Singapore City'],
        status: 'active',
        channels: ['Supermarkets', 'E-commerce', 'Convenience'],
        marketShare: '10%',
      },
      {
        name: 'Indonesia',
        flag: '🇮🇩',
        cities: ['Jakarta', 'Surabaya', 'Bali'],
        status: 'expanding',
        channels: ['Supermarkets', 'E-commerce'],
        marketShare: '7%',
      },
      {
        name: 'Vietnam',
        flag: '🇻🇳',
        cities: ['Ho Chi Minh City', 'Hanoi'],
        status: 'planned',
        channels: ['Supermarkets'],
        marketShare: '—',
      },
    ],
  },
]

const statusConfig = {
  active:    { label: 'Active',    cls: 'status-active' },
  expanding: { label: 'Expanding', cls: 'status-expanding' },
  planned:   { label: 'Planned',   cls: 'status-planned' },
}

export default function Regions() {
  const [activeRegion, setActiveRegion] = useState<RegionKey>('americas')
  const region = regions.find((r) => r.key === activeRegion)!

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <Link to="/" className="back-link" aria-label="Back to home">
          ← Back
        </Link>
        <h1>Region of Operation</h1>
        <p className="page-subtitle">Our global market presence across 3 major regions</p>
      </header>

      <div className="ticks"></div>

      {/* Region tabs */}
      <nav className="region-tabs" aria-label="Select region">
        {regions.map((r) => (
          <button
            key={r.key}
            className={`region-tab${activeRegion === r.key ? ' region-tab-active' : ''}`}
            onClick={() => setActiveRegion(r.key)}
            aria-pressed={activeRegion === r.key}
          >
            <span aria-hidden="true">{r.emoji}</span>
            {r.label}
          </button>
        ))}
      </nav>

      <div className="ticks"></div>

      {/* Region highlights */}
      <section className="stats-bar" aria-label={`${region.label} key metrics`}>
        {region.highlights.map((h) => (
          <div key={h.label} className="stat-item">
            <span className="stat-value">{h.value}</span>
            <span className="stat-label">{h.label}</span>
          </div>
        ))}
      </section>

      <div className="ticks"></div>

      {/* Country cards */}
      <section className="regions-grid" aria-label={`Countries in ${region.label}`}>
        {region.countries.map((c) => (
          <article key={c.name} className={`region-card${c.status === 'active' ? ' region-primary' : ''}`}>
            <div className="region-card-top">
              <span className="region-flag" aria-hidden="true">{c.flag}</span>
              <span className={`country-status ${statusConfig[c.status].cls}`}>
                {statusConfig[c.status].label}
              </span>
            </div>
            <h2>{c.name}</h2>

            <div className="country-detail">
              <span className="detail-label">Key Cities</span>
              <p className="detail-value">{c.cities.join(', ')}</p>
            </div>

            <div className="country-detail">
              <span className="detail-label">Market Share</span>
              <p className="detail-value market-share">{c.marketShare}</p>
            </div>

            <div className="region-services">
              <p className="services-label">Distribution Channels</p>
              <ul className="product-tags" aria-label={`Channels in ${c.name}`}>
                {c.channels.map((ch) => (
                  <li key={ch} className="tag">{ch}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </div>
  )
}
