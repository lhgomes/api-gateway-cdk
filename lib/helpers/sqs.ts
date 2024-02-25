import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TagHelper } from './tag';

export class SqsHelper {
	static createQueue(scope: Construct, queueName: string, tags?: Map<string, string>,
		retentionPeriodDays: number = 14,
		visibilityTimeoutSeconds: number = 60): Queue { 
			
		return new Queue(scope, queueName, {
			tags: tags,
			queueName: queueName,
			retentionPeriod: cdk.Duration.days(retentionPeriodDays),
			visibilityTimeout: cdk.Duration.seconds(visibilityTimeoutSeconds)
		});
	}
}

export class Queue extends cdk.aws_sqs.Queue {
    constructor(scope: Construct, id: string, props: QueueProps) {
		super(scope, id, props);

		const cfnSQS = this.node.defaultChild as cdk.aws_sqs.CfnQueue;
		TagHelper.setTags(cfnSQS.tags, props.tags);

		return this
    }
}

export interface QueueProps extends cdk.aws_sqs.QueueProps {
    tags?: Map<string, string>;
}