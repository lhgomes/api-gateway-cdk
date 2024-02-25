import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export type MethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class Supress {
    public id: string;
    public reason: String;

    constructor(id: string, reason: String) {
        this.id = id;
        this.reason = reason;
	}
}

export class Statement extends cdk.aws_iam.PolicyStatement {
    constructor(actions: Array<string>, resources: Array<string>, effect: cdk.aws_iam.Effect = cdk.aws_iam.Effect.ALLOW) {
        super({
            actions: actions,
            effect: effect,
            resources: resources,
        })
    }
}

export class ApiGatewayStatement extends Statement {
    constructor(method: MethodType, resource: Array<string>, effect: cdk.aws_iam.Effect = cdk.aws_iam.Effect.ALLOW) {
        super(['apigateway:'.concat(method)], resource, effect);
	}
}

export class core {
	scope: Construct;

	//constructor 
	constructor(scope: Construct) {
		this.scope = scope;
	}

    Declare(policyName: string, statements: Array<cdk.aws_iam.PolicyStatement>, supress?: Array<Supress>, condition?: any): cdk.aws_iam.Policy {
        const policy = new cdk.aws_iam.Policy(this.scope, policyName, {
            statements: statements
        });

        if (supress != undefined) {
            const cfnPolicy = policy.node.defaultChild as cdk.aws_iam.CfnPolicy;

            let rules_to_suppress: { id: any; reason: any; }[] = [];    
            supress.forEach(function(item){  
                rules_to_suppress.push({
                    id: item.id,
                    reason: item.reason
                })  
            });  

            cfnPolicy.cfnOptions.metadata = {
                cfn_nag: {
                    rules_to_suppress: rules_to_suppress
                }            
            }
        }

        return policy;
    }
}