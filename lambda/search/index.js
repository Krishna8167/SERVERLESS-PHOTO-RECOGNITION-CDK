const AWS = require('aws-sdk');
const https = require('https');
const url = require('url');
const aws4 = require('aws4');

const s3 = new AWS.S3();
let endpoint = process.env.OPENSEARCH_ENDPOINT;

// ✅ Ensure endpoint starts with "https://"
if (!endpoint.startsWith('https://')) {
  endpoint = `https://${endpoint}`;
}

const index = process.env.INDEX || 'photos';

exports.handler = async (event) => {
  console.log('Search Event:', JSON.stringify(event));

  const body = event.body ? JSON.parse(event.body) : {};
  const searchKey =
    event.headers?.['search-key'] ||
    body.q ||
    body['search-key'];

  if (!searchKey) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing search-key' }) };
  }

  const query = {
    query: {
      match: { labels: searchKey.toLowerCase() }
    },
    size: 20
  };

  const parsed = new url.URL(endpoint);
  const pathUrl = `/${index}/_search`;
  const bodyStr = JSON.stringify(query);

  const signed = aws4.sign({
    host: parsed.hostname,
    path: pathUrl,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: bodyStr,
    service: 'es',
    region: process.env.AWS_REGION || 'us-east-1'
  });

  try {
    const results = await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: parsed.hostname,
          port: 443,
          path: pathUrl,
          method: 'POST',
          headers: signed.headers
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            if (res.statusCode < 300) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`OpenSearch error ${res.statusCode}: ${data}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.write(bodyStr);
      req.end();
    });

    const hits = results.hits?.hits || [];
    const output = [];

    for (const h of hits) {
      const src = h._source;
      const presigned = await s3.getSignedUrlPromise('getObject', {
        Bucket: src.bucket,
        Key: src.key,
        Expires: 3600
      });
      output.push({ key: src.key, labels: src.labels, url: presigned });
    }

    return { statusCode: 200, body: JSON.stringify(output) };
  } catch (err) {
    console.error('Search Lambda error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
