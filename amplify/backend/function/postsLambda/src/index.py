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

    if "/posts" in event['resource']:
        params = event['pathParameters']
        postId = params['proxy']
        user = None
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
        print(user)
        try:
            response = table.get_item(Key={'PK': "POST#" + postId, 'sortKey': "METADATA"})
        except ClientError as e:
            print(e.response['Error']['Message'])
        else:
            post = []
            post.append(response['Item'])
            if user != None:
                try:
                    likeResponse = table.query(
                        KeyConditionExpression=Key('PK').eq("POST#" + postId + "#REACTION#" + user)
                    )
                except ClientError as e:
                    print(e.likeResponse['Error']['Message'])
                else:
                    if len(likeResponse['Items']) != 0:
                        Reaction = likeResponse['Items'][0]['text']      
                        post[0]['Reaction'] = Reaction
            comments = []
            try :
                commentsResponse = table.query(
                    KeyConditionExpression=Key('PK').eq("POST#" + postId + "#COMMENT")
                )
            except ClientError as e:
                print(e.commentsResponse['Error']['Message'])
            else:
                for commentId in commentsResponse['Items']:
                    try :
                        comment = table.get_item(Key={'PK': "COMMENT#" + commentId['commentId'], 'sortKey': "METADATA"})
                    except ClientError as e:
                        print(e.comment['Error']['Message'])
                    else:
                        comments.append(comment['Item'])
        
        print(post, comments)
        res = {'post': post, 'comments':comments}
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