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

    #There can be two different requests. Without body and with body. 
    #Create a function that collects user info
    if event['httpMethod'] == 'POST':
        return postHandler(event, context)

    if 'resource' in event:
        path = event['resource']
    else:
        return Fail

    if "/profile/{proxy+}" == event['resource']:
        #Collect another user's information.
        #Check if the user exist. Then collect info and send
        #Also collect the information of follow between two users
        otherUser = event['pathParameters']['proxy']
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
        else:
            return Fail
        try:
            userResponse = table.get_item(
                Key={'PK': 'USER#' + otherUser, 'sortKey':'METADATA'}
            )
        except ClientError as e:
            print(userResponse['Error']['Message'])
        else:
            if 'Item' in userResponse:
                posts = collectUserPosts(otherUser)

                if user == otherUser:
                    followInfo = 'Self'
                try:
                    followResponse = table.get_item(
                        Key={'PK': 'USER#' + user + '#FOLLOWS', 'sortKey': otherUser}
                    )
                except ClientError as e:
                    print(followResponse['Error']['Message'])
                else:
                    if 'Item' in followResponse:
                        followInfo = 'True'
                    else:
                        followInfo = 'False'

                userInfo = {
                    'imageUrl': userResponse['Item']['imageUrl'],
                    'username': userResponse['Item']['userName'],
                    'bio': userResponse['Item']['text'],
                    'followers': userResponse['Item']['numberOfFollowers'],
                    'follows':userResponse['Item']['numberOfFollows'],
                    'followInfo': followInfo
                }
                
                res={'posts': posts, 'profile': userInfo}
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

    elif "/profile" == event['resource']:
        #Collect our user's information.
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
        else:
            return Fail
        
        try:
            userResponse = table.get_item(
                Key={'PK': 'USER#' + user, 'sortKey':'METADATA'}
            )
        except ClientError as e:
            print(userResponse['Error']['Message'])
        else:
            if 'Item' in userResponse:
                posts = collectUserPosts(user)
                userInfo = {
                    'imageUrl': userResponse['Item']['imageUrl'],
                    'username': userResponse['Item']['userName'],
                    'bio': userResponse['Item']['text'],
                    'followers': userResponse['Item']['numberOfFollowers'],
                    'follows':userResponse['Item']['numberOfFollows'],
                }
                
                res={'posts': posts, 'profile': userInfo}
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
        'body': json.dumps('Hello from your new Amplify Python lambda!')
    }

def collectUserPosts(user):
    posts = []

    try:
        postsUserResponse = table.query(
            KeyConditionExpression=Key('PK').eq('USER#' + user + '#POST'),
            ScanIndexForward=False
        )
    except ClientError as e:
        print(e.postsUserResponse['Error']['Message'])
    else:
        if 'Items' in postsUserResponse and len(postsUserResponse['Items']) >= 1:
            for userPost in postsUserResponse['Items']:
                #Collect the original post's information
                try:
                    postResponse = table.get_item(
                        Key={'PK': 'POST#' + userPost['postId'], 'sortKey': 'METADATA'}
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
                                KeyConditionExpression=Key('PK').eq('POST#' + userPost['postId'] + '#REACTION#' + user)
                            )
                        except ClientError as e:
                            print(e.reactionResponse['Error']['Message'])
                        else:
                            if 'Items' in reactionResponse and len(reactionResponse['Items']) >= 1:
                                postObject['Reaction'] = reactionResponse['Items'][0]['text']
                            posts.append(postObject)
            
            return posts
                                

def postHandler(event, context):
    body = json.loads(event['body'])
    if 'identity' in event['requestContext']:
        user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
    else:
        return Fail

    if body['type'] == 'Follow':
        otherUser = event['pathParameters']['proxy'] 

        pass


    elif body['type'] == 'photoChange':
        #Find user item in db. Check imageChangeDateTime, if its bigger than one day allow to upload. If not imageChangeDateTime add.
        try:
            userResponse = table.get_item(
                Key={'PK': 'USER#' + user, 'sortKey': 'METADATA'}
            )
        except ClientError as e:
             print(e.userResponse['Error']['Message'])
        else:
            if 'Item' in userResponse:
                if 'imageChangeDateTime' in userResponse['Item']:
                    #Check time interval.
                    dateTimePrev = datetime.strptime(userResponse['Item']['imageChangeDateTime'], '%Y-%m-%dT%H:%M:%S.%f')
                    now = datetime.now()
                    result = now - dateTimePrev
                    if result.total_seconds() >= 60*60*24:
                        #Return success to allow user to make a new upload.
                        res = {'upload': 'Allowed'}   
                    else:
                        res = {'upload': 'Denied'}   
                    
                else:
                    #Allow user to upload. Add imageChangeDateTime when user uploaded
                    res = {'upload': 'Allowed'}

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
    elif body['type'] == 'photoUpload':
        #User uploaded a new picture. Set imageChangeDateTime to now. Change imageUrl to generated url
        url = ""
        if body['image']:
            #Create image URL
            #Changed bucket policy to give unauth. users to read objects
            key = urllib.parse.quote(body['image'])
            url = ("https://{bucket}.s3.us-east-2.amazonaws.com/public/{key}".format(bucket=bucket, key=key))
        try:
            userResponse = table.get_item(
                Key={'PK': 'USER#' + user, 'sortKey': 'METADATA'}
            )
        except ClientError as e:
             print(e.userResponse['Error']['Message'])
        else:
            if 'Item' in userResponse:
                userResponse['Item']['imageUrl'] = url
                userResponse['Item']['imageChangeDateTime'] = datetime.now().isoformat()
                table.put_item(
                    Item=userResponse['Item']
                )

            res = {'newImage': url}

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

    elif body['type'] == 'bioChange':
        #Find user item in db. Change the text value in metadata. save
        try:
            userResponse = table.get_item(
                Key={'PK': 'USER#' + user, 'sortKey': 'METADATA'}
            )
        except ClientError as e:
             print(e.userResponse['Error']['Message'])
        else:
            if 'Item' in userResponse:
                userResponse['Item']['text'] = body['text']
                table.put_item(Item=userResponse['Item'])

                userInfo = {
                    'imageUrl': userResponse['Item']['imageUrl'],
                    'username': userResponse['Item']['userName'],
                    'bio': userResponse['Item']['text'],
                    'followers': userResponse['Item']['numberOfFollowers'],
                    'follows':userResponse['Item']['numberOfFollows'],
                }

                res = {'userInfo': userInfo}   
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


    return Fail



