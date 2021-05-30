import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError 
from datetime import datetime
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
    #Collect list of conversations of given user
    if "/conversations" in event['resource']:
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
        else:
            return Fail
    try:
        conversationsResponse = table.query(
            KeyConditionExpression=Key('PK').eq('USER#' + user + '#CONVERSATION'),
            ScanIndexForward = False
        )
    except ClientError as e:
        print(e.conversationsResponse['Error']['Message'])
        return Fail
    else:
        conversations = []
        for conversation in conversationsResponse['Items']:
            #Collect last sended messages dateTime of selected conversation.
            dateTimeComment = datetime.strptime(conversation['sortKey'], '%Y-%m-%dT%H:%M:%S.%f')
            dateTime = dateTimeComment.strftime("%m/%d/%Y, %H:%M:%S")
            returnObject = {
                'dateTime': dateTime,
            }

            #Collect last message sended in that conversation
            try:
                lastMessage = table.query(
                    KeyConditionExpression=Key('PK').eq('CONVERSATION#' + conversation['conversationId']),
                    ScanIndexForward = False,
                    Limit=2
                )
            except ClientError as e:
                print(e.lastMessage['Error']['Message'])
                return Fail
            else:
                if 'Items' in lastMessage:
                    for item in lastMessage['Items']:
                        if item['sortKey'] != 'METADATA':
                            returnObject['lastMessage'] = item['text']
            
            #Collect other user's information
            print(conversation['otherUser'])
            try:
                otherUser = table.get_item(
                    Key={'PK': 'USER#' + conversation['otherUser'], 'sortKey':'METADATA'}
                )
            except ClientError as e:
                print(e.otherUser['Error']['Message'])
                return Fail
            else:
                if 'Item' in otherUser:
                    #Found the other user's metadata item. Return user's profile image and username
                    if 'profileImage' in otherUser['Item']:
                        returnObject['image'] = otherUser['Item']['profileImage']
                    
                    if 'userName' in otherUser['Item']:
                        returnObject['userName'] = otherUser['Item']['userName']
                    else:
                        return Fail
            conversations.append(returnObject)
        
        res = {'conversations': conversations}
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

