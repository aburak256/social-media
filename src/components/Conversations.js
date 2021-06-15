import React, { Component } from 'react'
import {API} from "aws-amplify";
import { Text, VStack, Box, StackDivider, HStack } from '@chakra-ui/layout';
import { Image } from '@chakra-ui/image';

export class Conversations extends Component {
    state = {
        conversations: []
    }

    async componentDidMount(){
        const path = '/conversations/'
        const data = await API.get(`topicsApi`, path)
        this.setState({ conversations: data['conversations']})

        //Refresh the list of conversations at every 10 seconds
        setInterval(async () => {
            const path = '/conversations/'
            const data = await API.get(`topicsApi`, path)
            this.setState({ conversations: data['conversations']})
        }, 10000);       
    }

    selectConversation (conversation) {
        const conversationId = conversation.conversationId
        this.props.onSelectConversation(conversationId)
    }

    render() {
        return (
            <VStack bg='white' w='100%' px='1' h='100%' divider={<StackDivider borderColor="gray.200" />} overflowY='scroll' boxShadow="lg" sx={{
                '&::-webkit-scrollbar': {
                width: '8px',
                borderRadius: '8px',
                backgroundColor: `rgba(0, 0, 0, 0.05)`,
                },
                '&::-webkit-scrollbar-thumb': {
                backgroundColor: `rgba(0, 0, 0, 0.05)`,
                },
            }}>
                <Box
                    bg='gray.200'
                    w='100%'
                    h='5vh'
                    pt='1vh'
                    mt='1'
                    borderRadius='lg'
                    align="center"
                >
                    <Text
                        fontWeight="semibold"
                        lineHeight="tight"
                        fontSize='xl'
                    >
                        Messages
                    </Text>
                </Box>
                {this.state.conversations.map((conversation, index) => 
                    <HStack
                        w='100%'
                        h='8vh'
                        pl='1.5vh'
                        borderRadius='lg'
                        _hover={{
                            bg: 'gray.100',
                        }} 
                    >   
                        {conversation.Image ? <Image src={conversation.image} h='5vh' maxW='5vh' borderRadius='lg'/> : <Image src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxxnv-Gfi0iwmcUHwRzfBSHutl9CsYoSd0Xg&usqp=CAU" h='5vh' maxW='5vh' borderRadius='lg'/>}
                        <button onClick={() => this.selectConversation(conversation)}>
                            <HStack w='100%' >             
                                    <Box >
                                        <Text fontSize='md' isTruncated w='20vh' align='left'>
                                            {conversation.userName}
                                        </Text>
                                        <Text fontSize='xs' isTruncated w='20vh' align='left'>
                                            {conversation.lastMessage}
                                        </Text>
                                    </Box>
                                    <Box w='100%' pr='2' align='right' fontSize='xs' >
                                        {conversation.dateTime}
                                    </Box>   
                            </HStack>
                        </button>
                    </HStack>
                )}

            </VStack>
        )
    }
}

export default Conversations
