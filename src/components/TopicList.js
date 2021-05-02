import React from 'react';
import axios from 'axios';
import { VStack, Box, Badge, HStack, Text} from '@chakra-ui/layout';
import {Link} from 'react-router-dom'
import { ViewIcon } from '@chakra-ui/icons'
import { Image } from "@chakra-ui/react"
import {API} from "aws-amplify";


export default class PostList extends React.Component {
  state = {
    topics: []
  }

  async componentDidMount() {
    const data = await API.get(`topicsApi`, '/topics')
    const topics = data
    console.log(topics)
    this.setState({ topics })
    }

  render() {
    return (
        <VStack w="80%">     
          { this.state.topics.map(topic => 
          <Box w="80%" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="lg">  
            <Image src={topic.imageURL} alt={topic.topic} />       
            <Box p="6">
              <Box alignItems="baseline">
                <Badge borderRadius="full" px="2" colorScheme="teal">
                <Link to={'/topics/' + topic.topic }>
                  {topic.topic}
                </Link>
                </Badge>
              </Box>     
              <Text
                mt="2"
                fontWeight="semibold"
                lineHeight="tight"
                noOfLines={[1, 2, 3]}
              >
                { topic.text }
              </Text>
      
              <Box d="flex" mt="2" alignItems="center">
                {/* This will be some kind of a popularity metric*/}                
                <ViewIcon  color="teal.500"/>
                <Box as="span" ml="2" color="gray.600" fontSize="md">
                  {topic.numberOfFollowers}
                </Box>
              </Box>             
            </Box>
          </Box>             
          )}
        </VStack>
    )
  }
}