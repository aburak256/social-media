import json
import boto3

from boto3.dynamodb.conditions import Key


dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table('SingleTableDesign')

def lambda_handler(event, context):
    print("Recieved Event in user handler:", event)
    
    if event['triggerSource'] == "PostConfirmation_ConfirmSignUp" and event['userPoolId'] == 'us-east-2_TmvLiBZyZ':
        username = event['userName']
        attr = event['request']['userAttributes']
        if 'phone_number' in attr:
            phone = attr['phone_number']
        else:
            phone = ''
        response = table.put_item(
           Item={
                'PK': "USER#" + attr['sub'],
                'sortKey': "METADATA",
                'text' : 'Bio',
                'numberOfFollowers': '0',
                'numberOfFollows': '0',
                'mail' : attr['email'],
                'userName': username,
                'phone': phone,
                'imageUrl': '',
                'user': 'True',
            }
        )
        #Also create user timeline item with metadata. 
        response = table.put_item(
           Item={
                'PK': "USER#" + attr['sub'] + '#TIMELINE',
                'sortKey': "METADATA",
            }
        )
        return event
    else:
        print("Failed request")
