import React from 'react';
import { VStack, Box, Badge, Text} from '@chakra-ui/layout';
import {Link} from 'react-router-dom'
import { ViewIcon } from '@chakra-ui/icons'
import { Image, SkeletonCircle, SkeletonText } from "@chakra-ui/react"
import {API} from "aws-amplify";


export default class PostList extends React.Component {
  state = {
    topics: [],
    loading: true
  }

  async componentDidMount() {
    const data = await API.get(`topicsApi`, '/topics')
    const topics = data
    console.log(topics)
    this.setState({ loading: false})
    this.setState({ topics })
    }

  render() {
    return (
        <VStack w="80%">
          {this.state.loading ? 
            <Box w='100%' padding="6" boxShadow="lg" bg="white">
              <SkeletonCircle size="100" />
              <SkeletonText mt="4" noOfLines={6} spacing="4" />
            </Box>
          :  
          <>     
          { this.state.topics.map(topic => 
          <Box w="80%" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="lg" mt='4'>  
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
          )} </>
        }
        </VStack>
    )
  }
}