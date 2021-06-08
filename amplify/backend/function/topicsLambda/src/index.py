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

    if event['httpMethod'] == 'POST':
        return postHandler(event, context)

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
        topic = params['proxy'].upper()
        if topic == 'BOOKMARKS':
            return bookmarks(event, context)
        if 'INFO/' in topic:
            return getTopicInfo(event,context)
        timeRequired = '0'
        resp = table.query(
            KeyConditionExpression=Key('PK').eq("TOPIC#" + topic + "#POST"),
            ScanIndexForward=False
        )
        permission = 'Reader'
        user = None
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
        posts = []
        for item in resp['Items']:
            response = table.query(
                KeyConditionExpression=Key('PK').eq("POST#" + item['postId'])
        )
            post = response['Items'][0]
            #Collect reactions and bookmarks for user
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
                        bookmarkResponse = table.get_item(
                            Key={'PK': 'USER#' + user + '#BOOKMARK', 'sortKey': post['postId'].upper()}
                        )
                    except ClientError as e:
                        print(bookmarkResponse['Error']['Message'])
                    else:
                        if 'Item' in bookmarkResponse:
                            post['bookmark'] = "True"
                    
            
            dateTimePost = datetime.strptime(post['dateTime'], '%Y-%m-%dT%H:%M:%S.%f')
            post['dateTime'] = dateTimePost.strftime("%m/%d/%Y, %H:%M:%S")           
            posts.append(post)
        
        if user != None:
            try:
                permissionResponse = table.get_item(
                    Key={'PK': 'USER#' + user + '#PERMISSION', 'sortKey': topic}
                )
            except ClientError as e:
                print(e.permissionResponse['Error']['Message'])
            else:
                if 'Item' in permissionResponse and permissionResponse['Item']['text'] == 'Success':
                    permission = 'Writer'
        res = {'posts': posts, 'permission': permission}
        try:
            timeResponse = table.get_item(
                Key={'PK': 'TOPIC#' + topic , 'sortKey':'METADATA'}
            )
        except ClientError as e:
            print(e.timeResponse['Error']['Message'])
        else:
            if 'Item' in timeResponse:
                timeRequired = str(int(timeResponse['Item']['requiredTimeTest']) * 60)
                res['time'] = timeRequired
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

def bookmarks(event, context):
    Fail = {
        'statusCode': 404,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps("Couldn't find the request")
    }

    if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
    else:
        return Fail
    try:
        postsResponse = table.query(
            KeyConditionExpression=Key('PK').eq('USER#' + user + '#BOOKMARK'),
            ScanIndexForward=False
        )
    except ClientError as e:
        print(e.postsResponse['Error']['Message'])
    else:
        if 'Items' in postsResponse:
            posts = []
            for post in postsResponse['Items']:
                try:
                    postPull = table.query(
                        KeyConditionExpression=Key('PK').eq("POST#" + post['sortKey'].lower())
                    )
                except ClientError as e:
                    print(e.postPull['Error']['Message'])
                else:
                    if 'Items' in postPull:
                        postFetched = postPull['Items'][0]
                        dateTimePost = datetime.strptime(postFetched['dateTime'], '%Y-%m-%dT%H:%M:%S.%f')
                        postFetched['dateTime'] = dateTimePost.strftime("%m/%d/%Y, %H:%M:%S")
                        try:
                            likeResponse = table.query(
                                KeyConditionExpression=Key('PK').eq("POST#" + postFetched['postId'] + "#REACTION#" + user)
                            )
                        except ClientError as e:
                            print(e.likeResponse['Error']['Message'])
                        else:
                            if len(likeResponse['Items']) != 0:
                                Reaction = likeResponse['Items'][0]['text']      
                                postFetched['Reaction'] = Reaction
                        postFetched['bookmark'] = "True"           
                        posts.append(postFetched)
            
            res = {'posts': posts}
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


