import React from 'react';
import axios from 'axios';
import { VStack, Box, Badge, HStack, Text} from '@chakra-ui/layout';
import { ViewIcon } from '@chakra-ui/icons'


export default class PostList extends React.Component {
  state = {
    topics: []
  }

  componentDidMount() {
    axios.get(`https://my-json-server.typicode.com/typicode/demo/posts`)
      .then(res => {
        const topics = res.data;
        console.log(topics)
        this.setState({ topics });
      })
  }

  render() {
    return (
        <VStack w="80%">     
          { this.state.topics.map(topic => 
          <Box w="80%" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="lg">         
            <Box p="6">
              <Box alignItems="baseline">
                <Badge borderRadius="full" px="2" colorScheme="teal">
                {topic.title} - This will be topic title 
                </Badge>
              </Box>     
              <Text
                mt="2"
                fontWeight="semibold"
                lineHeight="tight"
                noOfLines={[1, 2, 3]}
              >
                This is the topic description
              </Text>
      
              <Box d="flex" mt="2" alignItems="center">
                {/* This will be some kind of a popularity metric*/}                
                <ViewIcon  color="teal.500"/>
                <Box as="span" ml="2" color="gray.600" fontSize="md">
                  4845
                </Box>
              </Box>             
            </Box>
          </Box>             
          )}
        </VStack>
    )
  }
}