import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError 
from datetime import date, datetime
import uuid
import urllib.parse

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
s3_client = boto3.client('s3')
table = dynamodb.Table('SingleTableDesign')
bucket = "smapp-image131342-dev"

Fail = {
            'statusCode': 404,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps("Couldn't find the request")
        }


def handler(event, context):
    print('received event:')
    print(event)

    if 'resource' in event:
        path = event['resource']
    else:
        return Fail

    if "/timeline" == event['resource']:
        #Collect user's links of posts from USER#<userid>#TIMELINE#POST
        #Collect the actual posts and return
        #Check user's auth.
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
        else:
            return Fail


        #Collect post links
        if event['queryStringParameters'] != None:
            #Collect posts starting from last post
            postRes = table.get_item(
                Key={'PK': 'POST#' + event['queryStringParameters']['paginator'], 'sortKey': 'METADATA'}
            )
            post = postRes['Item']
            postLinks = table.query(
                KeyConditionExpression=Key('PK').eq('USER#' + user + '#TIMELINE#POST'),
                ScanIndexForward=False,
                Limit=30,
                ExclusiveStartKey={
                    'PK': 'USER#' + user + '#TIMELINE#POST',
                    'sortKey': post['dateTime']
                }
            )
            if 'LastEvaluatedKey' in postLinks:
                cont = 'True'
            else:
                cont = 'False'    
        else:
            try:
                postLinks = table.query(
                    KeyConditionExpression=Key('PK').eq('USER#' + user + '#TIMELINE#POST'),
                    ScanIndexForward=False,
                    Limit=30
                )
            except ClientError as e:
                print(e.postLinks['Error']['Message'])
            else:
                if 'LastEvaluatedKey' in postLinks:
                    cont = 'True'
                else:
                    cont = 'False'  
        posts = []
        if 'Items' in postLinks and len(postLinks['Items']) >= 1:
            for postLink in postLinks['Items']:
                #Collect original post's data
                try:
                    postResponse = table.get_item(
                        Key={'PK': 'POST#' + postLink['postId'], 'sortKey': 'METADATA'}
                    )
                except ClientError as e:
                    print(e.postResponse['Error']['Message'])
                else:
                    if 'Item' in postResponse:
                        postObject = {}
                        for info in postResponse['Item']:
                            if info == 'PK' or info == 'sortKey':
                                continue
                            elif info =='dateTime':
                                dateTimePost = datetime.strptime(postResponse['Item'][info], '%Y-%m-%dT%H:%M:%S.%f')
                                postObject['dateTime'] = dateTimePost.strftime("%m/%d/%Y, %H:%M:%S")
                            else:
                                postObject[info] = postResponse['Item'][info]
                        #Check if user liked or disliked before
                        try:
                            reactionResponse = table.query(
                                KeyConditionExpression=Key('PK').eq('POST#' + postLink['postId'] + '#REACTION#' + user)
                            )
                        except ClientError as e:
                            print(e.reactionResponse['Error']['Message'])
                        else:
                            if 'Items' in reactionResponse and len(reactionResponse['Items']) >= 1:
                                postObject['Reaction'] = reactionResponse['Items'][0]['text']
                            posts.append(postObject)
            
            res={'posts': posts, 'cont': cont}
            
        else:
            res={'FailMessage': 'There are no posts here'}

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
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps("Couldn't understand your request")
    }