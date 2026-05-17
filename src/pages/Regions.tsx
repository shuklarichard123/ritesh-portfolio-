import { Link } from 'react-router-dom'
import './Regions.css'

interface Region {
  code: string
  name: string
  location: string
  flag: string
  services: string[]
  primary: boolean
}

const regions: Region[] = [
  {
    code: 'ap-south-1',
    name: 'Asia Pacific (Mumbai)',
    location: 'Mumbai, India',
    flag: '🇮🇳',
    services: ['EC2', 'S3', 'RDS', 'Lambda', 'CloudFront', 'CodePipeline'],
    primary: true,
  },
  {
    code: 'us-east-1',
    name: 'US East (N. Virginia)',
    location: 'Virginia, USA',
    flag: '🇺🇸',
    services: ['S3', 'CloudFront', 'Route 53', 'IAM', 'ACM'],
    primary: false,
  },
  {
    code: 'ap-southeast-1',
    name: 'Asia Pacific (Singapore)',
    location: 'Singapore',
    flag: '🇸🇬',
    services: ['EC2', 'ECS', 'ALB', 'RDS', 'ElastiCache'],
    primary: false,
  },
  {
    code: 'eu-west-1',
    name: 'Europe (Ireland)',
    location: 'Dublin, Ireland',
    flag: '🇮🇪',
    services: ['EC2', 'S3', 'Lambda', 'CloudWatch'],
    primary: false,
  },
]

const stats = [
  { label: 'AWS Regions', value: regions.length.toString() },
  { label: 'Services Used', value: '20+' },
  { label: 'Deployments', value: '50+' },
  { label: 'Uptime SLA', value: '99.9%' },
]

export default function Regions() {
  return (
    <div className="page-wrapper">
      <header className="page-header">
        <Link to="/" className="back-link" aria-label="Back to home">
          ← Back
        </Link>
        <h1>Region of Operation</h1>
        <p className="page-subtitle">AWS regions &amp; global deployment footprint</p>
      </header>

      <div className="ticks"></div>

      {/* Stats bar */}
      <section className="stats-bar" aria-label="Key metrics">
        {stats.map((s) => (
          <div key={s.label} className="stat-item">
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      <div className="ticks"></div>

      {/* Region cards */}
      <section className="regions-grid" aria-label="AWS regions">
        {regions.map((r) => (
          <article key={r.code} className={`region-card${r.primary ? ' region-primary' : ''}`}>
            <div className="region-card-top">
              <span className="region-flag" aria-hidden="true">{r.flag}</span>
              {r.primary && (
                <span className="primary-badge" aria-label="Primary region">
                  Primary
                </span>
              )}
            </div>
            <h2>{r.name}</h2>
            <p className="region-location">
              <span aria-hidden="true">📍</span> {r.location}
            </p>
            <code className="region-code">{r.code}</code>
            <div className="region-services">
              <p className="services-label">Active services</p>
              <ul className="product-tags" aria-label={`Services in ${r.name}`}>
                {r.services.map((svc) => (
                  <li key={svc} className="tag">
                    {svc}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <div className="ticks"></div>

      {/* World map placeholder */}
      <section className="map-section" aria-label="Deployment map">
        <h2>Global Footprint</h2>
        <p>Deployments span 4 AWS regions across Asia Pacific, Europe, and North America.</p>
        <div className="map-visual" aria-hidden="true">
          <div className="map-dot dot-mumbai" title="ap-south-1 · Mumbai"></div>
          <div className="map-dot dot-virginia" title="us-east-1 · N. Virginia"></div>
          <div className="map-dot dot-singapore" title="ap-southeast-1 · Singapore"></div>
          <div className="map-dot dot-ireland" title="eu-west-1 · Ireland"></div>
        </div>
        <p className="map-legend">
          <span className="legend-dot primary-dot" aria-hidden="true"></span> Primary region &nbsp;
          <span className="legend-dot secondary-dot" aria-hidden="true"></span> Secondary region
        </p>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </div>
  )
}
