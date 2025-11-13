🧠 Serverless Photo Recognition — Quick Commands
🧩 Build & Deploy
npm run build
npx cdk deploy --profile cdk-deployer --region us-east-1

📦 Get Stack Info
./get-stack-info.sh

👤 Create & Confirm Cognito User
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id us-east-1_JFf7lv3kQ \
  --username testuser@example.com \
  --profile cdk-deployer --region us-east-1

🔐 Get ID Token (Manual)
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 7jdbh5ddhbok9pf2l8m4fmrco7 \
  --auth-parameters USERNAME=testuser@example.com,PASSWORD=StrongPassword#123 \
  --profile cdk-deployer --region us-east-1 \
  --query "AuthenticationResult.IdToken" --output text

🪣 Upload Image to S3
aws s3 cp ./camera.jpg s3://serverlessphotorecognitionstac-photobucket465738b3-kuyusqlcz5j5/ \
  --profile cdk-deployer --region us-east-1

📜 Check Indexer Lambda Logs
aws logs tail /aws/lambda/ServerlessPhotoRecognition-IndexerFunction8CB4D11B-c2b8j4TQnmgE \
  --follow --profile cdk-deployer --region us-east-1

🔍 Search Photos via API (Manual)
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: <your-ID-token>" \
  -H "search-key: cat" \
  "https://98phtt9dlf.execute-api.us-east-1.amazonaws.com/prod/picture/search" \
  | jq

🚀 Search Photos via Script (Auto Auth)
./call-api.sh <label>

⚡ Cached Token Search
./call-api-pro.sh <label>

🧹 Destroy Stack
cdk destroy --profile cdk-deployer --region us-east-1