import React from 'react';
import axios from 'axios';
import { VStack, Box, Badge, HStack, Text} from '@chakra-ui/layout';
import { StarIcon } from '@chakra-ui/icons'


export default class PostList extends React.Component {
  state = {
    posts: []
  }

  componentDidMount() {
    axios.get(`https://my-json-server.typicode.com/typicode/demo/posts`)
      .then(res => {
        const posts = res.data;
        console.log(posts)
        this.setState({ posts });
      })
  }

  render() {
    return (
        <VStack w="100%">     
          { this.state.posts.map(post => 
          <Box w="80%" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="lg">         
            <Box p="6">
              <Box alignItems="baseline">
                <Badge borderRadius="full" px="2" colorScheme="teal">
                  Username
                </Badge>
              </Box>     
              <Text
                mt="2"
                fontWeight="semibold"
                lineHeight="tight"
                noOfLines={[1, 2, 3]}
              >
                {post.title}
              </Text>
      
              <Box d="flex" mt="2" alignItems="center">
                {/* Number of Likes, Like button and same for dislikes will come here. Also look new icons for like and dislike */}                
                <StarIcon  color="teal.500"/>
                <Box as="span" ml="2" color="gray.600" fontSize="md">
                  45
                </Box>
                <StarIcon  ml="6" color="gray.300"/>
                <Box as="span" ml="2" color="gray.600" fontSize="sm">
                  23
                </Box>
              </Box>             
            </Box>
          </Box>             
          )}
        </VStack>
    )
  }
}