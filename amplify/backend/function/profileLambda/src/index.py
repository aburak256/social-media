import json

def handler(event, context):
  print('received event:')
  print(event)
  
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
                                

