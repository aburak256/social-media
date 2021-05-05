import React from 'react';
import { VStack, Box, Badge, HStack, Text} from '@chakra-ui/layout';
import { StarIcon } from '@chakra-ui/icons'
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
              <Box p="6">
                <Box alignItems="baseline">
                  <Badge borderRadius="full" px="2" colorScheme="teal">
                  {post.username}
                  </Badge>
                </Box>     
                <Text
                  mt="2"
                  fontWeight="semibold"
                  lineHeight="tight"
                  noOfLines={[1, 2, 3]}
                >
                  <Link to={'/posts/' + post.postId }>
                    {post.text}
                  </Link>
                </Text>
                <Text>
                  Comments : {post.numberOfComments}
                </Text>
                <Box d="flex" mt="2" alignItems="center">
                  {/* Number of Likes, Like button and same for dislikes will come here. Also look new icons for like and dislike */}                
                  <StarIcon  color="teal.500"/>
                  <Box as="span" ml="2" color="gray.600" fontSize="md">
                    {post.numberOfLikes}
                  </Box>
                  <StarIcon  ml="6" color="gray.300"/>
                  <Box as="span" ml="2" color="gray.600" fontSize="sm">
                    {post.numberOfDislikes}
                  </Box>
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