import * as cdk from 'aws-cdk-lib';

export { aws_apigateway as apigateway } from 'aws-cdk-lib';

export interface ApiGatewayModel {
	name: string;
	schema: cdk.aws_apigateway.JsonSchema;
}