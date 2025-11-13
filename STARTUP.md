Serverless Photo Recognition — Startup Checklist

Use this when you restart your laptop or come back to the project after a break.
```
 1️⃣ Navigate to Project
cd ~/OneDrive/Desktop/serverless-photo-recognition-cdk
```
 2️⃣ Run API Search (Auto Handles Token)
./call-api-pro.sh <label>
Example:

./call-api-pro.sh cat


✅ If token expired — it will auto-refresh.
✅ If /tmp cleared — it will auto-create a new one.
```
🪣 3️⃣ Upload New Image (Optional)
aws s3 cp ./camera.jpg s3://serverlessphotorecognitionstac-photobucket465738b3-kuyusqlcz5j5/ \
  --profile cdk-deployer --region us-east-1


Then check logs (optional):

aws logs tail /aws/lambda/ServerlessPhotoRecognition-IndexerFunction8CB4D11B-c2b8j4TQnmgE \
  --follow --region us-east-1

🔍 4️⃣ Search New Image Labels
./call-api-pro.sh person
./call-api-pro.sh security
./call-api-pro.sh camera

🧹 5️⃣ (Optional) Clean Up AWS Resources

When done:

cdk destroy --profile cdk-deployer --region us-east-1

⚡ Quick Reminders

No need to redeploy or rebuild — everything’s still live in AWS.

The script handles token expiration automatically.

You can use ./get-stack-info.sh anytime to view your stack details.

✅ Daily Shortcut
If you just want to verify everything is still live:

./call-api-pro.sh cat