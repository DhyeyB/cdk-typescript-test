#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkTestStack } from '../lib/cdk-test-stack';
import { S3BucketStack } from '../lib/cdk-s3-stack';
import { PolicyStack } from '../lib/cdk-policy-stack';

const app = new cdk.App();
new CdkTestStack(app, 'CdkTestStack', {

  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

});

// new S3BucketStack(app, 'S3BucketStack');

new PolicyStack(app, 'PolicyStack');