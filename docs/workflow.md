sequenceDiagram
participant Dev as Developer
participant GH as GitHub
participant CP as CodePipeline
participant CB as CodeBuild
participant S3 as S3 (Private)
participant CF as CloudFront
participant User as User

Dev->>GH: git push main
GH->>CP: Trigger pipeline via GitHub connection
CP->>CB: Build stage
CB->>CB: npm ci && npm run build
CB->>S3: Deploy dist artifacts
User->>CF: Request CloudFront URL
CF->>S3: Fetch objects via OAC signed access
CF-->>User: Serve site globally (cached)