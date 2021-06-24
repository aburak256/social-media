# Social Media Application

[Live link of the project](https://main.d2xe8y05ho8c70.amplifyapp.com/ "Live link of the project")

## Introduction
Social media platform with topics built with **AWS serverless and Reactjs frontend**. Users can only post after passing a quiz about the topic. Designed a **NoSql single table** to store data using **AWS DynamoDB**. Generated personalized timeline for users. Utilized REST to send the API requests. Added like, dislike, bookmark and comment features to posts. To provide private communication between users, added messaging interface with reply, seen and send post features. Utilized **AWS Amplify** framework to build the app in case if I need to implement a mobile application.

All of the data of this project is stored by a single AWS DynamoDB NoSql table. 

Utilized AWS Cognito to handle the authentication. After user is confirmed their e-mail, a [lambda function](https://github.com/aburak256/social-media/blob/main/Other%20Lambdas/userPoolLambda.py) triggered and creates the user information in database.

Utilized [Boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html) library to handle database and bucket operations with python.

## [Lambda Files](https://github.com/aburak256/social-media/tree/main/amplify/backend/function "Lambda Files")

There are 10 different lambda function and 8 api path in this project. Utilized AWS Api Gateway to route the requests.

[commentsLambda](https://github.com/aburak256/social-media/tree/main/amplify/backend/function/commentsLambda "commentsLambda") - Operations about comments in posts. 
- Like 
- Dislike 
- Post comment 

[conversationsLambda](https://github.com/aburak256/social-media/tree/main/amplify/backend/function/conversationsLambda "conversationsLambda") - Operations about messaging feature. 
- Send post as a message 
- Reply message 
- Delete message 
- Post message 
- Seen information

[postsLambda](https://github.com/aburak256/social-media/tree/main/amplify/backend/function/postsLambda "postsLambda") - Operations about posts
- Post details with comments
- Post a post
- Like
- Dislike
- Bookmark

[profileLambda](https://github.com/aburak256/social-media/tree/main/amplify/backend/function/profileLambda "profileLambda") - Operations at user profiles
- Collect user details with user's posts
- Follow - Unfollow
**For user's own profile**:
- Bio change
- Photo change

[searchLambda](https://github.com/aburak256/social-media/tree/main/amplify/backend/function/searchLambda "searchLambda") - Search operations
- Search posts
- Search usernames
- Search topics

[timelineLambda](https://github.com/aburak256/social-media/tree/main/amplify/backend/function/timelineLambda "timelineLambda") - Operations about generating timeline

[topicTestLambda](https://github.com/aburak256/social-media/tree/main/amplify/backend/function/topicTestsLambda "topicTestLambda") - Operations about quizzes
- Start quiz
- Hold logs
- Continue session if user accidentally left
- Give random question about topic
- Evaluate the results

[topicsLambda](https://github.com/aburak256/social-media/tree/main/amplify/backend/function/topicsLambda "topicsLambda") - Operations about topics
- Popularity feature
- List all topics
- Topic details with posts
- List bookmarks
- Follow / Unfollow topics

## [Imported Components (Reactjs) ](https://github.com/aburak256/social-media/tree/main/src "Imported Components (Reactjs) ")

[aws-amplify](https://docs.amplify.aws/ "aws-amplify")

[Chakra - UI](https://chakra-ui.com/ "Chakra - UI")

[Infinite Scroll](https://github.com/ankeetmaini/react-infinite-scroll-component#readme "Infinite Scroll")

[React medium editor](https://github.com/wangzuo/react-medium-editor "React medium editor")

[lodash](https://github.com/lodash/lodash "lodash")

[react-icons](https://react-icons.github.io/react-icons/ "react-icons")

Example look from topic page:
![image](https://user-images.githubusercontent.com/34773124/123256708-ee9ace00-d4f9-11eb-9023-e5526a70be40.png)

