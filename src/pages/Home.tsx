import { Link } from 'react-router-dom'
import heroImg from '../assets/hero.png'
import '../App.css'
import './Products.css'

export default function Home() {
  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="Portfolio hero" />
        </div>
        <div>
          <h1>Ritesh Shukla</h1>
          <p>Cloud &amp; DevOps Engineer · AWS · Infrastructure as Code</p>
        </div>
        <nav className="home-nav" aria-label="Portfolio sections">
          <Link to="/products" className="nav-card">
            <span className="nav-card-icon" aria-hidden="true">🛒</span>
            <span className="nav-card-title">Product Portfolio</span>
            <span className="nav-card-desc">FMCG product range across 5 categories</span>
          </Link>
          <Link to="/regions" className="nav-card">
            <span className="nav-card-icon" aria-hidden="true">🌍</span>
            <span className="nav-card-title">Region of Operation</span>
            <span className="nav-card-desc">Americas, Europe &amp; Asia market presence</span>
          </Link>
        </nav>
      </section>
      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}
