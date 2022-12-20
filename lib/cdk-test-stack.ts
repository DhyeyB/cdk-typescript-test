import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3assets from "aws-cdk-lib/aws-s3-assets";
import * as keypair from "cdk-ec2-key-pair";
import * as path from "path";

export class CdkTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // look up the default vpc
    const vpc = ec2.Vpc.fromLookup(this, "VPC", {
      isDefault: true
    });

    // Create a keypair to be used with this ec2 instance
    const key = new keypair.KeyPair(this, "KeyPair", {
      name: "cdk-keypair",
      description: "Key Pair created with cdk deployment"
    });
    key.grantReadOnPublicKey;

    // Security group for the ec2 instance
    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
      description: "Allow SSH (tcp port 22) and HTTP (TCP port 80) in",
      allowAllOutbound: true
    });

    // Allow SSH access on port TCP/22
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH access"
    );

    // Allow HTTP access on port TCP/80
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP access"
    );

    // IAM role to allow access to other AWS services
    const role = new iam.Role(this, "ec2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    // IAM policy attachment to allow access to
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    // Look up the AMI Id for the Amazon Linux 2 Image with CPU type x86_64
    const ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64
    });

    // Create the ec2 instance using the security group, AMI, and keypair defined.
    const ec2Instance = new ec2.Instance(this, "Instance", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ami,
      securityGroup: securityGroup,
      keyName: key.keyPairName,
      role: role
    });


    //  ---------  sample asset  ----------- //

    // Upload the sample app to s3 bucket
    const sampleAppAsset = new s3assets.Asset(this, "SampleAppAssset", {
      path: path.join(__dirname, "../../SampleApp")
    });

    // Allow EC2 instance to read the file
    sampleAppAsset.grantRead(role);

    // Download the file from s3 bucket and store the full location and filename as a veriable
    const sampleAppFilePath = ec2Instance.userData.addS3DownloadCommand({
      bucket: sampleAppAsset.bucket,
      bucketKey: sampleAppAsset.s3ObjectKey
    });

    // ------------  sample asset  ------------ //


    // ------------ config script  ------------ //

    // Upload the configuration file to s3
    const configScriptAsset = new s3assets.Asset(this, "ConfigScriptAsset", {
      path: path.join(__dirname, "../../SampleApp/configure_amz_linux_sample_app.sh")
    });

    // Allow EC2 insatance to read the script
    configScriptAsset.grantRead(ec2Instance.role);

    // Download the file from s3 bucket and store the full location and filename as a veriable
    const configScriptFilePath = ec2Instance.userData.addS3DownloadCommand({
      bucket: configScriptAsset.bucket,
      bucketKey: configScriptAsset.s3ObjectKey
    })

    // Add a line to the user data to execute the downloaded file
    ec2Instance.userData.addExecuteFileCommand({
      filePath: configScriptFilePath,
      arguments: sampleAppFilePath
    })

    //  ------------ config script  -----------  //


    //  -----------  output for connecting  -----------  //

    // Output the public IP address of the EC2 instance
    new cdk.CfnOutput(this, "IP Address", {
      value: ec2Instance.instancePublicIp,
    });

    // Command to download the SSH key
    new cdk.CfnOutput(this, "Download Key Command", {
      value:
        "aws secretsmanager get-secret-value --secret-id ec2-ssh-key/cdk-keypair/private --query SecretString --output text > cdk-key.pem && chmod 400 cdk-key.pem",
    });

    // Command to access the EC2 instance using SSH
    new cdk.CfnOutput(this, "ssh command", {
      value:
        "ssh -i cdk-key.pem -o IdentitiesOnly=yes ec2-user@" +
        ec2Instance.instancePublicIp,
    });

    //  ------------  output for connecting  -------------  //
  }
}
