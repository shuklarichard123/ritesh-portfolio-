# =============================================================================
# deploy-frontend.ps1
# Deploys the frontend static files to an S3 bucket and invalidates CloudFront
#
# Usage: .\deploy-frontend.ps1 -BucketName "your-bucket" -DistributionId "EXXX"
# =============================================================================

param(
  [Parameter(Mandatory=$true)]  [string]$BucketName,
  [Parameter(Mandatory=$false)] [string]$DistributionId = ""
)

$REGION = "eu-west-1"

Write-Host "`n==> Deploying frontend to s3://$BucketName ..." -ForegroundColor Cyan

# Upload HTML — no cache (index.html should always be fresh)
aws s3 cp frontend\index.html "s3://$BucketName/index.html" `
  --region $REGION `
  --content-type "text/html" `
  --cache-control "no-cache, no-store, must-revalidate"

# Upload CSS and JS — short cache
aws s3 cp frontend\style.css "s3://$BucketName/style.css" `
  --region $REGION `
  --content-type "text/css" `
  --cache-control "max-age=300"

aws s3 cp frontend\app.js "s3://$BucketName/app.js" `
  --region $REGION `
  --content-type "application/javascript" `
  --cache-control "max-age=300"

# Upload api-config.js — never cache (contains the API URL)
aws s3 cp frontend\api-config.js "s3://$BucketName/api-config.js" `
  --region $REGION `
  --content-type "application/javascript" `
  --cache-control "no-cache, no-store, must-revalidate"

Write-Host "    Upload complete." -ForegroundColor Green

# Invalidate CloudFront if distribution ID provided
if ($DistributionId -ne "") {
  Write-Host "`n==> Invalidating CloudFront distribution $DistributionId ..." -ForegroundColor Cyan
  aws cloudfront create-invalidation `
    --distribution-id $DistributionId `
    --paths "/*"
  Write-Host "    Invalidation triggered." -ForegroundColor Green
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host " Frontend deployed!" -ForegroundColor Green
Write-Host " Bucket : s3://$BucketName" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green
