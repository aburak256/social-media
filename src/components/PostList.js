import React from 'react';
import axios from 'axios';
import { VStack, Box, Badge, HStack, Text} from '@chakra-ui/layout';
import { StarIcon } from '@chakra-ui/icons'
import {API} from "aws-amplify";
import { Spinner } from "@chakra-ui/react"
import {Link} from 'react-router-dom'


export default class PostList extends React.Component {
  state = {
    posts: [],
    loading:true
  }
  
  async componentDidMount() {
    const path = '/topics/' + (this.props.topic).toUpperCase()
    const data = await API.get(`topicsApi`, path)
    console.log(data)
    this.setState({ loading: false })
    this.setState({ posts: data })
  }

  render() {
    return (
        <VStack w="100%">
          {this.state.loading ? 
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
              size="xl"
            />
            :  
            <>{this.state.posts.map(post => 
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
                  {post.text}
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
            )}</>
          }
        </VStack>
    )
  }
}