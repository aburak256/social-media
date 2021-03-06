import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError 
import random
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table('SingleTableDesign')

def handler(event, context):
    print('received event:')
    print(event)

    Fail = {
            'statusCode': 500,
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
            return Fail
        else:
            topicResult = response['Item']
            numberOfQuestions = topicResult['numberOfQuestions']
            #Check if user solved the test before, about this topic
            try:
                checkResponse = table.query(
                KeyConditionExpression=Key('PK').eq('USER#' + user + '#ANSWERS#' + topic) & Key('sortKey').eq('METADATA')
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
                                        'success': '0',
                                        'topicId': topic,
                                    }
                                )
                    question = questionPick(user, topic, numberOfQuestions)
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
                    return collectAnswers(question)
                    
                    
                #User solved this before, check time and finish status. Also check permissions, if he/she has write permissions, refuse to create new test
                else :               
                    prev = checkResponse['Items'][-1]
                    dateTimePrev = datetime.strptime(prev['dateTime'], '%Y-%m-%dT%H:%M:%S.%f')
                    now = datetime.now()
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
                            if len(permissionResponse['Items']) != 0:
                                #If permission item before
                                if permissionResponse['Items'][0]['text'] == 'Succeess':
                                    #User have permissions to write at specified topic. Don't needs to take test again
                                    return Fail
                                else:
                                    #User solved and didn't passed
                                    prev['dateTime'] = datetime.now().isoformat()
                                    prev['finished'] = 'False'
                                    prev['success'] = '0'
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

                                    question = questionPick(user, topic, numberOfQuestions)
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
                                    return collectAnswers(question)
                            else:
                                #Didn't find any permission item
                                #So there is a failiure from prev test results
                                #Check the prev tests results
                                #If success return fail else give another test
                                if int(prev['success']) >= int(topic['successRequired']):
                                    #Give user a permission
                                    table.put_item(
                                                Item={
                                                        'PK': 'USER#' + user + '#PERMISSION',
                                                        'sortKey': topic,
                                                        'text': 'Success',
                                                    }
                                                )
                                    response = {
                                        'statusCode': 200,
                                        'body': {
                                            'message': 'You have a permission'
                                        },
                                        'headers': {
                                            'Access-Control-Allow-Headers': '*',
                                            'Access-Control-Allow-Origin': '*',
                                            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                                        },
                                    }
                                    return response

                                else:
                                    #Give another test
                                    #Create a user answers and add first question to this item. Return the first question
                                    table.put_item(
                                                Item={
                                                        'PK': "USER#" + user + "#ANSWERS#" + topic,
                                                        'sortKey': 'METADATA',
                                                        'dateTime': datetime.now().isoformat(),
                                                        'finished': 'False',
                                                        'success': '0',
                                                        'topicId': topic,
                                                    }
                                                )
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
                                    #Pick a question           
                                    question = questionPick(user, topic, numberOfQuestions)
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
                                    return collectAnswers(question)

                    elif result.total_seconds() >= 60 * int(topicResult['requiredTimeTest']):
                        #Last test's session expired, check for success if there is a failure then return fail
                        return evaluate(user, topic)
                    else:
                        #Continue the last test's session
                        #Find the latest answer object that writed to db. Check if its selected then send it to user
                        try:
                            #Default order is ascending. Last element is metadata item. Take previous item to continue
                            latestAnswer = table.query(
                                KeyConditionExpression=Key('PK').eq('USER#' + user + '#ANSWERS#' + topic)
                            )
                        except ClientError as e:
                            print(e.answerResponse['Error']['Message'])
                        else:
                            lastObject = latestAnswer['Items'][-2]
                            if len(lastObject['text']) > 1:
                                #User answered this item. Check the number of questions required for this topic.
                                #If its greater or equal required number of questions return results
                                #If its smaller than required questions give another question
                                if int(lastObject['sortKey']) >= int(topicResult['numberOfTestQuestions']):
                                    #check result
                                    return evaluate(user, topic)
                                else:
                                    #Give last question
                                    question = questionPick(user, topic, numberOfQuestions)
                                    table.put_item(
                                                Item={
                                                        'PK': "USER#" + user + "#ANSWERS#" + topic,
                                                        'sortKey': str(int(lastObject['sortKey']) + 1),
                                                        'text': '',
                                                        'True': 'False',
                                                        'questionId' :question['PK'],
                                                    }
                                                )
                                    return collectAnswers(question)
                            else:
                                #User didn't answered his/her latest question. Send same question again
                                try:
                                    questionResponse = table.get_item(
                                        Key={'PK': (lastObject['questionId']), 'sortKey': 'METADATA'}
                                    )
                                except ClientError as e:
                                    print(e.questionResponse['Error']['Message'])
                                else:
                                    question = questionResponse['Item']
                                    return collectAnswers(question)
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps("We didn't understand your request")
    }


