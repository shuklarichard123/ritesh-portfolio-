import { Link } from 'react-router-dom'
import './Products.css'

interface Product {
  id: number
  name: string
  category: string
  description: string
  tags: string[]
  status: 'live' | 'in-progress' | 'archived'
  link?: string
}

const products: Product[] = [
  {
    id: 1,
    name: 'Portfolio Site',
    category: 'Web',
    description:
      'This very site — a React + Vite SPA deployed on AWS S3 + CloudFront via CodePipeline CI/CD.',
    tags: ['React', 'Vite', 'AWS', 'CloudFront', 'CodePipeline'],
    status: 'live',
  },
  {
    id: 2,
    name: 'AWS Infrastructure Automation',
    category: 'DevOps',
    description:
      'CloudFormation / Terraform templates for provisioning multi-region VPCs, ECS clusters, RDS, and IAM roles with least-privilege policies.',
    tags: ['Terraform', 'CloudFormation', 'ECS', 'RDS', 'IAM'],
    status: 'live',
  },
  {
    id: 3,
    name: 'CI/CD Pipeline Framework',
    category: 'DevOps',
    description:
      'Reusable CodePipeline + CodeBuild buildspec templates supporting Node.js, Python, and Docker workloads with automated testing gates.',
    tags: ['CodePipeline', 'CodeBuild', 'Docker', 'Node.js', 'Python'],
    status: 'live',
  },
  {
    id: 4,
    name: 'Serverless API Gateway',
    category: 'Backend',
    description:
      'Event-driven REST API built with AWS Lambda, API Gateway, and DynamoDB — auto-scaling with zero cold-start optimisation.',
    tags: ['Lambda', 'API Gateway', 'DynamoDB', 'Serverless'],
    status: 'in-progress',
  },
  {
    id: 5,
    name: 'Cost Optimisation Dashboard',
    category: 'FinOps',
    description:
      'AWS Cost Explorer data aggregated into a React dashboard with per-service breakdowns, anomaly alerts, and savings recommendations.',
    tags: ['Cost Explorer', 'React', 'CloudWatch', 'FinOps'],
    status: 'in-progress',
  },
  {
    id: 6,
    name: 'Container Orchestration Toolkit',
    category: 'DevOps',
    description:
      'Helm charts and EKS node-group configurations for blue/green deployments with ALB Ingress Controller and Horizontal Pod Autoscaler.',
    tags: ['EKS', 'Helm', 'Kubernetes', 'ALB', 'HPA'],
    status: 'archived',
  },
]

const statusLabel: Record<Product['status'], string> = {
  live: 'Live',
  'in-progress': 'In Progress',
  archived: 'Archived',
}

export default function Products() {
  return (
    <div className="page-wrapper">
      <header className="page-header">
        <Link to="/" className="back-link" aria-label="Back to home">
          ← Back
        </Link>
        <h1>Product Portfolio</h1>
        <p className="page-subtitle">Projects, tools &amp; solutions I've built</p>
      </header>

      <div className="ticks"></div>

      <section className="products-grid" aria-label="Product list">
        {products.map((p) => (
          <article key={p.id} className="product-card">
            <div className="product-card-top">
              <span className="product-category">{p.category}</span>
              <span className={`product-status status-${p.status}`} aria-label={`Status: ${statusLabel[p.status]}`}>
                {statusLabel[p.status]}
              </span>
            </div>
            <h2>{p.name}</h2>
            <p className="product-desc">{p.description}</p>
            <ul className="product-tags" aria-label="Technologies">
              {p.tags.map((tag) => (
                <li key={tag} className="tag">
                  {tag}
                </li>
              ))}
            </ul>
            {p.link && (
              <a href={p.link} target="_blank" rel="noopener noreferrer" className="product-link">
                View project →
              </a>
            )}
          </article>
        ))}
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </div>
  )
}
