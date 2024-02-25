import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TagHelper } from './tag';

export class SnsHelper {
	static createTopic(scope: Construct, topicName: string, tags?: Map<string, string>): Topic { 
		return new Topic(scope, topicName, {
            topicName: topicName,
            displayName: topicName,
            tags: tags
		});
	}

    static createTopicWithEmailSubscription(scope: Construct, topicName: string, email: string, tags?: Map<string, string>): Topic {
        const sns = this.createTopic(scope, topicName, tags);
        sns.addSubscription(new cdk.aws_sns_subscriptions.EmailSubscription(email));
        return sns;
    }

    static createTopicWithLambdaSubscription(scope: Construct, topicName: string, lambda: cdk.aws_lambda.Function, tags?: Map<string, string>): Topic {
        const sns = this.createTopic(scope, topicName, tags);
        sns.addSubscription(new cdk.aws_sns_subscriptions.LambdaSubscription(lambda));
        return sns;
    }

    static createTopicWithSqsSubscription(scope: Construct, topicName: string, sqs: cdk.aws_sqs.Queue, tags?: Map<string, string>): Topic {
        const sns = this.createTopic(scope, topicName, tags);
        sns.addSubscription(new cdk.aws_sns_subscriptions.SqsSubscription(sqs));
        return sns;
    }
}

export class Topic extends cdk.aws_sns.Topic {
    constructor(scope: Construct, id: string, props: TopicProps) {
		super(scope, id, props);

        const cfnTopic = this.node.defaultChild as cdk.aws_sns.CfnTopic;
		TagHelper.setTags(cfnTopic.tags, props.tags);
    }

    public addSqsSubscription(sqs: cdk.aws_sqs.Queue, rawMessageDelivery: boolean = true) {
        this.addSubscription(new cdk.aws_sns_subscriptions.SqsSubscription(sqs, {
            rawMessageDelivery: rawMessageDelivery
        }));
    }

    public addLambdaSubscription(lambda: cdk.aws_lambda.Function) {
        this.addSubscription(new cdk.aws_sns_subscriptions.LambdaSubscription(lambda));
    }

    public addEmailSubscription(email: string) {
        this.addSubscription(new cdk.aws_sns_subscriptions.EmailSubscription(email));
    }    
}

export interface TopicProps extends cdk.aws_sns.TopicProps {
    tags?: Map<string, string>;
}