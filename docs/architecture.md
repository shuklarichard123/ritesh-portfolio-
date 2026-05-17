flowchart LR
A[Developer Push to GitHub] --> B[AWS CodePipeline]
B --> C[AWS CodeBuild]
C --> D["S3 Bucket (Private)"]
D --> E["CloudFront Distribution (OAC)"]
E --> F[Public Users]