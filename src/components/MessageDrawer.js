import React, { Component } from 'react'
import ConversationsInDrawer from './ConversationsInDrawer'
import {MessageInDrawer} from './MessageInDrawer'
import {
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    useDisclosure ,
    Button,
    Input,
    VStack
  } from "@chakra-ui/react"

  export class MessageDrawer extends Component {
    state = {
        isOpen: false
    }

    onOpen(){
        this.setState({isOpen: true})
    }

    onClose(){
        this.setState({isOpen: false})
    }

    showmessages = (conversationId) => {
        //Send conversationId to Message component
        this.setState({selectedConversationId : conversationId})
    }
    
    render (){
        return (
            <>
                <Button  colorScheme="black" onClick={this.onOpen.bind(this)}>
                    Messages
                </Button>
                <Drawer
                    isOpen={this.state.isOpen}
                    placement="right"
                    onClose={this.onClose.bind(this)}
                    size='md'
                    >
                    <DrawerOverlay />
                    <DrawerContent>
                        <DrawerCloseButton />
                        <DrawerHeader>Messages</DrawerHeader>

                        <DrawerBody>
                            <VStack spacing='5'>
                                <ConversationsInDrawer onSelectConversation={this.showmessages.bind(this)}/>
                                <MessageInDrawer conversation={this.state.selectedConversationId}/>
                            </VStack>
                        </DrawerBody>

                            <DrawerFooter>
                            <Button variant="outline" mr={3} onClick={this.onClose.bind(this)}>
                                Cancel
                            </Button>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            </>
        )
    }
}

export default MessageDrawer
