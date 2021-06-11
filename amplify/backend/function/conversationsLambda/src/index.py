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

    if event['httpMethod'] == 'POST':
        return postHandler(event, context)

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
                    if event['queryStringParameters'] != None:
                        dateTimeConvert = datetime.strptime(event['queryStringParameters']['paginator'], "%m/%d/%Y, %H:%M:%S").isoformat()
                        mesRes = table.query(
                            KeyConditionExpression=Key('PK').eq('CONVERSATION#' + conversationId) & Key('sortKey').begins_with(dateTimeConvert)
                        )
                        message = mesRes['Items'][0]
                        messagesResponse = table.query(
                            KeyConditionExpression=Key('PK').eq('CONVERSATION#' + conversationId),
                            ScanIndexForward=False,
                            Limit=10,
                            ExclusiveStartKey={
                                'PK': 'CONVERSATION#' + conversationId,
                                'sortKey': message['sortKey']
                            }
                        )
                        if 'LastEvaluatedKey' in messagesResponse:
                            cont = 'True'
                        else:
                            cont = 'False'
                    else:
                        try:
                            messagesResponse = table.query(
                                KeyConditionExpression=Key('PK').eq('CONVERSATION#' + conversationId),
                                ScanIndexForward = False,
                                Limit=20
                            )
                        except ClientError as e:
                            print(e.messagesResponse['Error']['Message'])
                        else:
                            if 'LastEvaluatedKey' in messagesResponse:
                                cont = 'True'
                            else:
                                cont = 'False'
                    messages = []
                    for item in messagesResponse['Items']:
                        if item['sortKey'] != 'METADATA':
                            dateTimeMessage = datetime.strptime(item['sortKey'], '%Y-%m-%dT%H:%M:%S.%f')
                            dateTime = dateTimeMessage.strftime("%m/%d/%Y, %H:%M:%S")
                            if 'postId' in item:
                                #If user send a post to other user.
                                #Fetch the post data
                                try:
                                    postGetResponse = table.get_item(
                                        Key={'PK': 'POST#' + item['postId'], 'sortKey': 'METADATA'}
                                    )
                                except ClientError as e:
                                    print(e.postGetResponse['Error']['Message'])
                                else:
                                    if 'Item' in postGetResponse:
                                        messageObject = {
                                                'type': 'post',
                                                'seen' : item['seen'],
                                                'dateTime': dateTime,
                                                'text': postGetResponse['Item']['text'],
                                                'postId': postGetResponse['Item']['postId'],
                                                'username': postGetResponse['Item']['username'],
                                                'imageUrl': postGetResponse['Item']['imageURL'],
                                                'reply': ''
                                            }
                            else:
                                messageObject = {
                                        'type': 'message',
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

                        res = {'userInfo': userInfo, 'messages': messages, 'cont': cont}
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
            dateTimeConversation = datetime.strptime(conversation['sortKey'], '%Y-%m-%dT%H:%M:%S.%f')
            dateTime = dateTimeConversation.strftime("%m/%d/%Y, %H:%M:%S")
            
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

def postHandler(event, context):
    body = json.loads(event['body'])
    params = event['pathParameters']
    conversationId = params['proxy']

    if 'identity' in event['requestContext']:
        user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
    else:
        return Fail

    #If user send a message
    #Find user and conversation. If there is a reply in request add reply to db.
    if body['type'] == 'message':  
        #Find conversation that user involved. Else return fail
        try:
            conversationUserResponse = table.query(
                KeyConditionExpression=Key('PK').eq('USER#' + user + '#CONVERSATION'),
                FilterExpression=Attr('conversationId').eq(conversationId)
            )
        except ClientError as e:
            print(e.conversationUserResponse['Error']['Message'])
        else:
            if 'Items' in conversationUserResponse:
                #Create message object
                message = {
                    'PK': 'CONVERSATION#' + conversationId,
                    'sortKey': datetime.now().isoformat(),
                    'seen': 'False',
                    'sender': user,
                    'text': body['text'],
                    'reply': '',
                }
                if 'reply' in body:
                    #Find replied message. If its not in messages return Fail
                    searchDatetime = datetime.strptime(body['repliedDateTime'], "%m/%d/%Y, %H:%M:%S").isoformat()
                    try:
                        replyResponse = table.query(
                            KeyConditionExpression=Key('PK').eq('CONVERSATION#' + conversationId) & Key('sortKey').begins_with(searchDatetime),
                            FilterExpression=Attr('text').eq(body['reply']) 
                        )
                    except ClientError as e:
                        print(e.replyResponse['Error']['Message'])
                        return Fail
                    else:
                        print(replyResponse , searchDatetime)
                        if 'Items' in replyResponse and len(replyResponse['Items']) >= 1:              
                            message['reply'] = {
                                'text': body['reply'],
                                'user': replyResponse['Items'][0]['sender'],
                            }
                        else:
                            return Fail

                #Update the user conversation items to fetch newer data for users.                
                dateTimeMessage = datetime.strptime(message['sortKey'], '%Y-%m-%dT%H:%M:%S.%f')
                dateTime = dateTimeMessage.strftime("%m/%d/%Y, %H:%M:%S")
                oldSortKey = conversationUserResponse['Items'][0]['sortKey']
                conversationUserResponse['Items'][0]['sortKey'] = dateTime

                #Fetch other user's conversation item to update.
                otherUser = conversationUserResponse['Items'][0]['otherUser']
                try:
                    otherUserResponse = table.query(
                        KeyConditionExpression=Key('PK').eq('USER#' + otherUser + '#CONVERSATION'),
                        FilterExpression=Attr('otherUser').eq(user)
                    )
                except ClientError as e:
                    print(e.otherUserResponse['Error']['Message'])
                    return Fail
                else:
                    if 'Items' in otherUserResponse:
                        table.delete_item(
                            Key={'PK': otherUserResponse['Items'][0]['PK'] , 'sortKey': otherUserResponse['Items'][0]['sortKey']}
                        )
                        otherUserResponse['Items'][0]['sortKey'] = message['sortKey']
                        table.put_item(Item=otherUserResponse['Items'][0])
                
                #Also update our user's conversation data. 
                table.delete_item(
                    Key={'PK': conversationUserResponse['Items'][0]['PK'] , 'sortKey':oldSortKey}
                )
                conversationUserResponse['Items'][0]['sortKey'] = message['sortKey']

                table.put_item(Item=conversationUserResponse['Items'][0])
     
                table.put_item(Item=message)
                messageReturn = {
                    'seen' : 'False',
                    'dateTime': dateTime,
                    'text': message['text'],
                    'reply': message['reply'],
                    'sender': 'user',
                }

                res = {'message': messageReturn}
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

    #User wants to delete one of his messages. Find given message, check if it belongs to user
    elif body['type'] == 'delete':
        searchDatetime = datetime.strptime(body['dateTime'], "%m/%d/%Y, %H:%M:%S").isoformat()
        try:
            messageResponse = table.query(
                KeyConditionExpression=Key('PK').eq('CONVERSATION#' + conversationId) & Key('sortKey').begins_with(searchDatetime),
                FilterExpression=Attr('text').eq(body['text']) & Attr('sender').eq(user)
            )
        except ClientError as e:
            print(e.messageResponse['Error']['Message'])
            return Fail
        else:
            if 'Items' in messageResponse and len(messageResponse['Items']) >= 1:
                #Found the message.Checked it belongs to user. Delete
                table.delete_item(
                    Key={'PK': messageResponse['Items'][0]['PK'], 'sortKey':messageResponse['Items'][0]['sortKey']}
                )
                res = {'Success': 'True'}
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

    elif body['type'] == 'createMessage':
        #Collect other user's information. Check if there is a conversation between two users. Check other user's message permissions
        otherUser = event['pathParameters']['proxy']
        if otherUser:
            try:
                otherUserResponse = table.get_item(
                    Key={'PK': 'USER#' + otherUser , 'sortKey': 'METADATA'}
                )
            except ClientError as e:
                print(e.otherUserResponse['Error']['Message'])
            else:
                if 'Item' in otherUserResponse:
                    #Check user's conversations
                    try:
                        conversationCheckResponse = table.query(
                            KeyConditionExpression=Key('PK').eq('USER#'+user+'#CONVERSATION'),
                            FilterExpression=Attr('otherUser').eq(otherUser)
                        )
                    except ClientError as e:
                        print(e.conversationCheckResponse['Error']['Message'])
                    else:
                        if 'Items' in conversationCheckResponse and len(conversationCheckResponse['Items']) >= 1:
                            if 'text' in body:
                                #send this message to user
                                return sendMessage(user, otherUser, body['text'])
                            else:
                                return Fail
                        else:
                            #There are no conversations between two users. Check other user's permissions and create one.
                            if 'messagePermissions' in otherUserResponse['Item'] and otherUserResponse['Item']['messagePermissions'] == 'Follows':
                                #Check if other user follows our user
                                try:
                                    followResponse = table.get_item(
                                        Key={'PK': 'USER#' + otherUser + '#FOLLOWS' , 'sortKey': user}
                                    )
                                except ClientError as e:
                                    print(e.followResponse['Error']['Message'])
                                else:
                                    if 'Item' in followResponse:
                                        #Permissions fulfilled. Create conversation and create user conversations
                                        return createConversation(user, otherUser, body['text'])
                                    else:
                                        return Fail
                            else:
                                return createConversation(user, otherUser, body['text'])



        else: return Fail
                                    
    elif body['type'] == 'sendPost':
        #Find conversation that user involved. Else return fail
        try:
            conversationUserResponse = table.query(
                KeyConditionExpression=Key('PK').eq('USER#' + user + '#CONVERSATION'),
                FilterExpression=Attr('conversationId').eq(conversationId)
            )
        except ClientError as e:
            print(e.conversationUserResponse['Error']['Message'])
        else:
            if 'Items' in conversationUserResponse:
                #Create message object
                message = {
                    'PK': 'CONVERSATION#' + conversationId,
                    'sortKey': datetime.now().isoformat(),
                    'seen': 'False',
                    'sender': user,
                    'text': '',
                    'postId': body['postId'],
                }

                #Update the user conversation items to fetch newer data for users.                
                dateTimeMessage = datetime.strptime(message['sortKey'], '%Y-%m-%dT%H:%M:%S.%f')
                dateTime = dateTimeMessage.strftime("%m/%d/%Y, %H:%M:%S")
                oldSortKey = conversationUserResponse['Items'][0]['sortKey']
                conversationUserResponse['Items'][0]['sortKey'] = dateTime

                #Fetch other user's conversation item to update.
                otherUser = conversationUserResponse['Items'][0]['otherUser']
                try:
                    otherUserResponse = table.query(
                        KeyConditionExpression=Key('PK').eq('USER#' + otherUser + '#CONVERSATION'),
                        FilterExpression=Attr('otherUser').eq(user)
                    )
                except ClientError as e:
                    print(e.otherUserResponse['Error']['Message'])
                    return Fail
                else:
                    if 'Items' in otherUserResponse:
                        table.delete_item(
                            Key={'PK': otherUserResponse['Items'][0]['PK'] , 'sortKey': otherUserResponse['Items'][0]['sortKey']}
                        )
                        otherUserResponse['Items'][0]['sortKey'] = message['sortKey']
                        table.put_item(Item=otherUserResponse['Items'][0])
                
                #Also update our user's conversation data. 
                table.delete_item(
                    Key={'PK': conversationUserResponse['Items'][0]['PK'] , 'sortKey':oldSortKey}
                )
                conversationUserResponse['Items'][0]['sortKey'] = message['sortKey']

                table.put_item(Item=conversationUserResponse['Items'][0])
     
                table.put_item(Item=message)
                res = {'message': 'Success'}
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


def createConversation(user, otherUser, text):
    conversationId = str(uuid.uuid4())
    dateTime = datetime.now().isoformat()
    Item = {
        'PK' : 'CONVERSATION#' + conversationId,
        'sortKey': 'METADATA',
        'user1': user,
        'user2':  otherUser 
    }

    conv1 = {
        'PK': 'USER#' + user + '#CONVERSATION',
        'sortKey': dateTime,
        'conversationId': conversationId,
        'otherUser': otherUser
    }
    
    conv2 = {
        'PK': 'USER#' + otherUser + '#CONVERSATION',
        'sortKey': dateTime,
        'conversationId': conversationId,
        'otherUser': user
    }

    conv3 = {
        'PK': 'CONVERSATION#' + conversationId,
        'sortKey': dateTime,
        'seen': 'False',
        'sender': user,
        'text': text,
        'reply': '',
    }
    table.put_item(Item=Item)
    table.put_item(Item=conv1)
    table.put_item(Item=conv2)
    table.put_item(Item=conv3)
    #Collect other user info to return. Also return empty messages array
    messages = []

    try:
        getUserInfo = table.get_item(
            Key={'PK': 'USER#'+ otherUser, 'sortKey':'METADATA'}
        )
    except ClientError as e:
        print(e.getUserInfo['Error']['Message'])
    else:
        if 'Item' in getUserInfo:
            imageUrl = None
            if 'Image' in getUserInfo['Item']: imageUrl = getUserInfo['Item']['image']
            userInfo = {
                'username': getUserInfo['Item']['userName'],
                'image': imageUrl,
            }


    res = {'userInfo': userInfo, 'messages': messages, 'messageSend': 'Message send'}
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


def sendMessage(user, otherUser, message):
    #Update user's conversation items. Create new message item with same dateTime.

    dateTime = datetime.now().isoformat()

    #Collect user's conversation to update
    try:
        userMessageResponse = table.query(
            KeyConditionExpression=Key('PK').eq('USER#'+user+'#CONVERSATION'),
            FilterExpression=Attr('otherUser').eq(otherUser)
        )
    except ClientError as e:
        print(e.userMessageResponse['Error']['Message'])
    else:
        if 'Items' in userMessageResponse and len(userMessageResponse['Items']) >= 1:
            conversation = userMessageResponse['Items'][0]
            #Collect other user's conversation item
            try:
                otherUserMessageResponse =  table.query(
                    KeyConditionExpression=Key('PK').eq('USER#'+otherUser+'#CONVERSATION'),
                    FilterExpression=Attr('otherUser').eq(user)
                )
            except ClientError as e:
                print(e.otherUserMessageResponse['Error']['Message'])
            else:
                if 'Items' in otherUserMessageResponse and len(otherUserMessageResponse['Items']) >= 1:
                    conversationOther = otherUserMessageResponse['Items'][0]

                    #Update the conversation items
                    table.delete_item(
                        Key={'PK': conversationOther['PK'] , 'sortKey': conversationOther['sortKey'] }
                    )
                    conversationOther['sortKey'] = dateTime
                    table.put_item(Item=conversationOther)

                    table.delete_item(
                        Key={'PK': conversation['PK'] , 'sortKey': conversation['sortKey'] }
                    )
                    conversation['sortKey'] = dateTime
                    table.put_item(Item=conversation)

                    conversationId = conversation['conversationId']
                    #Add the message itself to db
                    message = {
                        'PK': 'CONVERSATION#' + conversationId,
                        'sortKey': dateTime,
                        'seen': 'False',
                        'sender': user,
                        'text': message,
                        'reply': ''
                    }
                    table.put_item(Item=message)

                    res = {'messageSend': 'Message send'}
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