def getTopicInfo(event, context):
    params = event['pathParameters']
    topic = params['proxy'].upper().split("/")[1]
    #Collect topic's info and return
    user = None
    if 'identity' in event['requestContext']:
        user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]

    try:
        topicResponse = table.get_item(
            Key={'PK': 'TOPIC#' + topic, 'sortKey':'METADATA'}
        )
    except ClientError as e:
        print(e.topicResponse['Error']['Message'])
    else:
        if 'Item' in topicResponse:
            returnObject = {
                'Followers': topicResponse['Item']['numberOfFollowers'],
                'Description': topicResponse['Item']['text'],
            }

            #Check if user is following this topic
            try:
                followResponse = table.get_item(
                    Key={'PK': 'USER#' + user + '#FOLLOWS', 'sortKey': topic}
                )
            except ClientError as e:
                print(e.followResponse['Error']['Message'])
            else:
                if 'Item' in followResponse:
                    returnObject['followInfo'] = 'True'
                else:
                    returnObject['followInfo'] = 'False'
                
                res = {'topic': returnObject}
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
    if 'identity' in event['requestContext']:
        user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
    else:
        return Fail

    if body['type'] == 'follow':
        params = event['pathParameters']
        topic = params['proxy'].upper()

        #Check if topic exists
        try:
            topicResponse = table.get_item(
                Key={'PK': 'TOPIC#' + topic, 'sortKey': 'METADATA'}
            )
        except ClientError as e:
            print(e.topicResponse['Error']['Message'])
        else:
            if 'Item' in topicResponse:
                #Topic exists
                #Check if user currently following the topic
                #Increase number of followers by one
                #Add links of posts of this topic to user
                #Increase number of follows of user by one

                try:
                    userFollow = table.query(
                        KeyConditionExpression=Key('PK').eq('USER#' + user + '#FOLLOWS') & Key('sortKey').eq(topic)
                    )
                except ClientError as e:
                    print(e.userFollow['Error']['Message'])
                else:
                    if 'Items' in userFollow and len(userFollow['Items']) >= 1:
                        #User currently following this topic. Unfollow this topic and delete the posts in user timeline.
                        #Decrease the follow informations
                        table.delete_item(
                            Key={'PK': 'USER#' + user + '#FOLLOWS', 'sortKey' : topic}
                        )
                        table.delete_item(
                            Key={'PK': 'TOPIC#' + topic + '#FOLLOWER', 'sortKey': user}
                        )

                        #Clear the user timeline
                        #Check if user follows the given posts writer. 
                        try:
                            timelineOperation = table.query(
                                KeyConditionExpression=Key('PK').eq('TOPIC#' + topic + '#POST'),
                                ScanIndexForward=False,
                                Limit=500,
                            )
                        except ClientError as e:
                            print(e.timelineOperation['Error']['Message'])
                        else: 
                            if 'Items' in timelineOperation and len(timelineOperation['Items']) >= 1:
                                for postLink in timelineOperation['Items']:
                                    try:
                                        postItself = table.get_item(
                                            Key={'PK': 'POST#' + postLink['postId'], 'sortKey': 'METADATA'}
                                        )
                                    except ClientError as e:
                                        print(e.postItself['Error']['Message'])
                                    else:
                                        if 'Item' in postItself:
                                            try:
                                                followResponse = table.get_item(
                                                    Key={'PK': 'USER#' + user + '#FOLLOWS', 'sortKey': postItself['Item']['userId']}
                                                )
                                            except ClienError as e:
                                                print(e.followResponse['Error']['Message'])
                                            else:
                                                if 'Item' in followResponse:
                                                    #User following the given user
                                                    pass
                                                else:
                                                    table.delete_item(
                                                        Key={'PK': 'USER#' + user + '#TIMELINE#POST', 'sortKey' : postLink['sortKey']} 
                                                    )

                            #Decrease topic followers
                            topicResponse['Item']['numberOfFollowers'] = str(int(topicResponse['Item']['numberOfFollowers']) - 1)
                            table.put_item(Item=topicResponse['Item'])

                            #Decrease user follows
                            try:
                                userFollowResponse = table.get_item(
                                    Key={'PK': 'USER#' + user, 'sortKey': 'METADATA'}
                                )
                            except ClientError as e:
                                print(e.userFollowResponse['Error']['Message'])
                            else:
                                if 'Item' in userFollowResponse:
                                    userFollowResponse['Item']['numberOfFollows'] = str(int(userFollowResponse['Item']['numberOfFollows']) - 1)
                                    table.put_item(Item=userFollowResponse['Item'])

                                    res={'followInfo': 'False'}                      


                    else:
                        #User is not following this topic
                        topicResponse['Item']['numberOfFollowers'] = str(int(topicResponse['Item']['numberOfFollowers']) + 1)
                        table.put_item(Item=topicResponse['Item'])

                        table.put_item(
                            Item={
                                'PK': 'USER#' + user + '#FOLLOWS',
                                'sortKey': topic,
                                'userId': user
                            }
                        )

                        table.put_item(
                            Item={
                                'PK': 'TOPIC#' + topic + '#FOLLOWER',
                                'sortKey': user,
                                'userId': user
                            }
                        )

                        try:
                            postsResponse = table.query(
                                KeyConditionExpression=Key('PK').eq('TOPIC#' + topic + '#POST'),
                                ScanIndexForward= False,
                                Limit=150
                            )
                        except ClientError as e:
                            print(e.postsResponse['Error']['Message'])
                        else:
                            if 'Items' in postsResponse and len(postsResponse['Items']) >= 1:
                                for postLink in postsResponse['Items']:
                                    #Create link for every post
                                    postObject = {
                                        'PK': 'USER#' + user + '#TIMELINE#POST',
                                        'sortKey': postLink['sortKey'],
                                        'postId': postLink['postId'],
                                    }

                                    table.put_item(Item=postObject)

                            try:
                                userFollowResponse = table.get_item(
                                    Key={'PK': 'USER#' + user, 'sortKey': 'METADATA'}
                                )
                            except ClientError as e:
                                print(e.userFollowResponse['Error']['Message'])
                            else:
                                if 'Item' in userFollowResponse:
                                    userFollowResponse['Item']['numberOfFollows'] = str(int(userFollowResponse['Item']['numberOfFollows']) + 1)
                                    table.put_item(Item=userFollowResponse['Item'])

                                    res={'followInfo': 'True'}

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


