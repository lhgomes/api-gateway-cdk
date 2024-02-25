# API Gateway CDK

Create an Amazon API Gateway REST API that integrates with a Lambda function and also with Amazon SNS and Amazon SQS to implement Topic-Queue-Chaining

This CDK application demonstrates how to set up a topic-queue-chaining pattern using Amazon SNS and Amazon SQS behind an Amazon API Gateway. 
This architecture helps in setting up a highly scalable API that can consume messages/events, fan them out and process them asynchronously. 

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

## Requirements

* [Create an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) if you do not already have one and log in. The IAM user that you use must have sufficient permissions to make necessary AWS service calls and manage AWS resources.
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) installed and configured
* [Git Installed](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [Node and NPM](https://nodejs.org/en/download/) installed
* [AWS Cloud Development Kit](https://docs.aws.amazon.com/cdk/latest/guide/cli.html) (AWS CDK) installed

## Deployment Instructions

1. Create a new directory, navigate to that directory in a terminal and clone the GitHub repository:
    ``` 
    git clone https://github.com/lhgomes/api-gateway-cdk
    ```

2. Change directory to the pattern directory:
    ```
    cd api-gateway-cdk
    ```

3. Install dependencies:
    ```
    npm install
    ```

4. Compile typescript to js:
    ```
    npm run build
    ```

5. [Configure your AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) to point to the AWS account where you want to deploy the solution.

6. If you are using CDK to deploy to your AWS account for the first time, you will have to install the CDK toolkit stack in your account. 
To do this run the command:
    ```
        cdk bootstrap aws://{{your-aws-account-number}}/{{awregion}}
    ```
    Ex: 'cdk bootstrap aws://135xxxyyyzzz/us-west-2'

7. Deploy the stack
    ```
    cdk deploy --parameters emailSubscription=test@email.com
    ```

## How it works

This CDK application deploys an Amazon API Gateway REST API with two methods:

* GET - Integrates with a [Lambda function](lambda/hello.js) using proxy
* POST - Validate and publish the payload to an SNS Topic. The SNS topic fans out these requests to a SQS Queue and to an email.

Sample Payload:
```
{
    "name":"TestMessage",
    "category":"Testing",
    "id":1
}
```

[JsonSchema](lib/modules/api-gateway-models.ts) used to validate the payload:
```
{
    "type": "object",
    "additionalProperties": false,
    "required": [
        "name",
        "category",
        "id"
    ],
    "properties": {
        "name": {
            "type": "string",
            "maxLength": 50,
            "minLength": 3,
            "pattern": "^[a-zA-Z0-9]+$"
        },
        "category": {
            "type": "string",
            "enum": [
                "Testing",
                "Production"
            ]
        },
        "id": {
            "type": "integer",
            "maximum": 100,
            "minimum": 1
        }
    }
}
```

## Testing

1. Get Rest API Endpoint from stack output
```
    RESTAPI_ENDPOINT=$(aws cloudformation describe-stacks \
        --stack-name ApiGatewayCdkStack \
        --query "Stacks[0].Outputs[?OutputKey=='CDKTestApiEndpoint'].OutputValue" \
        --output text)
```

2. Get API Key from stack output
```
    RESTAPI_APIKEY=$(aws cloudformation describe-stacks \
        --stack-name ApiGatewayCdkStack \
        --query "Stacks[0].Outputs[?OutputKey=='CDKTestApiKeyValue'].OutputValue" \
        --output text)
```

3. Send a sample request to the API GET endpoint
```
    curl -H "Content-Type: application/json" \
        -H "x-api-key: $RESTAPI_APIKEY" \
        -X GET \
        $RESTAPI_ENDPOINT
```

4. Send a sample request to the API POST endpoint
```
    curl -H "Content-Type: application/json" \
        -H "x-api-key: $RESTAPI_APIKEY" \
        -X POST \
        -d '{"name": "TestMessage", "category": "Testing", "id": 1}' \
        $RESTAPI_ENDPOINT
```

5. Get the SQS Queue Url
```
    SQS_QUEUEURL=$(aws sqs get-queue-url \
        --queue-name CDKTestQueue \
        --output text)
```

6. Get the message from SQS
```
    aws sqs receive-message --queue-url $SQS_QUEUEURL
```


## Cleanup
 
Run the following command to delete all the resources from your AWS account.
```
cdk destroy
```

----