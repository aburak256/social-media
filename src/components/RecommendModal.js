import React, { Component } from 'react'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    VStack,
    Box,
    Image,
    Badge,
    Text
  } from "@chakra-ui/react"
import {API} from "aws-amplify";
import {Link} from 'react-router-dom'
import { ViewIcon, CheckCircleIcon } from '@chakra-ui/icons'


export class RecommendModal extends Component {
    state={
        topics: [],
        open: true,
    }

    async componentDidMount(){
        const data = await API.get(`topicsApi`, '/topics')
        this.setState({topics: data})
        console.log(data)
    }

    async followTopic(topic, index){
        const path = '/topics/' + topic.toUpperCase()
        const myInit = {
            body: {
                type: 'follow'
            }
        }
        const data = await API.post(`topicsApi`, path, myInit)
        let topics = this.state.topics
        topics[index]['follow'] = data['followInfo']
        this.setState({topics: topics})        
    }

    render() {
        return (
            <div>
                <Modal isOpen={this.state.open} size='xl' onClose={() => this.setState({open: false})}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Follow topics</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody w='100%'>
                            <VStack>
                            { this.state.topics.map((topic, index) => 
                                <Box w='100%' borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="lg" mt='4'>
                                    <Link to={'/topics/' + topic.topic }>
                                        <Image src={topic.imageURL} alt={topic.topic} />
                                    </Link>       
                                        <Box p="6" bg='white' mb='2'>
                                            <Box alignItems="baseline">
                                                <Badge borderRadius="full" px="2" colorScheme="teal">
                                                    <Text >
                                                        {topic.topic}
                                                    </Text>
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
                                                <ViewIcon  color="teal.500"/>
                                                <Box as="span" ml="2" color="gray.600" fontSize="md">
                                                    {topic.popularity}
                                                </Box>
                                                <CheckCircleIcon  color="teal.500" ml='5'/>
                                                <Box as="span" ml="2" color="gray.600" fontSize="md">
                                                    {topic.numberOfFollowers}
                                                </Box>
                                                <Box as="span" ml="4" color="gray.600" fontSize="md">
                                                    <Button onClick={() => this.followTopic(topic.topic, index)} bg={topic.follow == 'True' ? 'red.400' : 'teal.400'}>
                                                        {topic.follow == 'True' ? 'Unfollow' : 'Follow'}
                                                    </Button>
                                                </Box>
                                            </Box>             
                                        </Box>
                                </Box>
                                )}
                            </VStack>
                        </ModalBody>

                        <ModalFooter>
                            <Button colorScheme="blue" mr={3} onClick={() => this.setState({open: false})}>
                                Close
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        )
    }
}

export default RecommendModal
