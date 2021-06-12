import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
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
    if event['queryStringParameters'] != None and len(event['queryStringParameters']['search']) >= 3:
        textForSearch = event['queryStringParameters']['search']

        #Search the items in topics, posts and usernames
        topics = searchTopics(textForSearch)
        posts = searchPosts(textForSearch)
        usernames = searchUsernames(textForSearch)

        res = {'topics': topics, 'posts': posts, 'usernames': usernames}
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
        'body': json.dumps('You can search only with more than 3 characters.')
    }

def searchTopics(textForSearch):
    search = textForSearch.capitalize()
    try:
         response = table.scan(
            # Scanning because in this GSI there are only few elements
            IndexName="topic-index",
            FilterExpression=Attr('topic').contains(search)
        )
    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        if 'Items' in response and len(response['Items']) >= 1:
            topics = []
            for item in response['Items']:
                topicObject = {
                    'image': item['imageURL'],
                    'topic': item['topic'],
                    'text': item['text'],
                }

                topics.append(topicObject)
            
            return topics

def searchPosts(textForSearch):
    search = textForSearch.capitalize()
    try:
         response = table.query(
            IndexName="post-index",
            KeyConditionExpression=Key('post').eq('True'),
            FilterExpression=Attr('text').contains(search) | Attr('text').contains(textForSearch)
        )
    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        if 'Items' in response and len(response['Items']) >= 1:
            posts = []
            for item in response['Items']:
                postObject = {
                    'image': item['imageURL'],
                    'topicId': item['topicId'],
                    'text': item['text'],
                    'postId': item['postId'],
                    'username': item['username'],
                    'userId': item['userId']
                }

                posts.append(postObject)
            
            return posts

def searchUsernames(textForSearch):
    search = textForSearch.capitalize()
    try:
         response = table.query(
            IndexName="user-index",
            KeyConditionExpression=Key('user').eq('True'),
            FilterExpression=Attr('userName').contains(search) | Attr('userName').contains(textForSearch)
        )
    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        if 'Items' in response and len(response['Items']) >= 1:
            users = []
            for item in response['Items']:
                userObject = {
                    'image': item['imageUrl'],
                    'numberOfFollowers': item['numberOfFollowers'],
                    'numberOfFollows': item['numberOfFollows'],
                    'bio': item['text'],
                    'username': item['userName'],
                    'userId': item['PK'].split('#')[1]
                }

                users.append(userObject)
            
            return users