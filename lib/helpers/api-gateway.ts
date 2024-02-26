import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TagHelper } from './tag';
import { Utility } from '../modules/utility';
import { ApiGatewayModel } from '../models/common';

export type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiHelper {
	static createRestApi(scope: Construct, restApiName: string, props: RestApiProps): RestApi {
		return new RestApi(scope, restApiName, props);
	}
}

export class RestApi extends cdk.aws_apigateway.RestApi {
	private enableCors: boolean;
	private apiKeyValue$: string;
	private usagePlan$: cdk.aws_apigateway.UsagePlan;
	private requestValidator: cdk.aws_apigateway.RequestValidator;

	get usagePlan() {
		return this.usagePlan$;
	}

	get apiKeyValue() {
		return this.apiKeyValue$;
	}

	constructor(scope: Construct, restApiName: string, props: RestApiProps) {
			super(scope, restApiName, props);

		this.enableCors = props.enableCors;

		this.requestValidator = this.addRequestValidator(restApiName.concat('-request-validator'), {
			requestValidatorName: 'BodyRequestValidator',
			validateRequestBody: true,
			validateRequestParameters: false
		});

		this.usagePlan$ = this.addUsagePlan(restApiName.concat('UsagePlan'), {
			name: restApiName.concat('UsagePlan')
		});

		this.usagePlan.addApiStage({
			stage: this.deploymentStage,
		});

		if (props.requestApiKey) {
			this.apiKeyValue$ = Utility.makeString();

			const apiKey = new cdk.aws_apigateway.ApiKey(scope, restApiName.concat('-apikey'), {
				description: restApiName.concat(' Api Key'),
				generateDistinctId: false
			});

			const cfnApiKey = apiKey.node.defaultChild as cdk.aws_apigateway.CfnApiKey;
			cfnApiKey.value = this.apiKeyValue;

			this.usagePlan.addApiKey(apiKey);
		}

		const cfnRestApi = this.node.defaultChild as cdk.aws_apigateway.CfnRestApi;
		TagHelper.setTags(cfnRestApi.tags, props.tags);

		return this;
	}

	addResource(parent: cdk.aws_apigateway.IResource, name: string): cdk.aws_apigateway.Resource {
		const resource = parent.addResource(name);

		if (this.enableCors) {
			const integration = new cdk.aws_apigateway.Integration({
				type: cdk.aws_apigateway.IntegrationType.MOCK,
				options: {
					passthroughBehavior: cdk.aws_apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
					requestTemplates: {
						"application/json": "{\"statusCode\": 200}"
					},
					integrationResponses: [
						{
							statusCode: "200",
							responseParameters: {
								"method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
								"method.response.header.Access-Control-Allow-Origin": "'*'",
								"method.response.header.Access-Control-Allow-Methods": "'OPTIONS,GET,POST'"
							},
							responseTemplates: {
								"application/json": "{ statusCode: 200 }"
							}
						}
					]
				}
			});

			resource.addMethod("OPTIONS", integration, {
				methodResponses: [
					{
						statusCode: "200",
						responseModels: {
							"application/json": cdk.aws_apigateway.Model.EMPTY_MODEL
						},
						responseParameters: {
							"method.response.header.Access-Control-Allow-Headers": true,
							"method.response.header.Access-Control-Allow-Origin": true,
							"method.response.header.Access-Control-Allow-Methods": true
						}
					}
				]
			});
		}

		return resource;
	}

	addJsonModel(model: ApiGatewayModel): cdk.aws_apigateway.Model {
		return super.addModel(model.name, {
			contentType: 'application/json',
			description: 'Model '.concat(model.name),
			modelName: model.name,
			schema: model.schema
		});
	}

	addLambdaIntegration(handler: cdk.aws_lambda.IFunction): cdk.aws_apigateway.LambdaIntegration {
		const integrationResponses = [
			{
				statusCode: "200",
				responseTemplates: {
					"application/json": "Empty"
				}
			}
		];

		return new cdk.aws_apigateway.LambdaIntegration(handler, {
			proxy: true,
			allowTestInvoke: true,
			contentHandling: cdk.aws_apigateway.ContentHandling.CONVERT_TO_TEXT,
			integrationResponses: integrationResponses,
			passthroughBehavior: cdk.aws_apigateway.PassthroughBehavior.WHEN_NO_MATCH
		})
	}

	addMethodWithBody(resource: cdk.aws_apigateway.Resource, handler: cdk.aws_lambda.IFunction,
		methodType: MethodType, bodyModel: cdk.aws_apigateway.Model): cdk.aws_apigateway.Method {

		const lambdaIntegration = this.addLambdaIntegration(handler);

		return resource.addMethod(methodType, lambdaIntegration, {
			apiKeyRequired: true,
			operationName: handler.functionName,
			requestModels: {
				'application/json': bodyModel
			},
			requestValidator: this.requestValidator
		});
	}

	addMethod(resource: cdk.aws_apigateway.IResource, handler: cdk.aws_lambda.IFunction,
		methodType: MethodType): cdk.aws_apigateway.Method {

		const lambdaIntegration = this.addLambdaIntegration(handler);

		return resource.addMethod(methodType, lambdaIntegration, {
			apiKeyRequired: true,
			operationName: handler.functionName
		});
	}

	addSNSIntegration(resource: cdk.aws_apigateway.IResource, topic: cdk.aws_sns.ITopic, 
		bodyModel: cdk.aws_apigateway.Model): cdk.aws_apigateway.Method  {
		const gatewayExecutionRole = new cdk.aws_iam.Role(this, this.restApiName.concat('-role'), {
			assumedBy: new cdk.aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
			managedPolicies: [
				cdk.aws_iam.ManagedPolicy.fromManagedPolicyArn(this,
					this.restApiName.concat('-AmazonAPIGatewayPushToCloudWatchLogs'),
					'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs')
			]
		});
		topic.grantPublish(gatewayExecutionRole);

		return resource.addMethod('POST',
			new cdk.aws_apigateway.AwsIntegration({
				service: 'sns',
				integrationHttpMethod: 'POST',
				path: '/',
				options: {
					credentialsRole: gatewayExecutionRole,
					passthroughBehavior: cdk.aws_apigateway.PassthroughBehavior.NEVER,
					requestParameters: {
						"integration.request.header.Content-Type": `'application/x-www-form-urlencoded'`,
					},
					requestTemplates: {
						"application/json": `Action=Publish&TopicArn=${topic.topicArn}&Message=$util.urlEncode($input.body)`
					},
					integrationResponses: [
						{
							statusCode: "200",
							responseTemplates: {
								"application/json": `{"status": "message added to topic"}`,
							},
						},
						{
							statusCode: "400",
							selectionPattern: "^\[Error\].*",
							responseTemplates: {
								"application/json": `{\"state\":\"error\",\"message\":\"$util.escapeJavaScript($input.path('$.errorMessage'))\"}`,
							},
						}
					],
				}
			}),
			{
				methodResponses: [{ statusCode: "200" }, { statusCode: "400" }],
				apiKeyRequired: true,
				requestModels: {
					'application/json': bodyModel
				},
				requestValidator: this.requestValidator
			}
		);
	}
}

export interface RestApiProps extends cdk.aws_apigateway.RestApiProps {
    tags?: Map<string, string>;
	enableCors: boolean;
	requestApiKey: boolean;
}