def questionPick(user, topic, numberOfQuestions):
    #Collect users prev questions at this session and give random question in topic
    try:
        selectionsResponse = table.query(
            KeyConditionExpression=Key('PK').eq('USER#' + user + '#ANSWERS#' + topic)
        )
    except ClientError as e:
        print(e.selectionsResponse['Error']['Message'])
    else:
        selections = selectionsResponse['Items']
        questionIds = []
        for selection in selections:
            if selection['sortKey'] == 'METADATA':
                continue
            else:
                questionIds.append(selection['questionId'])
        #Pick a random question in topic until its not in questions object
        while True:
            randomNumber = str(random.randint(1, int(numberOfQuestions)))
            try:
                #Collect the question at randomNumber and check
                randomResponse = table.query(
                    KeyConditionExpression=Key('PK').eq('TOPIC#' + topic + '#QUESTION') & Key('sortKey').eq(randomNumber)
                )
            except ClientError as e:
                print(e.randomResponse['Error']['Message'])
            else:
                #Check if there is a question at this index
                if len(randomResponse['Items']) == 1:
                    #Found the question. Check if its solved before
                    if randomResponse['Items'][0]['questionId'] in questionIds:
                        #Solved before. Try again
                        pass
                    else:
                        #Didnt't solved before. Collect question itself from db and return.
                        try:
                            questionResponse =table.get_item(Key={'PK': randomResponse['Items'][0]['questionId'], 'sortKey': "METADATA"})
                        except ClientError as e:
                            print(e.questionResponse['Error']['Message'])
                            pass
                        else:
                            return questionResponse['Item']
                else:
                    #Couldn't find the question. Retry
                    pass


def collectAnswers(question):
    Fail = {
            'statusCode': 404,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps("Couldn't find the request")
        }
    answers = []
    for i in range(1, int(question['numberOfAnswers']) + 1):
        try:
            answerResponse = table.query(
                KeyConditionExpression=Key('PK').eq(question['PK'] + "#ANSWER") & Key('sortKey').eq(str(i))
            )
        except ClientError as e:
            print(e.answerResponse['Error']['Message'])
            return Fail
        else:
            if len(answerResponse['Items']) >= 1:
                del answerResponse['Items'][0]['True']
                del answerResponse['Items'][0]['PK']
                del answerResponse['Items'][0]['sortKey']
                answers.append(answerResponse['Items'][0])
            else:
                return Fail
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


def evaluate(user, topic):
    #Check user's answers. Compare with topics requirements. If pass give user a permission to write
    try:
        selectionsResponse = table.query(
            KeyConditionExpression=Key('PK').eq('USER#' + user + '#ANSWERS#' + topic)
        )
    except ClientError as e:
        print(e.selectionsResponse['Error']['Message'])
    else:
        selections = selectionsResponse['Items']
        total, true, false = 0, 0, 0
        for selection in selections:
            if selection['sortKey'] != 'METADATA':
                total += 1
                if selection['True'] == 'True': true += 1
                else: false += 1
        successRate = (true / total) * 100
        #Collect topics success rate requirement
        try:
            successResponse = table.get_item(Key={'PK': "TOPIC#" + topic, 'sortKey': "METADATA"})
        except ClientError as e:
            print(e.successResponse['Error']['Message'])
        else:
            successFromTopic = int(successResponse['Item']['successRequired'])
            requiredNumberQuestions = int(successResponse['Item']['numberOfTestQuestions'])
            if len(selections) >= requiredNumberQuestions and successRate >= successFromTopic:
                #User can write. Give permission to write
                table.put_item(
                    Item={
                        'PK': 'USER#' + user + '#PERMISSION',
                        'sortKey': topic,
                        'text': 'Success',
                    }
                )
                selections[-1]['success'] = str(successRate)
                table.put_item(Item=selections[-1])
                res = {
                    'message': 'Success',
                    'end': 'True',
                }
                return {
                    'statusCode': 200,
                    'body': json.dumps(res),
                    'headers': {
                        'Access-Control-Allow-Headers': '*',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                    },
                }
            else:
                #User can't write. Don't give permission to write
                table.put_item(
                    Item={
                        'PK': 'USER#' + user + '#PERMISSION',
                        'sortKey': topic,
                        'text': 'Fail',
                    }
                )
                res = {
                    'message': 'Fail',
                    'end': 'True'
                }
                return {
                    'statusCode': 200,
                    'body': json.dumps(res),
                    'headers': {
                        'Access-Control-Allow-Headers': '*',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                    },
                }


