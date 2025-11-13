# Serverless Photo Recognition System (AWS CDK)

A fully serverless AI-powered image recognition and search system built using AWS Cloud Development Kit (CDK).
The platform automatically analyzes uploaded images using Amazon Rekognition, stores searchable metadata in Amazon OpenSearch, and exposes an authenticated API Gateway endpoint for querying images based on detected labels.

---

## Overview

### Architecture

1. Amazon S3 stores uploaded images.
2. Amazon Rekognition detects image labels when an image is uploaded.
3. AWS Lambda (Indexer) processes and indexes metadata into OpenSearch.
4. AWS Lambda (Search) retrieves matching records from OpenSearch.
5. Amazon API Gateway exposes REST endpoints for search.
6. Amazon Cognito provides secure, token-based authentication.

---

## Key AWS Components

| Service | Purpose |
|--------|---------|
| Amazon S3 | Image storage and trigger for Indexer Lambda |
| Rekognition | Automated label detection |
| OpenSearch | Full-text indexing and search |
| AWS Lambda | Indexing and search compute |
| API Gateway | Public HTTP API |
| Cognito | User authentication and token issuance |
| CloudFormation / CDK | Infrastructure as Code |

---

## Project Structure

serverless-photo-recognition-cdk/
├── bin/
├── lib/
├── lambda/
│ ├── indexer/
│ └── search/
├── scripts/
├── package.json
├── cdk.json
├── tsconfig.json
├── README.md
└── STARTUP.md

yaml
Copy code

---

## Features

- Fully serverless, scalable, and event-driven.
- Automated label detection using Amazon Rekognition.
- Secure user authentication via Amazon Cognito.
- Searchable metadata stored in OpenSearch.
- REST API for querying indexed images.
- Infrastructure-as-code using AWS CDK.
- Helper scripts for automation and testing.

---

## Basic Commands

| Action | Command |
|--------|---------|
| Install dependencies | npm install |
| Deploy CDK stack | npx cdk deploy --profile cdk-deployer --region us-east-1 |
| Retrieve stack information | ./get-stack-info.sh |
| Upload a test image | aws s3 cp ./image.jpg s3://<your-photo-bucket>/ --region us-east-1 |
| Search for images | ./call-api-pro.sh <keyword> |
| View Lambda logs | aws logs tail /aws/lambda/ServerlessPhotoRecognition-IndexerFunction... --follow |
| Destroy resources | npx cdk destroy --profile cdk-deployer --region us-east-1 |

---

## Example Workflow

### 1. Deploy the Stack
npx cdk deploy --profile cdk-deployer --region us-east-1

shell
Copy code

### 2. Upload an Image
aws s3 cp ./camera.jpg s3://<your-bucket>/ --region us-east-1

shell
Copy code

### 3. Check Indexing
View Lambda indexer logs.

### 4. Search by Label
./call-api-pro.sh camera

shell
Copy code

### 5. Cleanup
npx cdk destroy --profile cdk-deployer --region us-east-1

arduino
Copy code

To remove CDK bootstrap:
npx cdk bootstrap --destroy --profile cdk-deployer --region us-east-1

yaml
Copy code

---

## Author

Krishna@8167 
Cloud & IaC Subject  
Specializing in automation and serverless AWS architectures.

---

## License

MIT License - Author and owned by Krishna@8167