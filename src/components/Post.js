import React, { Component } from 'react'
import {API} from "aws-amplify";
import { Spinner, Image } from "@chakra-ui/react"
import { VStack, Box, Badge, HStack, Text} from '@chakra-ui/layout';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons'

export class Post extends Component {
    state = {
        comments: [],
        post: [],
        loading:true
    }
      
    async componentDidMount() {
        const path = '/posts/' + (this.props.post).toString()
        const data = await API.get(`topicsApi`, path)
        this.setState({  loading:false, post: data["post"], comments: data["comments"] })
    }
    
    render() {
        return (
            <VStack w="80%">
            {this.state.loading ? 
                <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="blue.500"
                size="xl"
                />
                :  
                <>     
                    {this.state.post.map(p =>
                    <Box w="75%" boxShadow='lg' borderWidth="1px" borderRadius="lg" overflow="hidden">
                        {p.imageURL ? 
                            <Image src={p.imageURL} alt={p.text} />
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
                                <ChevronUpIcon
                                    key={p.numberOfLikes}
                                    color= "teal.300" 
                                    w={8} h={8}
                                />
                                <Box as="span" ml="2" color="gray.600" fontSize="sm">
                                    {p.numberOfLikes}
                                </Box>
                                <ChevronDownIcon
                                    key={p.numberOfDislikes}
                                    ml='5'
                                    color= "red.400" 
                                    w={8} h={8}
                                />
                                <Box as="span" ml="2" color="gray.600" fontSize="sm">
                                    {p.numberOfDislikes}
                                </Box>
                            </Box>
                        </Box>
                    </Box>)}

                    {this.state.comments.map(comment => <Text>{comment.text} </Text>)}
                </> }
            </VStack>
        )
    }
}

export default Post
