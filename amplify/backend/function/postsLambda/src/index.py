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
                for comment in commentsResponse['Items']:
                    try :
                        comment = table.get_item(Key={'PK': "COMMENT#" + comment['commentId'], 'sortKey': "METADATA"})
                    except ClientError as e:
                        print(e.comment['Error']['Message'])
                    else:
                        comments.append(comment['Item'])
                        if user != None:
                            try:
                                commentsLikeResponse = table.query(
                                    KeyConditionExpression=Key('PK').eq("COMMENT#" + comment['Item']['commentId'] + "#REACTION#" + user)
                                )
                            except ClientError as e:
                                print(e.commentsLikeResponse['Error']['Message'])
                            else:
                                if len(commentsLikeResponse['Items']) != 0:
                                    Reaction = commentsLikeResponse['Items'][0]['text']      
                                    comments[-1]['Reaction'] = Reaction
        
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
        postId = params['proxy']
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
        else:
            return Fail 
        try:
            response = table.get_item(Key={'PK': "POST#" + postId, 'sortKey': "METADATA"})
        except ClientError as e:
            print(e.response['Error']['Message'])
        else:
            post = []
            post.append(response['Item'])
        if body["reaction"] == "Like":  
                #Check if user liked before
                try:
                    reactionResponse = table.query(KeyConditionExpression=Key('PK').eq("POST#" + postId + "#REACTION#" + user))
                except ClientError as e:
                    print(e.reactionResponse['Error']['Message'])
                else:
                    #User didn't interacted with post before
                    if len(reactionResponse['Items']) == 0:
                    #Change like count in Post metadata
                        post[0]['numberOfLikes'] = str(int(post[0]['numberOfLikes']) + 1)
                        table.put_item(Item=post[0])
                        post[0]['Reaction'] = "Like"

                        #Add new reaction to the post
                        table.put_item(
                            Item={
                                    'PK': "POST#" + postId + "#REACTION#" + user,
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
                            post[0]['numberOfLikes'] = str(int(post[0]['numberOfLikes']) - 1)
                            table.put_item(Item=post[0])
                        #Like the previusly disliked one
                        elif reactionResponse['Items'][0]['text'] == "Dislike":                       
                            post[0]['numberOfLikes'] = str(int(post[0]['numberOfLikes']) + 1)
                            post[0]['numberOfDislikes'] = str(int(post[0]['numberOfDislikes']) - 1)
                            table.put_item(Item=post[0])
                            post[0]['Reaction'] = 'Like'
                            #Add new reaction to the post
                            table.put_item(
                                Item={
                                        'PK': "POST#" + postId + "#REACTION#" + user,
                                        'sortKey': datetime.now().isoformat(),
                                        'text': 'Like',
                                        'userId': user,
                                        'reactionType': 'Reaction',
                                    }
                                )
                      
                        previousSortKey = reactionResponse['Items'][0]['sortKey']
                        table.delete_item(
                            Key={
                                'PK': "POST#" + postId + "#REACTION#" + user,
                                'sortKey': previousSortKey,
                            }
                        )

                    res = {'post': post}
                    response = {
                        'statusCode': 200,
                        'body': json.dumps(res),
                        'headers': {
                            'Access-Control-Allow-Headers': '*',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                        },
                    }
        if body["reaction"] == "Dislike":
            #Check if user disliked before
                try:
                    reactionResponse = table.query(KeyConditionExpression=Key('PK').eq("POST#" + postId + "#REACTION#" + user))
                except ClientError as e:
                    print(e.reactionResponse['Error']['Message'])
                else:
                    #User didn't interacted with post before
                    if len(reactionResponse['Items']) == 0:
                    #Change like count in Post metadata
                        post[0]['numberOfDislikes'] = str(int(post[0]['numberOfDislikes']) + 1)
                        table.put_item(Item=post[0])
                        post[0]['Reaction'] = "Dislike"
                        #Add new reaction to the post
                        table.put_item(
                            Item={
                                    'PK': "POST#" + postId + "#REACTION#" + user,
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
                            post[0]['numberOfDislikes'] = str(int(post[0]['numberOfDislikes']) - 1)
                            table.put_item(Item=post[0])
                        #Dislike the previusly liked one
                        elif reactionResponse['Items'][0]['text'] == "Like":                       
                            post[0]['numberOfDislikes'] = str(int(post[0]['numberOfDislikes']) + 1)
                            post[0]['numberOfLikes'] = str(int(post[0]['numberOfLikes']) - 1)
                            table.put_item(Item=post[0])
                            post[0]['Reaction'] = 'Dislike'
                            #Add new reaction to the post
                            table.put_item(
                                Item={
                                        'PK': "POST#" + postId + "#REACTION#" + user,
                                        'sortKey': datetime.now().isoformat(),
                                        'text': 'Dislike',
                                        'userId': user,
                                        'reactionType': 'Reaction',
                                    }
                                )

                        
                        previousSortKey = reactionResponse['Items'][0]['sortKey']
                        table.delete_item(
                            Key={
                                'PK': "POST#" + postId + "#REACTION#" + user,
                                'sortKey': previousSortKey,
                            }
                        )

                    res = {'post': post}
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
            
                
            