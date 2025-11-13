const AWS = require('aws-sdk');
const https = require('https');
const url = require('url');
const aws4 = require('aws4');

const rekognition = new AWS.Rekognition();
const s3 = new AWS.S3();

// Ensure OpenSearch endpoint always has https://
let endpoint = process.env.OPENSEARCH_ENDPOINT;
if (!endpoint.startsWith('https://')) {
  endpoint = `https://${endpoint}`;
}

const index = process.env.INDEX || 'photos';

exports.handler = async (event) => {
  console.log('Indexer Event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    // Skip folder placeholders
    if (key.endsWith('/')) continue;

    try {
      // Get image bytes
      const image = await s3.getObject({ Bucket: bucket, Key: key }).promise();

      // Detect labels using Rekognition
      const rekogResult = await rekognition.detectLabels({
        Image: { Bytes: image.Body },
        MaxLabels: 10,
        MinConfidence: 75,
      }).promise();

      const labels = rekogResult.Labels.map(label => label.Name.toLowerCase());
      console.log('Detected labels:', labels);

      // Build OpenSearch document
      const document = {
        key,
        bucket,
        labels,
        timestamp: new Date().toISOString(),
      };

      const parsed = new url.URL(endpoint);
      const pathUrl = `/${index}/_doc`;
      const body = JSON.stringify(document);

      // Sign the OpenSearch request
      const signed = aws4.sign({
        host: parsed.hostname,
        path: pathUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        service: 'es', // important for OpenSearch signing
        region: process.env.AWS_REGION || 'us-east-1',
      });

      // Send the HTTPS request
      await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: parsed.hostname,
          port: 443,
          path: pathUrl,
          method: 'POST',
          headers: signed.headers,
        }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            if (res.statusCode < 300) {
              console.log(`Indexed ${key} successfully with labels:`, labels);
              resolve(data);
            } else {
              reject(new Error(`OpenSearch index error: ${res.statusCode} - ${data}`));
            }
          });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
      });

    } catch (err) {
      console.error(`Error processing ${key}:`, err);
    }
  }
};
