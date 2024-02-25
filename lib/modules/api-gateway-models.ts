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
				"type"
			],
			"properties": {
				"type": {
					"type": cdk.aws_apigateway.JsonSchemaType.STRING,
					"enum": [
						"FactSheetUpdatedEvent",
						"FactSheetCreatedEvent",
						"FactSheetArchivedEvent",
						"FactSheetDeletedEvent"
					]
				},
				"factSheet": {
					"type": cdk.aws_apigateway.JsonSchemaType.OBJECT,
					"properties": {
						"type": {
							"type": cdk.aws_apigateway.JsonSchemaType.STRING,
							"enum": [
								"Project",
								"Application"
							]
						}
					},
					"required": [
						"type"
					]
				},
			}
		}
	}
}