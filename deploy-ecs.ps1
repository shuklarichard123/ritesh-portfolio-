# ============================================================
# deploy-ecs.ps1
# Builds the Docker image, pushes to ECR, and registers a
# new ECS task definition revision.
#
# Prerequisites:
#   - AWS CLI installed and configured (aws configure)
#   - Docker Desktop running
#   - ECR repository already created (Step 1 below)
#
# Usage:
#   .\deploy-ecs.ps1
# ============================================================

# ── Config — edit these to match your AWS setup ─────────────
$REGION       = "eu-west-1"
$ECR_REPO     = "ritesh-portfolio"
$CLUSTER      = "portfolio-cluster"
$SERVICE      = "portfolio-service"
$TASK_FAMILY  = "portfolio-task"
$CONTAINER    = "portfolio-app"
# ────────────────────────────────────────────────────────────

Write-Host "`n==> Getting AWS Account ID..." -ForegroundColor Cyan
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: AWS CLI not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

$ECR_REGISTRY = "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
$IMAGE_URI    = "$ECR_REGISTRY/$ECR_REPO"
$IMAGE_TAG    = git rev-parse --short HEAD

Write-Host "Account  : $ACCOUNT_ID"
Write-Host "Registry : $ECR_REGISTRY"
Write-Host "Image    : $IMAGE_URI`:$IMAGE_TAG"

# ── Step 1: Ensure ECR repo exists ──────────────────────────
Write-Host "`n==> Ensuring ECR repository exists..." -ForegroundColor Cyan
$repoCheck = aws ecr describe-repositories --repository-names $ECR_REPO --region $REGION 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "    Repository not found — creating it..."
    aws ecr create-repository --repository-name $ECR_REPO --region $REGION | Out-Null
    Write-Host "    Created: $ECR_REGISTRY/$ECR_REPO" -ForegroundColor Green
} else {
    Write-Host "    Repository already exists." -ForegroundColor Green
}

# ── Step 2: Authenticate Docker to ECR ──────────────────────
Write-Host "`n==> Logging Docker into ECR..." -ForegroundColor Cyan
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker login to ECR failed." -ForegroundColor Red
    exit 1
}

# ── Step 3: Build Docker image ───────────────────────────────
Write-Host "`n==> Building Docker image..." -ForegroundColor Cyan
docker build -t "$IMAGE_URI`:$IMAGE_TAG" -t "$IMAGE_URI`:latest" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker build failed." -ForegroundColor Red
    exit 1
}
Write-Host "    Build complete." -ForegroundColor Green

# ── Step 4: Push to ECR ──────────────────────────────────────
Write-Host "`n==> Pushing image to ECR..." -ForegroundColor Cyan
docker push "$IMAGE_URI`:$IMAGE_TAG"
docker push "$IMAGE_URI`:latest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker push failed." -ForegroundColor Red
    exit 1
}
Write-Host "    Push complete." -ForegroundColor Green

# ── Step 5: Write task definition JSON ───────────────────────
Write-Host "`n==> Writing task definition..." -ForegroundColor Cyan

$taskDef = @"
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID`:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "$CONTAINER",
      "image": "$IMAGE_URI`:$IMAGE_TAG",
      "portMappings": [{ "containerPort": 80, "protocol": "tcp" }],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/portfolio",
          "awslogs-region": "$REGION",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
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
"@

$taskDef | Out-File -FilePath "task-definition-generated.json" -Encoding utf8
Write-Host "    Written to task-definition-generated.json" -ForegroundColor Green

# ── Step 6: Register task definition ─────────────────────────
Write-Host "`n==> Registering task definition with ECS..." -ForegroundColor Cyan
$taskOutput = aws ecs register-task-definition `
    --cli-input-json file://task-definition-generated.json `
    --region $REGION `
    --output json | ConvertFrom-Json

$taskArn = $taskOutput.taskDefinition.taskDefinitionArn
Write-Host "    Registered: $taskArn" -ForegroundColor Green

# ── Step 7: Update ECS service (if it exists) ────────────────
Write-Host "`n==> Checking if ECS service exists..." -ForegroundColor Cyan
$svcCheck = aws ecs describe-services `
    --cluster $CLUSTER `
    --services $SERVICE `
    --region $REGION `
    --query "services[0].status" `
    --output text 2>&1

if ($svcCheck -eq "ACTIVE") {
    Write-Host "    Service found — updating to new task revision..." -ForegroundColor Cyan
    aws ecs update-service `
        --cluster $CLUSTER `
        --service $SERVICE `
        --task-definition $taskArn `
        --region $REGION | Out-Null
    Write-Host "    Service updated. ECS will roll out the new task." -ForegroundColor Green
} else {
    Write-Host "    Service '$SERVICE' not found in cluster '$CLUSTER'." -ForegroundColor Yellow
    Write-Host "    Follow the ECS_Hosting_Guide.md to create the cluster, ALB, and service first." -ForegroundColor Yellow
    Write-Host "    Then re-run this script to deploy." -ForegroundColor Yellow
}

# ── Done ─────────────────────────────────────────────────────
Write-Host "`n============================================" -ForegroundColor Green
Write-Host " Deployment complete!" -ForegroundColor Green
Write-Host " Image : $IMAGE_URI`:$IMAGE_TAG" -ForegroundColor Green
Write-Host " Task  : $taskArn" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green
