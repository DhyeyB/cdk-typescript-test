import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import { S3BucketStack } from "../lib/cdk-s3-stack";
import * as s3 from "aws-cdk-lib/aws-s3";

export class PolicyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketObj = new S3BucketStack(this, "S3BucketStack");

    console.log("abcd", bucketObj.bucket.bucketArn);

    const bucketPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal("lambda.amazonaws.com")],
          actions: ["s3:GetObject"],
          resources: [bucketObj.bucket.bucketArn],
        }),
      ],
    });
  }
}
