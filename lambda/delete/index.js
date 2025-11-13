const AWS = require('aws-sdk');
const https = require('https');
const url = require('url');
const aws4 = require('aws4');

const endpoint = process.env.OPENSEARCH_ENDPOINT;
const index = process.env.INDEX || 'photos';

exports.handler = async (event) => {
  console.log('Delete Event:', JSON.stringify(event));

  for (const record of event.Records) {
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    const query = { query: { match: { key } } };
    const parsed = new url.URL(endpoint);
    const pathUrl = `/${index}/_delete_by_query`;
    const body = JSON.stringify(query);

    const signed = aws4.sign({
      host: parsed.hostname,
      path: pathUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: parsed.hostname,
        port: 443,
        path: pathUrl,
        method: 'POST',
        headers: signed.headers
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          if (res.statusCode < 300) resolve(data);
          else reject(new Error(`Delete error: ${res.statusCode} - ${data}`));
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
  return { statusCode: 200 };
};
