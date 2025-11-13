import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as destinations from 'aws-cdk-lib/aws-s3-notifications';
import * as path from 'path';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';

export class PhotoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'PhotoBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // OpenSearch Domain (Dev-friendly config)
    const domain = new opensearch.Domain(this, 'PhotoSearchDomain', {
      version: opensearch.EngineVersion.OPENSEARCH_2_3,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      capacity: {
        dataNodes: 1,
        dataNodeInstanceType: 't3.small.search',
      },
      ebs: { volumeSize: 10 },
      nodeToNodeEncryption: true,
      encryptionAtRest: { enabled: true },
    });

    // Lambda role and policy
    const lambdaRole = new iam.Role(this, 'LambdaExecRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );

    // Grant permissions
    bucket.grantRead(lambdaRole);

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['rekognition:DetectLabels'],
        resources: ['*'],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['es:ESHttpPost', 'es:ESHttpPut', 'es:ESHttpDelete', 'es:ESHttpGet'],
        resources: [`${domain.domainArn}/*`],
      })
    );

    // Indexer Lambda
    const indexer = new lambda.Function(this, 'IndexerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'indexer')),
      environment: {
        OPENSEARCH_ENDPOINT: domain.domainEndpoint,
        BUCKET: bucket.bucketName,
        INDEX: 'photos',
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
    });

    // Delete Lambda
    const deleter = new lambda.Function(this, 'DeleteFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'delete')),
      environment: {
        OPENSEARCH_ENDPOINT: domain.domainEndpoint,
        INDEX: 'photos',
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(20),
    });

    // Search Lambda
    const searchFn = new lambda.Function(this, 'SearchFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'search')),
      environment: {
        OPENSEARCH_ENDPOINT: domain.domainEndpoint,
        BUCKET: bucket.bucketName,
        INDEX: 'photos',
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
    });

    // S3 notifications
    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new destinations.LambdaDestination(indexer));
    bucket.addEventNotification(s3.EventType.OBJECT_REMOVED, new destinations.LambdaDestination(deleter));

    // API Gateway + Cognito
    const userPool = new cognito.UserPool(this, 'PhotoUserPool', {
      selfSignUpEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'AppClient', {
      userPool,
      generateSecret: false,
    });

    const api = new apigw.RestApi(this, 'PhotoApi', {
      restApiName: 'PhotoService',
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    });

    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    const pictures = api.root.addResource('picture');
    const search = pictures.addResource('search');

    const searchIntegration = new apigw.LambdaIntegration(searchFn);
    search.addMethod('POST', searchIntegration, {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
    new cdk.CfnOutput(this, 'OpenSearchEndpoint', { value: domain.domainEndpoint });
    new cdk.CfnOutput(this, 'ApiUrl', { value: `${api.url}picture/search` });
    new cdk.CfnOutput(this, 'CognitoUserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'CognitoClientId', { value: userPoolClient.userPoolClientId });
  }
}
