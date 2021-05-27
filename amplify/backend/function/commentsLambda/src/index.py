import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError 
from datetime import datetime
import uuid


dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table('SingleTableDesign')


def handler(event, context):
    print('received event:')
    print(event)
    if event['httpMethod'] == 'POST':
        return postHandler(event, context)
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps('Hello from your new Amplify Python lambda!')
    }

def postHandler(event, context):
    Fail = {
        'statusCode': 404,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps("Couldn't find the request")
    }
    
    #Like handler
    if 'reaction' in event['body']:
        body = json.loads(event['body'])
        params = event['pathParameters']
        postId = body['post']
        commentId = params['proxy']
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
        else:
            return Fail
        try:
            response = table.get_item(Key={'PK': "COMMENT#" + commentId, 'sortKey': "METADATA"})
        except ClientError as e:
            print(e.response['Error']['Message'])
            return Fail
        else:
            comment = response['Item']
            if body["reaction"] == "Like":
                #Check if user liked before
                try:
                    reactionResponse = table.query(KeyConditionExpression=Key('PK').eq("COMMENT#" + commentId + "#REACTION#" + user))
                except ClientError as e:
                    print(e.reactionResponse['Error']['Message'])
                    return Fail
                else:
                    #User didn't interacted with post before
                    if len(reactionResponse['Items']) == 0:
                        #Change the like count in comment metadata
                        comment['numberOfLikes'] = str(int(comment['numberOfLikes']) + 1)
                        table.put_item(Item=comment)
                        comment['Reaction'] = "Like"

                        #Add new reaction to the post
                        table.put_item(
                            Item={
                                    'PK': "COMMENT#" + commentId + "#REACTION#" + user,
                                    'sortKey': datetime.now().isoformat(),
                                    'text': 'Like',
                                    'userId': user,
                                    'reactionType': 'Reaction',
                                }
                            )
                    else:
                        #Change the interaction made before
                        #Unlike
                        if reactionResponse['Items'][0]['text'] == "Like":                         
                            comment['numberOfLikes'] = str(int(comment['numberOfLikes']) - 1)
                            table.put_item(Item=comment)
                        #Like the previusly disliked one
                        elif reactionResponse['Items'][0]['text'] == "Dislike":                       
                            comment['numberOfLikes'] = str(int(comment['numberOfLikes']) + 1)
                            comment['numberOfDislikes'] = str(int(comment['numberOfDislikes']) - 1)
                            table.put_item(Item=comment)
                            comment['Reaction'] = 'Like'
                            #Add new reaction to the post
                            table.put_item(
                                Item={
                                        'PK': "COMMENT#" + commentId + "#REACTION#" + user,
                                        'sortKey': datetime.now().isoformat(),
                                        'text': 'Like',
                                        'userId': user,
                                        'reactionType': 'Reaction',
                                    }
                                )
                    
                        previousSortKey = reactionResponse['Items'][0]['sortKey']
                        table.delete_item(
                            Key={
                                'PK': "COMMENT#" + commentId + "#REACTION#" + user,
                                'sortKey': previousSortKey,
                            }
                        )
                    dateTimeComment = datetime.strptime(comment['dateTime'], '%Y-%m-%dT%H:%M:%S.%f')
                    comment['dateTime'] = dateTimeComment.strftime("%m/%d/%Y, %H:%M:%S")
                    res = {'comment': comment}
                    response = {
                        'statusCode': 200,
                        'body': json.dumps(res),
                        'headers': {
                            'Access-Control-Allow-Headers': '*',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                        },
                    }

            if body["reaction"] == 'Dislike':
                #Check if user disliked before
                try:
                    reactionResponse = table.query(KeyConditionExpression=Key('PK').eq("COMMENT#" + commentId + "#REACTION#" + user))
                except ClientError as e:
                    print(e.reactionResponse['Error']['Message'])
                    return Fail
                else:
                    #User didn't interacted with post before
                    if len(reactionResponse['Items']) == 0:
                        #Change the like count in comment metadata
                        comment['numberOfDislikes'] = str(int(comment['numberOfDislikes']) + 1)
                        table.put_item(Item=comment)
                        comment['Reaction'] = "Dislike"

                        #Add new reaction to the post
                        table.put_item(
                            Item={
                                    'PK': "COMMENT#" + commentId + "#REACTION#" + user,
                                    'sortKey': datetime.now().isoformat(),
                                    'text': 'Dislike',
                                    'userId': user,
                                    'reactionType': 'Reaction',
                                }
                            )
                    else:
                        #Change the interaction made before
                        #Undislike
                        if reactionResponse['Items'][0]['text'] == "Dislike":                         
                            comment['numberOfDislikes'] = str(int(comment['numberOfDislikes']) - 1)
                            table.put_item(Item=comment)
                        #Dislike the previusly liked one
                        elif reactionResponse['Items'][0]['text'] == "Like":                       
                            comment['numberOfDislikes'] = str(int(comment['numberOfDislikes']) + 1)
                            comment['numberOfLikes'] = str(int(comment['numberOfLikes']) - 1)
                            table.put_item(Item=comment)
                            comment['Reaction'] = 'Dislike'
                            #Add new reaction to the post
                            table.put_item(
                                Item={
                                        'PK': "COMMENT#" + commentId + "#REACTION#" + user,
                                        'sortKey': datetime.now().isoformat(),
                                        'text': 'Dislike',
                                        'userId': user,
                                        'reactionType': 'Reaction',
                                    }
                                )
                    
                        previousSortKey = reactionResponse['Items'][0]['sortKey']
                        table.delete_item(
                            Key={
                                'PK': "COMMENT#" + commentId + "#REACTION#" + user,
                                'sortKey': previousSortKey,
                            }
                        )
                    
                    dateTimeComment = datetime.strptime(comment['dateTime'], '%Y-%m-%dT%H:%M:%S.%f')
                    comment['dateTime'] = dateTimeComment.strftime("%m/%d/%Y, %H:%M:%S")

                    res = {'comment': comment}
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
    #If user sent a comment
    #Create a comment object and link to post object
    #Update number of comments in post
    elif 'text' in event['body']:
        body = json.loads(event['body'])
        params = event['pathParameters']
        postId = params['proxy']
        if postId == 'undefined': return Fail
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
        else:
            return Fail
        if len(body['text']) >= 1:
            commentId = str(uuid.uuid4())
            #Collect username
            try:
                userResponse = table.get_item(
                    Key={'PK': 'USER#' + user, 'sortKey': 'METADATA'}
                )
            except ClientError as e:
                print(e.userResponse['Error']['Message'])
                return Fail
            else:
                if 'Item' in userResponse: username = userResponse['Item']['userName']
                else: return Fail
            try:
                postResponse = table.get_item(
                    Key={'PK': 'POST#' + postId, 'sortKey': 'METADATA'}
                )
            except ClientError as e:
                print(e.postResponse['Error']['Message'])
            else:
                if 'Item' in postResponse:
                    post = postResponse['Item']
                    post['numberOfComments'] = str(int(post['numberOfComments']) + 1)
            table.put_item(Item=post)
            date = datetime.now().isoformat()
            comment = {
                        'PK': "COMMENT#" + commentId ,
                        'sortKey': 'METADATA',
                        'text': body['text'],
                        'userId': user,
                        'username': username,
                        'numberOfLikes': '0',
                        'numberOfDislikes': '0',
                        'dateTime': date,
                        'commentId': commentId,
                        'postId': postId,
                    }
            table.put_item(
                Item=comment
                )         
            table.put_item(
                Item={
                    'PK': 'POST#' + postId + '#COMMENT',
                    'sortKey':  date,
                    'userId': user,         
                    'commentId': commentId,
                }
            )
            dateTimeComment = datetime.strptime(comment['dateTime'], '%Y-%m-%dT%H:%M:%S.%f')
            comment['dateTime'] = dateTimeComment.strftime("%m/%d/%Y, %H:%M:%S")

            res = {'comment': comment}
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


        else: return Fail

        
        
