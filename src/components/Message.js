import React, { Component } from 'react'
import {API} from "aws-amplify";
import { Text, VStack, Box, StackDivider, HStack, Center, Flex, Spacer } from '@chakra-ui/layout';
import {InfoOutlineIcon} from '@chakra-ui/icons'
import { Image } from '@chakra-ui/image';
import {Icon, Button} from '@chakra-ui/react'
import {BsFillReplyAllFill} from 'react-icons/bs'
import {RiDeleteBinLine} from 'react-icons/ri'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
  } from "@chakra-ui/react"

export class Message extends Component {
    state = {
        messages:[],
        userInfo: '',
        replySelection: null,
        modal: false,
        deleteSelection: null
    }   

    async componentDidUpdate(prevProps){
        if(this.props.conversation !== prevProps.conversation){
            const path = '/conversations/' + this.props.conversation
            const data = await API.get(`topicsApi`, path)
            console.log(data)
            this.setState({messages: data['messages'].reverse(), userInfo: data['userInfo']})
        }
    }

    deleteMessageModalOpen(message){
        this.setState({ deleteSelection: message, modal:true})
    }

    selectReply(text){
        this.setState({replySelection : text})
    }

    render() {
        return (
            <VStack w='100%' align='left' boxShadow="lg">
                {this.state.userInfo ?
                    <HStack w='50%' h='5vh' bgGradient="linear(to-r,gray.200,teal.200,green.200)" align='left' pl='4' py='2.5' borderRadius='md'>
                        {this.state.userInfo.image ? 
                            <Image src={this.state.userInfo.image} h={6} maxW={6} />
                        :
                            <InfoOutlineIcon w={6} h={6} />
                        }
                        <Text ml='3'>
                            {this.state.userInfo.username}
                        </Text>
                    </HStack> 
                : <> </>}
                <VStack w='50%' h='90vh' bgGradient="linear(to-r,gray.50,teal.50,green.50)" spacing={3}>
                    {this.state.messages.map((message, index) =>  
                        <Box
                            w='100%'
                            align={message.sender == 'user' ? 'right' : 'left'}
                            px='2'
                            >
                                {message.reply ? 
                                <Text
                                    bgGradient="linear(to-r,gray.400,gray.50)"
                                    maxW='25vh'
                                    pl = {message.sender == 'user' ? '2' : '4'}
                                    pr = {message.sender == 'user' ? '4' : '2'}
                                    borderRadius='lg'
                                    mb='1'
                                    fontSize='xs'
                                >
                                    Replied to: {message.reply.text}
                                </Text> : <> </>
                                }
                                <Flex w='55%'>
                                    {message.sender == 'user' ? 
                                    <>
                                        <Modal onClose={() => this.setState({modal:false})} isOpen={this.state.modal} isCentered>
                                            <ModalOverlay />
                                            <ModalContent>
                                            <ModalHeader>Modal Title</ModalHeader>
                                            <ModalCloseButton />
                                            <ModalBody>
                                                Do you want to delete selected message?
                                                <br/>
                                                Message: {this.state.deleteSelection}
                                            </ModalBody>
                                            <ModalFooter>
                                                <Button onClick={this.deleteMessage}>Close</Button>
                                            </ModalFooter>
                                            </ModalContent>
                                        </Modal>
                                        <Box mr='2' my='auto'>
                                            <button onClick={() => this.deleteMessageModalOpen(message.text)}>
                                                <Icon as={RiDeleteBinLine} color='red'/>
                                            </button>
                                        </Box>
                                        <Box mr='2' my='auto'>
                                            <button onClick={() => this.selectReply(message.text)}>
                                                <Icon as={BsFillReplyAllFill} />
                                            </button> 
                                        </Box>
                                        <Spacer /> 
                                    </> :
                                    <>
                                    </>
                                    }
                                    <Text
                                        bgGradient="linear(to-r,gray.200,teal.200,green.200)"
                                        maxW='35vh'
                                        pl = {message.sender == 'user' ? '2' : '4'}
                                        pr = {message.sender == 'user' ? '4' : '2'}
                                        borderRadius='lg'
                                        fontSize='md'
                                    >
                                        {message.text}
                                    </Text>
                                    {message.sender == 'friend' ?
                                    <> 
                                        <Spacer />
                                        <Box ml='2' my='auto'>
                                            <button onClick={() => this.selectReply(message.text)}>
                                                <Icon as={BsFillReplyAllFill} />
                                            </button> 
                                        </Box>
                                         
                                    </>
                                    :
                                    <>
                                    </>
                                    }
                                </Flex>
                        </Box>   
                    )}
                </VStack>
            </VStack>
        )
    }
}

export default Message
