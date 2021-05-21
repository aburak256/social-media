import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError 
from datetime import datetime


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
