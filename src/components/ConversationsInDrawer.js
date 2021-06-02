import React, { Component } from 'react'
import {API} from "aws-amplify";
import { Text, VStack, Box, StackDivider, HStack } from '@chakra-ui/layout';
import { Image } from '@chakra-ui/image';

export class ConversationsInDrawer extends Component {
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
            <VStack w='100%' bgGradient="linear(to-b, gray.100, teal.50 )" boxShadow="lg" overflowY='scroll' h='40vh' sx={{
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
                    bgGradient="linear(to-r, teal.200, gray.200)"
                    w='100%'
                    h='4vh'
                    pt='1vh'
                    borderRadius='lg'
                    align="center"
                >
                    <Text
                        fontWeight="semibold"
                        lineHeight="tight"
                        fontSize='sm'
                    >
                        Messages
                    </Text>
                    <StackDivider borderColor="gray.200" />
                </Box>
                {this.state.conversations.map((conversation, index) => 
                    <HStack
                        w='100%'
                        h='6vh'
                        pl='1vh'
                        borderRadius='lg'
                        bgGradient="linear(to-r, teal.200, gray.200)"
                        _hover={{
                            bgGradient: "linear(to-r, teal.300, gray.300)",
                        }} 
                    >   
                        {conversation.Image ? <Image src={conversation.image} h='4vh' maxW='4vh' borderRadius='lg'/> : <Image src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxxnv-Gfi0iwmcUHwRzfBSHutl9CsYoSd0Xg&usqp=CAU" h='4vh' maxW='4vh' borderRadius='lg'/>}
                        <button onClick={() => this.selectConversation(conversation)}>
                            <HStack w='100%' >             
                                    <Box >
                                        <Text fontSize='sm' isTruncated w='28vh' align='left'>
                                            {conversation.userName}
                                        </Text>
                                        <Text fontSize='xs' isTruncated w='28vh' align='left'>
                                            {conversation.lastMessage}
                                        </Text>
                                    </Box>
                                    <Box w='100%' pr='2' align='right' fontSize='10' >
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

export default ConversationsInDrawer
