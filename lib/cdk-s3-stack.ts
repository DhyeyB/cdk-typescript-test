import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { CfnOutput } from "aws-cdk-lib";

export class S3BucketStack extends cdk.Stack {
  bucket: Bucket;
  bucketRef: CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, "test-bucket", {
      versioned: false,
      bucketName: "test-bucket",
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    console.log("abc", this.bucket.bucketArn);
    new cdk.CfnOutput(this, "bucketRef", {
      value: this.bucket.bucketArn,
    });
  }
}
