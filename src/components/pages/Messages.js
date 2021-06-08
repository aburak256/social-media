import { HStack, StackDivider } from '@chakra-ui/layout'
import React, { Component } from 'react'
import {Conversations} from '../Conversations'
import {Message} from '../Message'
import '../Message.css'

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
                <HStack
                    divider={<StackDivider borderColor="gray.200" />}
                    spacing={4}
                    align="stretch"
                    h='90vh'
                    ml='35vh'
                >
                    <Conversations onSelectConversation={this.showmessages.bind(this)}/>
                    <Message conversation={this.state.selectedConversationId}/>
                </HStack>
            </div>
        )
    }
}

export default Messages
