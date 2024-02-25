import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TagHelper } from './tag';

export class LambdaHelper {
	static createFunction(scope: Construct, lambdaName: string, handlerName: string, 
		tags?: Map<string, string>, policies?: Array<cdk.aws_iam.Policy>, timeoutSeconds: number = 60): Function { 

		return new Function(scope,
			lambdaName.concat('-handler'), {
				tags: tags,
				policies: policies,
				runtime: cdk.aws_lambda.Runtime.NODEJS_LATEST,
				code: cdk.aws_lambda.Code.fromAsset('lambda'),
				handler: handlerName,
				functionName: lambdaName,
				timeout: cdk.Duration.seconds(timeoutSeconds),
				architecture: cdk.aws_lambda.Architecture.ARM_64
			}
		);
	}
}

export class Function extends cdk.aws_lambda.Function {
	constructor(scope: Construct, id: string, props: FunctionProps) {
		super(scope, id, props);

		const role = new cdk.aws_iam.Role(scope, id.concat('-role'), {
			assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
			managedPolicies: [
				cdk.aws_iam.ManagedPolicy.fromManagedPolicyArn(scope, 
					id.concat('-AWSLambdaBasicExecutionRole'),
					 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole')
				]
		});

		this.addPermission(id.concat('-permission'), {
            principal: new cdk.aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
			action: "lambda:InvokeFunction",
            sourceArn: cdk.Fn.join(':', ['arn', 
                'aws',
                'execute-api',
                cdk.Stack.of(scope).region,
                cdk.Stack.of(scope).account,
                '*/*/*/*'
            ])
		});

		if (props.policies != undefined) {			
			props.policies.forEach(function(policy) {
				policy.attachToRole(role)
			});
		}

		const cfnLambda = this.node.defaultChild as cdk.aws_lambda.CfnFunction;
		TagHelper.setTags(cfnLambda.tags, props.tags);

		return this;
	}
}

export interface FunctionProps extends cdk.aws_lambda.FunctionProps {
	tags?: Map<string, string>;
	policies?: Array<cdk.aws_iam.Policy>
}