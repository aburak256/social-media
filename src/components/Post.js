import React, { Component } from 'react'
import {API} from "aws-amplify";
import { Image} from "@chakra-ui/react"
import {  SkeletonCircle, SkeletonText } from "@chakra-ui/react"
import { VStack, Box, Badge, HStack, Text} from '@chakra-ui/layout';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons'
import {Popularity} from './Popularity';
import {Link} from 'react-router-dom'
import SendComment from './SendComment';
const Editor = require('react-medium-editor').default;
require('medium-editor/dist/css/medium-editor.css');
require('medium-editor/dist/css/themes/default.css');

export class Post extends Component {
    state = {
        comments: [],
        post: [],
        loading:true,
        interact:false,
    }
    
    async componentDidMount() {
        const path = '/posts/' + (this.props.post).toString()
        const data = await API.get(`topicsApi`, path)
        this.setState({ loading: false, post: data["post"], comments: data["comments"] })
    }


    async postLike(postId){
        const path = '/posts/' + postId
        const myInit = {
            body: {
                reaction: 'Like'
            }
        }
        const data = await API.post(`topicsApi`, path, myInit)
        this.setState({post: data["post"]})
    }


    async postDislike(postId){
        const path = '/posts/' + postId
        const myInit = {
            body: {
                reaction: 'Dislike'
            }
        }
        const data = await API.post(`topicsApi`, path, myInit)
        this.setState({post: data["post"]})
    }

    async commentLike(commentId, index){
        const path = '/comments/' + commentId
        const postId = (this.state.post[0]['postId'])
        let comments = this.state.comments
        const myInit = {
            body: {
                reaction: 'Like',
                post: postId
            }
        }
        const data = await API.post(`topicsApi`, path, myInit)
        comments[index] = data['comment']
        this.setState({ comments: comments})
    }

    async commentDislike(commentId, index){
        const path = '/comments/' + commentId
        const postId = (this.state.post[0]['postId'])
        let comments = this.state.comments
        const myInit = {
            body: {
                reaction: 'Dislike',
                post: postId
            }
        }
        const data = await API.post(`topicsApi`, path, myInit)
        comments[index] = data['comment']
        this.setState({ comments: comments})
    }
    
    handlePostComment = (comment) =>{
        let comments = this.state.comments
        comments.splice(0, 0, comment.comment)
        this.setState({comments: comments}) 
    }

    topicArrange(topic){
        topic = topic.toLowerCase()
        return '/topics/' +  topic.charAt(0).toUpperCase() + topic.slice(1)
    }

