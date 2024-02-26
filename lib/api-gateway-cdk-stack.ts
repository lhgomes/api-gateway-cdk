import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { RootPost } from './models';
import { ApiHelper, LambdaHelper, SqsHelper, SnsHelper, OutputHelper } from './helpers';

export class ApiGatewayCdkStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);
		this.templateOptions.description = 'API Gateway CDK Test';

		const emailSubscription = new cdk.CfnParameter(this, 'emailSubscription');

		const tags: Map<string, string> = new Map([
			['PROJECT', 'CDKTest'],
			['VERSION', '1']
		]);

		const apiGateway = ApiHelper.createRestApi(this, 'CDKTestApi', {
			enableCors: true,
			tags: tags,
			requestApiKey: true,
			description: this.templateOptions.description
		});

		const lambdaFunction = LambdaHelper.createFunction(this, 'CDKTestLambda', 'hello.handler', tags);
		apiGateway.addMethod(apiGateway.root, lambdaFunction, 'GET');

		const sqsQueue = SqsHelper.createQueue(this, 'CDKTestQueue', tags);
		const snsTopic = SnsHelper.createTopicWithSqsSubscription(this, 'CDKTestTopic', sqsQueue, tags);
		snsTopic.addEmailSubscription(emailSubscription.valueAsString);

		const postModel = apiGateway.addJsonModel(RootPost);
		apiGateway.addSNSIntegration(apiGateway.root, snsTopic, postModel);

		const outputHelper = new OutputHelper(this);
		outputHelper.printOut('CDKTestApiEndpoint', apiGateway.url);
		outputHelper.printOut('CDKTestApiId', apiGateway.restApiId);
		outputHelper.printOut('CDKTestApiKeyValue', apiGateway.apiKeyValue);
	}
}
