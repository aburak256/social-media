import React, { Component } from 'react'
import {API} from "aws-amplify";
import {Auth} from 'aws-amplify'
import { Spinner, Image,  Stack} from "@chakra-ui/react"
import { Skeleton, SkeletonCircle, SkeletonText } from "@chakra-ui/react"
import { VStack, Box, Badge, HStack, Text, Center} from '@chakra-ui/layout';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons'

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
                            <Image w='100%' src={p.imageURL} alt={p.text} />
                            :
                            <Box></Box>
                        }
                        <Box p='6'>
                            <Box d="flex" alignItems="baseline">
                                <Badge borderRadius="full" px="2" colorScheme="teal">
                                    {/* Add link to username (future work) */}
                                    {p.username}
                                </Badge>
                                <Box
                                    color="gray.400"
                                    fontWeight="semibold"
                                    letterSpacing="wide"
                                    fontSize="xs"
                                    textTransform="uppercase"
                                    ml="2"
                                >
                                    Posted at {p.dateTime} &bull; {p.relatedTopic}
                                </Box>
                            </Box>
                            <Text
                                my="5"
                                fontWeight="semibold"
                                as="h4"
                                lineHeight="tight"
                            >
                                {p.text}
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
                            </Box>
                        </Box>
                    </Box>)}
                    <VStack w='100%' p='6' spacing='17px'>
                        {this.state.comments.map(comment =>
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
                                        <ChevronUpIcon
                                            key={comment.numberOfLikes}
                                            color= "teal.100" 
                                            w={8} h={8}
                                        />
                                        <Box as="span" ml="2" color="gray.600" fontSize="sm">
                                            {comment.numberOfLikes}
                                        </Box>
                                        <ChevronDownIcon
                                            key={comment.numberOfDislikes}
                                            ml='5'
                                            color= "red.100" 
                                            w={8} h={8}
                                        />
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
