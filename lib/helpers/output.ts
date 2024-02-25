import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class OutputHelper {
	scope: Construct;

	//constructor 
	constructor(scope: Construct) {
		this.scope = scope;
	}

    printOut(name: string, value: string): cdk.CfnOutput {
        return new cdk.CfnOutput(this.scope, name, {
            exportName: name,
            value: value
        });
    }
}