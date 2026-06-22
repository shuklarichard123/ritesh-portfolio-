# =============================================================================
# deploy-infra.ps1
# Provisions DynamoDB table, Lambda function, and API Gateway for user-tracker
# Run once from the user-tracker/ directory.
#
# Prerequisites: AWS CLI configured, Python 3.12 available
# Usage: .\deploy-infra.ps1
# =============================================================================

$REGION      = "eu-west-1"
$ACCOUNT_ID  = aws sts get-caller-identity --query Account --output text
$TABLE_NAME  = "user-tracker"
$LAMBDA_NAME = "user-tracker-api"
$ROLE_NAME   = "user-tracker-lambda-role"
$API_NAME    = "user-tracker-api-gw"

Write-Host "`n==> Account: $ACCOUNT_ID | Region: $REGION" -ForegroundColor Cyan

# ── 1. DynamoDB table ────────────────────────────────────────────────────────
Write-Host "`n==> Creating DynamoDB table '$TABLE_NAME'..." -ForegroundColor Cyan
$tableCheck = aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION 2>&1
if ($LASTEXITCODE -ne 0) {
    aws dynamodb create-table `
        --table-name $TABLE_NAME `
        --attribute-definitions `
            AttributeName=request_id,AttributeType=S `
            AttributeName=username,AttributeType=S `
        --key-schema AttributeName=request_id,KeyType=HASH `
        --global-secondary-indexes "[{
            \"IndexName\": \"username-index\",
            \"KeySchema\": [{\"AttributeName\":\"username\",\"KeyType\":\"HASH\"}],
            \"Projection\": {\"ProjectionType\":\"ALL\"},
            \"BillingMode\": \"PAY_PER_REQUEST\"
        }]" `
        --billing-mode PAY_PER_REQUEST `
        --region $REGION | Out-Null
    Write-Host "    Table created." -ForegroundColor Green
} else {
    Write-Host "    Table already exists." -ForegroundColor Green
}

# ── 2. IAM role for Lambda ───────────────────────────────────────────────────
Write-Host "`n==> Creating IAM role '$ROLE_NAME'..." -ForegroundColor Cyan
$roleCheck = aws iam get-role --role-name $ROLE_NAME 2>&1
if ($LASTEXITCODE -ne 0) {
    $trustPolicy = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
    $trustPolicy | Out-File -FilePath "trust.json" -Encoding utf8 -NoNewline
    aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://trust.json | Out-Null
    aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    # Inline policy for DynamoDB access
    $dynamoPolicy = "{`"Version`":`"2012-10-17`",`"Statement`":[{`"Effect`":`"Allow`",`"Action`":[`"dynamodb:PutItem`",`"dynamodb:GetItem`",`"dynamodb:Scan`",`"dynamodb:Query`"],`"Resource`":[`"arn:aws:dynamodb:$REGION`:$ACCOUNT_ID`:table/$TABLE_NAME`",`"arn:aws:dynamodb:$REGION`:$ACCOUNT_ID`:table/$TABLE_NAME/index/*`"]}]}"
    aws iam put-role-policy --role-name $ROLE_NAME --policy-name dynamodb-access --policy-document $dynamoPolicy
    Remove-Item trust.json -Force
    Write-Host "    Role created. Waiting 10s for IAM propagation..."
    Start-Sleep -Seconds 10
} else {
    Write-Host "    Role already exists." -ForegroundColor Green
}
$ROLE_ARN = aws iam get-role --role-name $ROLE_NAME --query "Role.Arn" --output text

# ── 3. Package Lambda ────────────────────────────────────────────────────────
Write-Host "`n==> Packaging Lambda function..." -ForegroundColor Cyan
if (Test-Path "lambda\package") { Remove-Item -Recurse -Force "lambda\package" }
New-Item -ItemType Directory -Path "lambda\package" | Out-Null
Copy-Item "lambda\handler.py" "lambda\package\"
Compress-Archive -Path "lambda\package\*" -DestinationPath "lambda\function.zip" -Force
Remove-Item -Recurse -Force "lambda\package"
Write-Host "    Packaged to lambda/function.zip" -ForegroundColor Green

# ── 4. Deploy Lambda ─────────────────────────────────────────────────────────
Write-Host "`n==> Deploying Lambda function '$LAMBDA_NAME'..." -ForegroundColor Cyan
$lambdaCheck = aws lambda get-function --function-name $LAMBDA_NAME --region $REGION 2>&1
if ($LASTEXITCODE -ne 0) {
    aws lambda create-function `
        --function-name $LAMBDA_NAME `
        --runtime python3.12 `
        --role $ROLE_ARN `
        --handler handler.handler `
        --zip-file fileb://lambda/function.zip `
        --environment "Variables={TABLE_NAME=$TABLE_NAME}" `
        --timeout 15 `
        --memory-size 128 `
        --region $REGION | Out-Null
    Write-Host "    Lambda created. Waiting for active state..."
    aws lambda wait function-active --function-name $LAMBDA_NAME --region $REGION
} else {
    aws lambda update-function-code `
        --function-name $LAMBDA_NAME `
        --zip-file fileb://lambda/function.zip `
        --region $REGION | Out-Null
    Write-Host "    Lambda code updated."
}
$LAMBDA_ARN = aws lambda get-function --function-name $LAMBDA_NAME --region $REGION --query "Configuration.FunctionArn" --output text
Write-Host "    Lambda ARN: $LAMBDA_ARN" -ForegroundColor Green

# ── 5. API Gateway ───────────────────────────────────────────────────────────
Write-Host "`n==> Setting up API Gateway '$API_NAME'..." -ForegroundColor Cyan
$apiId = aws apigateway get-rest-apis --region $REGION --query "items[?name=='$API_NAME'].id" --output text
if (-not $apiId -or $apiId -eq "None") {
    $apiId = aws apigateway create-rest-api `
        --name $API_NAME `
        --description "User Tracker REST API" `
        --region $REGION `
        --query "id" --output text
    Write-Host "    API created: $apiId"
} else {
    Write-Host "    API already exists: $apiId"
}

# Get root resource ID
$rootId = aws apigateway get-resources --rest-api-id $apiId --region $REGION --query "items[?path=='/'].id" --output text

# Create /records resource
$recordsId = aws apigateway get-resources --rest-api-id $apiId --region $REGION --query "items[?path=='/records'].id" --output text
if (-not $recordsId -or $recordsId -eq "None") {
    $recordsId = aws apigateway create-resource --rest-api-id $apiId --parent-id $rootId --path-part "records" --region $REGION --query "id" --output text
}

# Create /records/{request_id} resource
$recordId = aws apigateway get-resources --rest-api-id $apiId --region $REGION --query "items[?path=='/records/{request_id}'].id" --output text
if (-not $recordId -or $recordId -eq "None") {
    $recordId = aws apigateway create-resource --rest-api-id $apiId --parent-id $recordsId --path-part "{request_id}" --region $REGION --query "id" --output text
}

$LAMBDA_URI = "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"

# Helper: add method + Lambda integration + CORS
function Add-Method($resourceId, $httpMethod) {
    aws apigateway put-method `
        --rest-api-id $apiId `
        --resource-id $resourceId `
        --http-method $httpMethod `
        --authorization-type NONE `
        --region $REGION 2>&1 | Out-Null

    aws apigateway put-integration `
        --rest-api-id $apiId `
        --resource-id $resourceId `
        --http-method $httpMethod `
        --type AWS_PROXY `
        --integration-http-method POST `
        --uri $LAMBDA_URI `
        --region $REGION 2>&1 | Out-Null
}

# /records — POST and GET and OPTIONS
Add-Method $recordsId "POST"
Add-Method $recordsId "GET"
Add-Method $recordsId "OPTIONS"

# /records/{request_id} — GET and OPTIONS
Add-Method $recordId "GET"
Add-Method $recordId "OPTIONS"

# Grant API Gateway permission to invoke Lambda
$stmtCheck = aws lambda get-policy --function-name $LAMBDA_NAME --region $REGION 2>&1
if ($LASTEXITCODE -ne 0) {
    aws lambda add-permission `
        --function-name $LAMBDA_NAME `
        --statement-id apigateway-invoke `
        --action lambda:InvokeFunction `
        --principal apigateway.amazonaws.com `
        --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${apiId}/*/*" `
        --region $REGION | Out-Null
}

# Deploy to 'prod' stage
aws apigateway create-deployment `
    --rest-api-id $apiId `
    --stage-name prod `
    --region $REGION | Out-Null

$API_URL = "https://$apiId.execute-api.$REGION.amazonaws.com/prod"
Write-Host "    API deployed: $API_URL" -ForegroundColor Green

# ── 6. Write API URL to frontend config ─────────────────────────────────────
Write-Host "`n==> Writing API URL to frontend config..." -ForegroundColor Cyan
$config = "window.USER_TRACKER_API = `"$API_URL`";"
$config | Out-File -FilePath "frontend\api-config.js" -Encoding utf8
Write-Host "    Written to frontend/api-config.js" -ForegroundColor Green

# ── Done ─────────────────────────────────────────────────────────────────────
Write-Host "`n============================================" -ForegroundColor Green
Write-Host " Infrastructure ready!" -ForegroundColor Green
Write-Host " API URL : $API_URL" -ForegroundColor Green
Write-Host " Table   : $TABLE_NAME (eu-west-1)" -ForegroundColor Green
Write-Host " Next    : deploy frontend\ to S3" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green