def postHandler(event, context):
    #User post an answer to api. Check if answer is correct and add this to users answers.
    #If there are required number of questions solved by the user then end the test. Return end = true in body
    #Else send new question
    Fail = {
        'statusCode': 500,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps("We didn't understand your request")
    }

    params = event['pathParameters']    
    topic = params['proxy'].upper()
    if 'identity' in event['requestContext']:
        user = event['requestContext']['identity']['cognitoAuthenticationProvider'][-36:]
    else:
        return Fail
    if 'answer' in event['body']:
        body = json.loads(event['body'])
        answer = body['answer']
        try:
            #Default order is ascending. Last element is metadata item. Take previous item to continue
            latestAnswer = table.query(
                KeyConditionExpression=Key('PK').eq('USER#' + user + '#ANSWERS#' + topic)
            )
        except ClientError as e:
            print(e.latestAnswer['Error']['Message'])
        else:
            lastObject = latestAnswer['Items'][-2]
            if len(lastObject['text']) == 0:
                #User didn't answered last question. Change the answer of this one and send new
                lastObject['text'] = answer
                if checkAnswer(lastObject['questionId'], answer):
                    lastObject['True'] = 'True'
                else:
                    lastObject['True'] = 'False'
                table.put_item(Item=lastObject)

            else:
                #User answered latest one. Evaluate and send new
                if checkAnswer(lastObject['questionId'], lastObject['text']):
                    lastObject['True'] = 'True'
                else:
                    lastObject['True'] = 'False'
                

            #Check if user finished test.
            countNow = latestAnswer['Items'][-2]['sortKey']
            try:
                topicResponse = table.get_item(
                    Key={'PK': 'TOPIC#' + topic, 'sortKey': 'METADATA'}
                )
            except ClientError as e:
                print(e.topicResponse['Error']['Message'])
            else:
                #Check if time is up
                #Subtract now - startTest and compare this with requiredTimeTest attribute of topic metadata
                dateTimePrev = datetime.strptime(topicResponse['Item']['requiredTimeTest'], '%Y-%m-%dT%H:%M:%S.%f')
                now = datetime.now()
                result = now - dateTimePrev
                if result.total_seconds() >= 0:
                    pass
                else:
                    #Time is up do not count this answer and evaluate
                    return evaluate(user, topic)
                table.put_item(Item=lastObject)
                if int(countNow) >= int(topicResponse['Item']['numberOfTestQuestions']):
                    #User answered required number of questions. Evaluate
                    return evaluate(user, topic)
                else:
                    #Send new question to user
                    question = questionPick(user, topic, topicResponse['Item']['numberOfQuestions'])
                    table.put_item(
                                Item={
                                        'PK': "USER#" + user + "#ANSWERS#" + topic,
                                        'sortKey': str(int(countNow) + 1 ),
                                        'text': '',
                                        'True': 'False',
                                        'questionId' :question['PK'],
                                    }
                                )
                    return collectAnswers(question)                

    else:
        return Fail

#Check the given answer is true or false. Return bool
def checkAnswer(questionId, answer):
    try:
        answersResponse = table.query(
            KeyConditionExpression=Key('PK').eq(questionId + '#ANSWER')
        )
    except ClientError as e:
        print(e.answersResponse['Error']['Message'])
    else:
        for option in answersResponse['Items']:
            if answer == option['text']:
                #This is the selection that user made
                if option['True'] == 'True':
                    return True
        return False
