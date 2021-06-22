import { HStack, StackDivider, Box } from '@chakra-ui/layout'
import React, { Component } from 'react'
import {Conversations} from '../Conversations'
import {Message} from '../Message'

export class Messages extends Component {
    state = {
        selectedConversationId: null
    }

    showmessages = (conversationId) => {
        //Send conversationId to Message component
        this.setState({selectedConversationId : conversationId})
    }

    render(){
        return (
            <div className="messages">
                <title>Messages</title>
                <HStack
                    divider={<StackDivider borderColor="gray.200" />}
                    spacing={4}
                    align="right"
                    bg='white'
                    mt='2'
                    h='93vh'
                    w='45vw'
                    ml='15vw'
                >
                    <Box w='20vw' h='93vh'>
                        <Conversations onSelectConversation={this.showmessages.bind(this)}/>
                    </Box>
                    <Box w='25vw' h='93vh'>
                        <Message conversation={this.state.selectedConversationId}/>
                    </Box>
                </HStack>
            </div>
        )
    }
}

export default Messages
