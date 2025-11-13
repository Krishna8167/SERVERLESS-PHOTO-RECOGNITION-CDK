#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PhotoStack } from '../lib/photo-stack';

const app = new cdk.App();
new PhotoStack(app, 'ServerlessPhotoRecognitionStack', {
  // You can define environment if needed:
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
