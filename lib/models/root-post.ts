import { ApiGatewayModel, apigateway } from './common';

export const RootPost: ApiGatewayModel = {
	name: 'CDKTestPostModel',
	schema: {
		"type": apigateway.JsonSchemaType.OBJECT,
		"additionalProperties": false,
		"required": [
			"name",
			"category",
			"id"
		],
		"properties": {
			"name": {
				"type": apigateway.JsonSchemaType.STRING,
				"maxLength": 50,
				"minLength": 3,
				"pattern": "^[a-zA-Z0-9]+$"
			},
			"category": {
				"type": apigateway.JsonSchemaType.STRING,
				"enum": [
					"Testing",
					"Production"
				]
			},
			"id": {
				"type": apigateway.JsonSchemaType.INTEGER,
				"maximum": 100,
				"minimum": 1
			}
		}
	}
}