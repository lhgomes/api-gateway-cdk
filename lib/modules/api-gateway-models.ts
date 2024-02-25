import * as cdk from 'aws-cdk-lib';

export interface ApiGatewayModel {
	name: string;
	schema: cdk.aws_apigateway.JsonSchema;
}

export class ApiGatewayModels {
	static postModel: ApiGatewayModel = {
		name: 'CDKTestPostModel',
		schema: {
			"type": cdk.aws_apigateway.JsonSchemaType.OBJECT,
			"additionalProperties": false,
			"required": [
				"name",
				"category",
				"id"
			],
			"properties": {
				"name": {
					"type": cdk.aws_apigateway.JsonSchemaType.STRING,
					"maxLength": 50,
					"minLength": 3,
					"pattern": "^[a-zA-Z0-9]+$"
				},
				"category": {
					"type": cdk.aws_apigateway.JsonSchemaType.STRING,
					"enum": [
						"Testing",
						"Production"
					]
				},
				"id": {
					"type": cdk.aws_apigateway.JsonSchemaType.INTEGER,
					"maximum": 100,
					"minimum": 1
				}
			}
		}
	}
}