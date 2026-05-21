# ECS Hosting Guide — Ritesh Portfolio

This guide walks through hosting the portfolio as a Docker container on AWS ECS Fargate,
with an Application Load Balancer (ALB) in front and CodePipeline for CI/CD.

---

## Architecture Overview

```
GitHub → CodePipeline → CodeBuild → ECR → ECS Fargate
                                              ↑
                                    ALB (port 80/443)
                                              ↑
                                         Users
```

---

## Prerequisites

- AWS CLI configured (`aws configure`)
- Docker installed locally (for testing)
- An existing VPC with at least 2 public subnets across 2 AZs

---

## Step 1 — Create the ECR Repository

```bash
aws ecr create-repository \
  --repository-name ritesh-portfolio \
  --region ap-south-1
```

Note the `repositoryUri` from the output — it looks like:
`123456789.dkr.ecr.ap-south-1.amazonaws.com/ritesh-portfolio`

---

## Step 2 — Test the Docker Image Locally

```bash
# Build
docker build -t ritesh-portfolio .

# Run locally on port 8080
docker run -p 8080:80 ritesh-portfolio

# Open http://localhost:8080 — test /, /products, /regions
```

---

## Step 3 — Create the ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name portfolio-cluster \
  --capacity-providers FARGATE \
  --region ap-south-1
```

---

## Step 4 — Create a Task Definition

Save the following as `task-definition.json` (replace account ID and region):

```json
{
  "family": "portfolio-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "portfolio-app",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/ritesh-portfolio:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/portfolio",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 10
      }
    }
  ]
}
```

Register it:

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --region ap-south-1
```

---

## Step 5 — Create the Application Load Balancer

### 5a. Create a Security Group for the ALB

```bash
aws ec2 create-security-group \
  --group-name portfolio-alb-sg \
  --description "ALB security group for portfolio" \
  --vpc-id YOUR_VPC_ID

# Allow inbound HTTP and HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id YOUR_ALB_SG_ID \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id YOUR_ALB_SG_ID \
  --protocol tcp --port 443 --cidr 0.0.0.0/0
```

### 5b. Create a Security Group for ECS Tasks

```bash
aws ec2 create-security-group \
  --group-name portfolio-ecs-sg \
  --description "ECS task security group for portfolio" \
  --vpc-id YOUR_VPC_ID

# Allow inbound port 80 only from the ALB security group
aws ec2 authorize-security-group-ingress \
  --group-id YOUR_ECS_SG_ID \
  --protocol tcp --port 80 \
  --source-group YOUR_ALB_SG_ID
```

### 5c. Create the ALB

```bash
aws elbv2 create-load-balancer \
  --name portfolio-alb \
  --subnets YOUR_SUBNET_1 YOUR_SUBNET_2 \
  --security-groups YOUR_ALB_SG_ID \
  --region ap-south-1
```

### 5d. Create Target Group

```bash
aws elbv2 create-target-group \
  --name portfolio-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id YOUR_VPC_ID \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --region ap-south-1
```

### 5e. Create Listener

```bash
aws elbv2 create-listener \
  --load-balancer-arn YOUR_ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=YOUR_TG_ARN \
  --region ap-south-1
```

---

## Step 6 — Create the ECS Service

```bash
aws ecs create-service \
  --cluster portfolio-cluster \
  --service-name portfolio-service \
  --task-definition portfolio-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[YOUR_SUBNET_1,YOUR_SUBNET_2],
    securityGroups=[YOUR_ECS_SG_ID],
    assignPublicIp=ENABLED
  }" \
  --load-balancers "targetGroupArn=YOUR_TG_ARN,containerName=portfolio-app,containerPort=80" \
  --region ap-south-1
```

---

## Step 7 — Set Up CodePipeline for CI/CD

### 7a. IAM permissions for CodeBuild

Your CodeBuild role needs these additional policies:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "*"
    }
  ]
}
```

Also enable **Privileged mode** on the CodeBuild project (required for Docker builds):
- CodeBuild console → your project → Edit → Environment → check **Privileged**

### 7b. Pipeline stages

| Stage | Provider | Action |
|---|---|---|
| Source | GitHub (CodeStar connection) | Trigger on push to `main` |
| Build | CodeBuild | Runs `buildspec.yml` → pushes image to ECR → outputs `imagedefinitions.json` |
| Deploy | ECS (rolling update) | Uses `imagedefinitions.json` to update the service |

### 7c. Add the Deploy stage

In the CodePipeline console:
1. Add a new stage after Build → name it **Deploy**
2. Add action → Provider: **Amazon ECS**
3. Cluster: `portfolio-cluster`
4. Service: `portfolio-service`
5. Image definitions file: `imagedefinitions.json`

---

## Step 8 — (Optional) Add HTTPS with ACM

```bash
# Request a certificate (must validate via DNS)
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS \
  --region ap-south-1

# Add HTTPS listener to ALB
aws elbv2 create-listener \
  --load-balancer-arn YOUR_ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=YOUR_CERT_ARN \
  --default-actions Type=forward,TargetGroupArn=YOUR_TG_ARN \
  --region ap-south-1

# Redirect HTTP → HTTPS on port 80 listener
aws elbv2 modify-listener \
  --listener-arn YOUR_HTTP_LISTENER_ARN \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}"
```

---

## Cost Estimate (ap-south-1, 2 tasks)

| Resource | Approx. monthly cost |
|---|---|
| ECS Fargate (2 × 0.25 vCPU / 0.5 GB, 24/7) | ~$8 |
| ALB | ~$18 |
| ECR storage (< 1 GB) | ~$0.10 |
| Data transfer | ~$1–3 |
| **Total** | **~$27–30/month** |

> Compare: S3 + CloudFront is ~$1–2/month. Use ECS if you need server-side logic,
> WebSockets, or want to add a backend API to the same container later.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Tasks keep stopping | Health check failing | Check `/health` returns 200; check CloudWatch logs |
| 502 Bad Gateway from ALB | Container not ready yet | Increase health check `startPeriod` |
| ECR push denied in CodeBuild | Missing IAM permissions | Add ECR permissions to CodeBuild role |
| Docker build fails in CodeBuild | Privileged mode off | Enable Privileged in CodeBuild environment settings |
| `/products` returns 404 | nginx config not copied | Verify `nginx.conf` is in repo root and `COPY` line is in Dockerfile |
