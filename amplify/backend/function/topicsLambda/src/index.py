import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError 
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table('SingleTableDesign')

def handler(event, context):
    print('received event:')
    print(event)
    Fail = {
            'statusCode': 404,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps("Couldn't find the request")
        }

    if 'resource' in event:
        path = event['resource']
    else:
        return Fail

    if event['httpMethod'] == 'POST':
        return postHandler(event, context)

    if event['resource'] == "/topics":
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
        else: return Fail
        resp = table.scan(
            # Scanning because in this GSI there are only few elements
            IndexName="topic-index",
        )
        topics = []
        for item in resp['Items']:
            pop = updatePopularity(item['topic'])
            follow = checkFollow(item, user)
            item['popularity'] = pop
            item['follow'] = follow
            topics.append(item)

        response = {
            'statusCode': 200,
            'body': json.dumps(topics),
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
        }

        return response

    if "/topics" in event['resource']:
        #Send posts in topic and post information
        #Update topic's popularity and add user's log to db
        params = event['pathParameters']
        topic = params['proxy'].upper()
        user = None
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
        if topic == 'BOOKMARKS':
            return bookmarks(event, context)
        if 'INFO/' in topic:
            return getTopicInfo(event,context)
        timeRequired = '0'
        if event['queryStringParameters'] != None:
            #Collect last post first
            postRes = table.get_item(
                Key={'PK': 'POST#' + event['queryStringParameters']['paginator'], 'sortKey': 'METADATA'}
            )
            post = postRes['Item']
            resp = table.query(
                KeyConditionExpression=Key('PK').eq("TOPIC#" + topic + "#POST"),
                ScanIndexForward=False,
                Limit=30,
                ExclusiveStartKey={
                    'PK': 'TOPIC#' + topic + '#POST',
                    'sortKey': post['dateTime']
                }
            )
            if 'LastEvaluatedKey' in resp:
                cont = 'True'
            else:
                cont = 'False'
        else:
            resp = table.query(
                KeyConditionExpression=Key('PK').eq("TOPIC#" + topic + "#POST"),
                ScanIndexForward=False,
                Limit=30
            )
            if 'LastEvaluatedKey' in resp:
                cont = 'True'
            else:
                cont = 'False'
            #User opens the selected topic.
            #Add user log to calculate popularity
            table.put_item(
                Item={
                    'PK': "TOPIC#" + topic + '#POPULARITY',
                    'sortKey': datetime.now().isoformat(),
                    'userId': user
                }
            )
        permission = 'Reader'       
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
        res = {'posts': posts, 'permission': permission, 'cont': cont}
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
                    if 'Items' in postPull and len(postPull['Items']) >= 1:
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
                    else:
                        #Post deleted. Continue
                        pass
            
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


def updatePopularity(topic):
    #Collect the popularity items at last one week?
    topicToSearch = topic.upper()
    dateSearch = (datetime.now() - timedelta(days=7)).isoformat()
    try:
        popularityResponse = table.query(
            KeyConditionExpression=Key('PK').eq('TOPIC#' + topicToSearch + '#POPULARITY') & Key('sortKey').gt(dateSearch)
        )
    except ClientError as e:
        print(e.popularityResponse['Error']['Message'])
    else:
        if 'Items' in popularityResponse:
            return str(len(popularityResponse['Items']))
        else: return '0'

def checkFollow(topic, user):
    #Check if user follows this topic
    try:
        followResponse = table.get_item(
            Key={'PK': 'USER#' + user + '#FOLLOWS', 'sortKey': topic['topic'].upper()}
        )
    except ClientError as e:
        print(e.followResponse['Error']['Message'])
    else:
        if 'Item' in followResponse:
            return 'True'
        else:
            return 'False'