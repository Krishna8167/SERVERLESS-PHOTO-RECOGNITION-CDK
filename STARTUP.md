# Startup Guide — Serverless Photo Recognition (AWS CDK)

This guide provides a streamlined process to redeploy or demonstrate the Serverless Photo Recognition System in a clean environment.

---

## 1. Prerequisites

Configure AWS CLI:
aws configure --profile cdk-deployer

mathematica
Copy code

Install Node.js and npm.

Install AWS CDK:
npm install -g aws-cdk

yaml
Copy code

---

## 2. Project Setup

Navigate to the project directory:
cd serverless-photo-recognition-cdk

yaml
Copy code

Install dependencies:
npm install

yaml
Copy code

---

## 3. Deploy the Infrastructure

Deploy your CDK stack:
npx cdk deploy --profile cdk-deployer --region us-east-1

yaml
Copy code

Resources created include:

- S3 bucket for images
- Indexer and Search Lambda functions
- OpenSearch domain
- Cognito user pool and app client
- API Gateway endpoint

---

## 4. Retrieve Stack Information

./get-stack-info.sh

yaml
Copy code

Outputs:

- Stack name  
- S3 bucket name  
- Lambda ARNs  
- OpenSearch endpoint  
- API Gateway endpoint  
- Cognito User Pool ID / Client ID  

---

## 5. Upload a Test Image

aws s3 cp ./camera.jpg s3://<your-photo-bucket>/ --region us-east-1

yaml
Copy code

Triggers:

- Rekognition → label detection  
- Indexer Lambda → OpenSearch indexing  

---

## 6. Verify Indexing

aws logs tail /aws/lambda/ServerlessPhotoRecognition-IndexerFunction... --follow --region us-east-1

yaml
Copy code

You should see:

- Detected labels
- Indexed successfully messages

---

## 7. Search for Images

./call-api-pro.sh camera

yaml
Copy code

Returns:

- Image name  
- Labels  
- S3 URL  

---

## 8. Cleanup

To remove stack resources:
npx cdk destroy --profile cdk-deployer --region us-east-1

arduino
Copy code

To remove CDK bootstrap:
npx cdk bootstrap --destroy --profile cdk-deployer --region us-east-1

yaml
Copy code

---

## Quick Summary

npm install
npx cdk deploy --profile cdk-deployer --region us-east-1
./get-stack-info.sh
aws s3 cp ./camera.jpg s3://<bucket>/
./call-api-pro.sh camera
npx cdk destroy --profile cdk-deployer --region us-east-1

yaml
Copy code

---

Project ready for redeployment, testing, or demonstrations.