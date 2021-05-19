import React from 'react';
import { VStack, Box, Badge, HStack, Text} from '@chakra-ui/layout';
import { ChevronUpIcon, ChevronDownIcon , ChatIcon } from '@chakra-ui/icons'
import {API} from "aws-amplify";
import { Spinner, Image,  Skeleton, SkeletonCircle, SkeletonText } from "@chakra-ui/react"
import {Link} from 'react-router-dom'


export default class PostList extends React.Component {
  state = {
    posts: [],
    loading:true,
    sizeOfArray: '',

  }
  
  async componentDidMount() {
    const path = '/topics/' + (this.props.topic).toUpperCase()
    const data = await API.get(`topicsApi`, path)
    this.setState({ title: this.props.topic , sizeOfArray: data.length})
    this.setState({ loading: false })
    this.setState({ posts: data })
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
            <>{this.state.sizeOfArray ? <> {this.state.posts.map(post => 
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
                    noOfLines={[1, 2, 3]}
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
                  {/* Number of Likes, Like button and same for dislikes will come here. Also look new icons for like and dislike */}                
                  <ChevronUpIcon w={8} h={8} color="teal.500"/>
                  <Box as="span"  color="gray.600" fontSize="sm">
                    {post.numberOfLikes}
                  </Box>
                  <ChevronDownIcon w={8} h={8} ml="4" color="gray.300"/>
                  <Box as="span" color="gray.600" fontSize="sm">
                    {post.numberOfDislikes}
                  </Box>
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