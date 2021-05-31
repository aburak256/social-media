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

    #Collect data for a specific conversation
    #Find the conversation metadata. Then collect messages with reverse index. Collect other user's information
    if "/conversations/{proxy+}" == event['resource']:
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
        else:
            return Fail

        conversationId = event['pathParameters']['proxy']
        try:
            conversationResponse = table.get_item(
                Key={'PK': 'CONVERSATION#' + conversationId, 'sortKey': 'METADATA'}
            )
        except ClientError as e:
            print(e.conversationResponse['Error']['Message'])
        else:
            if 'Item' in conversationResponse:
                #Check if user is one of the members of this conversation
                if user == conversationResponse['Item']['user1'] or user == conversationResponse['Item']['user2']:
                    #Collect messages
                    try:
                        messagesResponse = table.query(
                            KeyConditionExpression=Key('PK').eq('CONVERSATION#' + conversationId),
                            ScanIndexForward = False
                        )
                    except ClientError as e:
                        print(e.messagesResponse['Error']['Message'])
                    else:
                        messages = []
                        for item in messagesResponse['Items']:
                            if item['sortKey'] != 'METADATA':
                                dateTimeMessage = datetime.strptime(item['sortKey'], '%Y-%m-%dT%H:%M:%S.%f')
                                dateTime = dateTimeMessage.strftime("%m/%d/%Y, %H:%M:%S")
                                messageObject = {
                                        'seen' : item['seen'],
                                        'dateTime': dateTime,
                                        'text': item['text'],
                                        'reply': item['reply']
                                    }
                                if item['sender'] == user:
                                    messageObject['sender'] = 'user'
                                else:
                                    messageObject['sender'] = 'friend'
                                    item['seen'] = 'True'
                                    table.put_item(Item=item)
                                messages.append(messageObject)

                        #Collect other user's information
                        if user == conversationResponse['Item']['user1']: otherUser = conversationResponse['Item']['user2']
                        else: otherUser = conversationResponse['Item']['user1'] 
                        try:
                            userResponse = table.get_item(
                                Key={'PK': 'USER#' + otherUser, 'sortKey': 'METADATA'}
                            )
                        except ClientError as e:
                            print(e.userResponse['Error']['Message'])
                        else:
                            if 'Item' in userResponse:
                                #Found other user is exist. Add user's information to response
                                imageUrl = None
                                if 'Image' in userResponse['Item']: imageUrl = userResponse['Item']['image']
                                userInfo = {
                                    'username': userResponse['Item']['userName'],
                                    'image': imageUrl,
                                }
                            else:
                                return Fail

                            res = {'userInfo': userInfo, 'messages': messages}
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



            else:
                return Fail


    
    #Collect list of conversations of given user
    elif "/conversations" in event['resource']:
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
                'conversationId':  conversation['conversationId']
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

