import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError 


dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table('SingleTableDesign')

def handler(event, context):
    print('received event:')
    print(event)
    if 'resource' in event:
        path = event['resource']
    else:
        return {
            'statusCode': 404,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps("Couldn't find the request")
        }

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
        permission = 'Reader'
        user = None
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]

        print(resp['Items'])
        posts = []
        for item in resp['Items']:
            response = table.query(
                KeyConditionExpression=Key('PK').eq("POST#" + item['postId'])
        )
            post = response['Items'][0]
            if user != None:      
                try:
                    likeResponse = table.query(
                        KeyConditionExpression=Key('PK').eq("POST#" + post['postId'] + "#REACTION#" + user)
                    )
                except ClientError as e:
                    print(e.likeResponse['Error']['Message'])
                else:
                    if len(likeResponse['Items']) != 0:
                        Reaction = likeResponse['Items'][0]['text']      
                        post['Reaction'] = Reaction
                    try:
                        permissionResponse = table.get_item(
                            Key={'PK': 'USER#' + user + '#PERMISSION', 'sortKey': topic}
                        )
                    except ClientError as e:
                        print(e.permissionResponse['Error']['Message'])
                    else:
                        if permissionResponse['Item']['text'] == 'Success':
                            permission = 'Writer'
                            
            posts.append(post)
        
        res = {'posts': posts, 'permission': permission}
        response = {
            'statusCode': 200,
            'body': json.dumps(res),
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