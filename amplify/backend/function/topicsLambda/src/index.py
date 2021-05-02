import json
import boto3
from boto3.dynamodb.conditions import Key


dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table('SingleTableDesign')

def handler(event, context):
    print('received event:')
    print(event)
    path = event['resource']

    if event['resource'] == "/topics":
        resp = table.scan(
            # Scanning because in this GSI there are only few elements
            IndexName="topic-index",
        )

        print(resp['Items'])
        response = {
            'statusCode': 200,
            'body': json.dumps(resp['Items']),
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
        }

        return response

    if "/topics" in event['resource']:
        params = event['pathParameters']
        topic = params['proxy']
        resp = table.query(
            KeyConditionExpression=Key('PK').eq("TOPIC#" + topic + "#POST")
        )

        print(resp['Items'])
        posts = []
        for item in resp['Items']:
            response = table.query(
                KeyConditionExpression=Key('PK').eq("POST#" + item['postId'])
        )
            posts.append(response['Items'][0])
        
        print(posts)
        response = {
            'statusCode': 200,
            'body': json.dumps(posts),
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
        }

        return response

  
    return {
        'statusCode': 404,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps("Couldn't find the request")
    }