    render() {
        return (
            <VStack w="90%">
            {this.state.loading ? 
                <Box w='100%' padding="6" boxShadow="lg" bg="white">
                    <SkeletonCircle size="100" />
                    <SkeletonText mt="4" noOfLines={6} spacing="4" />
                </Box>
                :  
                <>     
                    {this.state.post.map(p =>
                    <Box w="75%" boxShadow='lg' borderWidth="1px" borderRadius="lg" overflow="hidden">
                        {p.imageURL ? 
                            <Image w='100%' maxW='100vh' maxH='300vh' src={p.imageURL} alt={p.text} />
                            :
                            <Box></Box>
                        }
                        <Box p='6'>
                        <HStack alignItems="baseline" w='100%' mb='2'>
                            <Badge borderRadius="full" px="2" colorScheme="teal">
                                <Link to={'/profile/' + p.userId}>
                                {p.username}
                                </Link>
                            </Badge>
                            <Box
                                color="gray.400"
                                fontWeight="semibold"
                                letterSpacing="wide"
                                fontSize="xs"
                                textTransform="uppercase"
                                ml="6"
                                pl='2'
                            >
                                Posted at {p.dateTime}
                            </Box>
                            <Box flex='1' align='right'>
                                <Link to={() => this.topicArrange(p.topicId)}>
                                    <Badge 
                                        color="gray.600"
                                        borderRadius="lg"
                                        colorScheme="orange"
                                        fontWeight="semibold"
                                        letterSpacing="wide"
                                        fontSize="xs"
                                        textTransform="uppercase"
                                        ml="6"
                                        p='1'>
                                    {p.topicId}
                                    </Badge>
                                </Link>
                            </Box>
                            </HStack>
                            <Text
                                my="5"
                                fontWeight="semibold"
                                as="h4"
                                lineHeight="tight"
                            >
                                <Editor text={p.text}  options={{
                                    toolbar: {buttons: []},
                                    disableEditing: true 
                                    }}/>
                                
                            </Text>
                            <Box d="flex" mt="2" alignItems="center">
                                <button id={p.postId} onClick={() => this.postLike(p.postId)}>
                                    <ChevronUpIcon
                                        key={p.numberOfLikes}
                                        color = {p.Reaction == "Like" ? "teal.300" : "gray.300"}
                                        w={8} h={8}
                                    />
                                </button>
                                <Box as="span" ml="2" color="gray.600" fontSize="sm">
                                    {p.numberOfLikes}
                                </Box>
                                <button id={p.postId} onClick={() => this.postDislike(p.postId)}>
                                    <ChevronDownIcon
                                        key={p.numberOfDislikes}
                                        ml='5'
                                        color = {p.Reaction == "Dislike" ? "red.300" : "red.100"} 
                                        w={8} h={8}
                                    />
                                </button>
                                <Box as="span" ml="2" color="gray.600" fontSize="sm">
                                    {p.numberOfDislikes}
                                </Box>

                                <Popularity likes={parseInt(p.numberOfLikes)} dislikes={parseInt(p.numberOfDislikes)}/>
                                
                            </Box>
                        </Box>
                    </Box>)}
                    <VStack w='100%' p='6' spacing='17px'>
                        <SendComment post={this.props.post} onPostComment={this.handlePostComment}/>
                        {this.state.comments.map((comment, index) =>
                            <Box w='70%' boxShadow='md' bg='teal.50' padding='4' borderRadius='md'>
                                <HStack padding='2'>
                                    <Text
                                        color="gray.400"
                                        fontWeight="semibold"
                                        letterSpacing="wide"
                                        fontSize="xs"
                                        textTransform="uppercase"
                                        >
                                        {comment.username}
                                    </Text>
                                    <Text
                                        color="gray.400"
                                        flex="1"
                                        textAlign='right'
                                        fontWeight="semibold"
                                        letterSpacing="wide"
                                        fontSize="xs"
                                        textTransform="uppercase"
                                        >
                                        {comment.dateTime}
                                    </Text>
                                </HStack>
                                <Box marginBottom='1'>
                                    <Text
                                        color="gray.600"
                                        letterSpacing="wide"
                                        fontSize="sm"
                                    >
                                        {comment.text}
                                    </Text>
                                    <Box d="flex" mt="2" alignItems="center">
                                        <button id={comment.commentId} onClick={() => this.commentLike(comment.commentId, index)}>
                                            <ChevronUpIcon
                                                key={comment.numberOfLikes}
                                                color= {comment.Reaction == "Like" ? "teal.300" : "teal.100"} 
                                                w={8} h={8}
                                            />
                                        </button>
                                        <Box as="span" ml="2" color="gray.600" fontSize="sm">
                                            {comment.numberOfLikes}
                                        </Box>
                                        <button id={comment.commentId} onClick={() => this.commentDislike(comment.commentId, index)}>
                                        <ChevronDownIcon
                                            key={comment.numberOfDislikes}
                                            ml='5'
                                            color= {comment.Reaction == "Dislike" ? "red.300" : "red.100"} 
                                            w={8} h={8}
                                        />
                                        </button>
                                        <Box as="span" ml="2" color="gray.600" fontSize="sm">
                                            {comment.numberOfDislikes}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                            )}
                    </VStack>
                </> }
            </VStack>
        )
    }
}

export default Post
