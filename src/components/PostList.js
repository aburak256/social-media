import React from 'react';
import { VStack, Box, Badge, HStack, Text} from '@chakra-ui/layout';
import { ChevronUpIcon, ChevronDownIcon , ChatIcon } from '@chakra-ui/icons'
import {API} from "aws-amplify";
import { Image, SkeletonCircle, SkeletonText, Button } from "@chakra-ui/react"
import {Link} from 'react-router-dom'
import { Popularity } from './Popularity';
import {SendPost} from './SendPost'


export default class PostList extends React.Component {
  state = {
    posts: [],
    loading:true,
    sizeOfArray: '',
    permission: false,
  }
  
  async componentDidMount() {
    const path = '/topics/' + (this.props.topic).toUpperCase()
    const data = await API.get(`topicsApi`, path)
    this.setState({ title: this.props.topic , sizeOfArray: data['posts'].length, posts: data['posts'], permission: data['permission']})
    this.setState({ loading: false })
  }

  async postLike(postId, index){
    const path = '/posts/' + postId
    const myInit = {
        body: {
            reaction: 'Like'
        }
    }
    const data = await API.post(`topicsApi`, path, myInit)
    let posts = this.state.posts
    posts[index] = data["post"][0]
    this.setState({posts: posts})
  }

  async postDislike(postId, index){
    const path = '/posts/' + postId
    const myInit = {
        body: {
            reaction: 'Dislike'
        }
    }
    const data = await API.post(`topicsApi`, path, myInit)
    let posts = this.state.posts
    posts[index] = data["post"][0]
    this.setState({posts: posts})
}

  render() {
    return (
        <VStack w="100%">
          {this.state.loading ? 
            <Box w='100%' padding="6" boxShadow="lg" bg="white">
              <SkeletonCircle size="100" />
              <SkeletonText mt="4" noOfLines={6} spacing="4" />
            </Box>
            :  
            <>{this.state.sizeOfArray ?          
            <> {this.state.permission == 'Writer' ? <> <SendPost/> </>: 
              <>
                <VStack>
                  <Text
                    fontWeight="semibold"
                    lineHeight="tight"
                    fontSize='lg'
                  >
                    You are not a writer. If you want you can take test
                  </Text>
                  <Link to={'/test/' + this.props.topic}>
                    <Button bg='teal.200'>Go to Test</Button>
                  </Link>      
                </VStack>
              </>}          
            {this.state.posts.map((post, index) => 
            <Box w="80%" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="lg" key={post.PK}>         
              <Box p="4" paddingLeft="4">
                <Box alignItems="baseline">
                  <Badge borderRadius="full" px="2" colorScheme="teal">
                  {post.username}
                  </Badge>
                </Box>
                <HStack>     
                  <Text
                    w='70%'
                    mt="2"
                    fontWeight="semibold"
                    lineHeight="tight"
                    noOfLines={[1, 2, 3, 4]}
                  >
                    <Link to={'/posts/' + post.postId }>
                      {post.text}
                    </Link>
                  </Text>
                  <Box
                    w='30%'
                  >
                    <Image w='100%' borderRadius='xl'  src={post.imageURL}/>
                  </Box>
                </HStack>
                <Box d="flex" mt="4" alignItems="center">
                  <button id={post.postId} onClick={() => this.postLike(post.postId, index)}>                
                    <ChevronUpIcon w={8} h={8} color={post.Reaction == "Like" ? "teal.300" : "teal.100"}/>
                  </button>
                  <Box
                    as="span"
                    color={post.Reaction == "Like" ? "teal.300" : "gray.300"}
                    fontSize="sm"
                    >
                    {post.numberOfLikes}
                  </Box>
                  <button id={post.postId} onClick={() => this.postDislike(post.postId, index)}>
                    <ChevronDownIcon w={8} h={8} ml="4" color={post.Reaction == "Dislike" ? "red.300" : "red.100"}/>
                  </button>
                  <Box as="span" color={post.Reaction == "Dislike" ? "red.300" : "gray.300"} fontSize="sm">
                    {post.numberOfDislikes}
                  </Box>
                  <Popularity likes={post.numberOfLikes} dislikes={post.numberOfDislikes}/>
                  <Text
                    fontSize='sm'
                    ml='7'
                  >
                    <ChatIcon
                      color='teal.500'
                    /> : {post.numberOfComments}
                  </Text>
                </Box>             
              </Box>
            </Box>             
            )} </>: 
            <Box>
              No posts in this topic 
            </Box>
            }
            </>
          }
        </VStack>
    )
  }
}