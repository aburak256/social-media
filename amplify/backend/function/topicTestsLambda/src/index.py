import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError 
import random
import datetime

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

    if event['httpMethod'] == 'POST':
        return postHandler(event, context)
    if 'resource' in event:
        path = event['resource'] 
    else:
        return Fail

    if "/topicTest" in event['resource']:
        params = event['pathParameters']    
        topic = params['proxy'].upper()
        if 'identity' in event['requestContext']:
            user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
        else:
            return Fail
        print(user)
        try:
            response = table.get_item(Key={'PK': "TOPIC#" + topic, 'sortKey': "METADATA"})
        except ClientError as e:
            print(e.response['Error']['Message'])
        else:
            topic = response['Item']
            topic['numberOfQuestions']
            #Check if user solved a test before about this topic
            try:
                checkResponse = table.query(
                KeyConditionExpression=Key('PK').eq('USER#' + user + '#ANSWER#' + topic) & Key('sortKey').eq('METADATA')
            )
            except ClientError as e:
                print(e.checkResponse['Error']['Message'])
            else:
                #User didn't solved this test before
                if len(checkResponse['Items']) == 0:
                    #Create a user answers and add first question to this item. Return the first question
                    table.put_item(
                                Item={
                                        'PK': "USER#" + user + "#ANSWERS#" + topic,
                                        'sortKey': 'METADATA',
                                        'dateTime': datetime.now().isoformat(),
                                        'finished': 'False',
                                        'successRate': '0',
                                        'topicId': topic,
                                    }
                                )
                    question = questionPick(user, topic)
                    table.put_item(
                                Item={
                                        'PK': "USER#" + user + "#ANSWERS#" + topic,
                                        'sortKey': '1',
                                        'text': '',
                                        'True': 'False',
                                        'questionId' :question['PK'],
                                    }
                                )
                    #Collect options for this question
                    answers = []
                    for i in range(int(question['numberOfAnswers'])):
                        try:
                            answerResponse = table.query(
                                KeyConditionExpression=Key('PK').eq(question['PK'] + "#ANSWER") & Key('sortKey').eq(str(i))
                            )
                        except ClientError as e:
                            print(e.answerResponse['Error']['Message'])
                            return Fail
                        else:
                            answers.append(response['Items'][0])
                    res = {'question': question['text'], 'answers':answers}
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
                    
                #User solved this before, check time and finish status. Also check permissions, if he/she has write permissions, refuse
                else :               
                    prev = checkResponse['Items'][-1]
                    dateTimePrev = datetime.datetime.strptime(prev['dateTime'], '%Y-%m-%d %H:%M:%S.%f')
                    now = datetime.datetime.now()
                    result = now - dateTimePrev
                    if result.total_seconds() >= 3600 * 24 * 90:
                        #After 90 days, last test is expired. Check users permissions then if not permitted to write, create new test
                        try:
                            permissionResponse = table.query(
                                KeyConditionExpression=Key('PK').eq('USER#' + user + '#PERMISSION') & Key('sortKey').eq(topic)
                            )
                        except ClientError as e:
                            print(e.answerResponse['Error']['Message'])
                            return Fail
                        else:
                            if permissionResponse['Items']['text'] == 'Succeess' and permissionResponse['Items']['sortKey'] == topic:
                                #User have permissions to write at specified topic
                                return Fail
                            else:
                                prev['dateTime'] = datetime.now().isoformat()
                                prev['finished'] = 'False'
                                prev['successRate'] = '0'
                                table.put_item(Item=prev)
                                
                                #Delete previus user selections
                                try:
                                    prevAnswers = table.query(
                                        KeyConditionExpression=Key('PK').eq('USER#' + user + '#ANSWERS#' + topic)
                                    )
                                except ClientError as e:
                                    print(e.prevAnswers['Error']['Message'])
                                    return Fail
                                else:
                                    for answer in prevAnswers['Items']:
                                        if answer['sortKey'] == 'METADATA':
                                            continue
                                        else:
                                            table.delete_item(Item=answer)                

                                question = questionPick(user, topic)
                                table.put_item(
                                            Item={
                                                    'PK': "USER#" + user + "#ANSWERS#" + topic,
                                                    'sortKey': '1',
                                                    'text': '',
                                                    'True': 'False',
                                                    'questionId' :question['PK'],
                                                }
                                            )
                                #Collect options for this question
                                answers = []
                                for i in range(int(question['numberOfAnswers'])):
                                    try:
                                        answerResponse = table.query(
                                            KeyConditionExpression=Key('PK').eq(question['PK'] + "#ANSWER") & Key('sortKey').eq(str(i))
                                        )
                                    except ClientError as e:
                                        print(e.answerResponse['Error']['Message'])
                                        return Fail
                                    else:
                                        answers.append(response['Items'][0])
                                res = {'question': question['text'], 'answers':answers}
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

                        pass
                    elif result.total_seconds() >= 60 * int(topic['requiredTimeTest']):
                        #Last test's session expired return fail
                        return Fail
                    else:
                        #Continue the last test's session
                        pass

            

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps('Hello from your new Amplify Python lambda!')
    }

def questionPick(user, topic):
    pass

def postHandler(event, context):
    pass