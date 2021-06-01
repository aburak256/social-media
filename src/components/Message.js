import React, { Component } from 'react'
import {API} from "aws-amplify";
import { Text, VStack, Box, StackDivider, HStack, Center, Flex, Spacer } from '@chakra-ui/layout';
import {InfoOutlineIcon, CloseIcon} from '@chakra-ui/icons'
import { Image } from '@chakra-ui/image';
import {Icon, Button, Input, Textarea} from '@chakra-ui/react'
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
        deleteSelection: null,
        deleteDateTime: null,
        deleteIndex: null,
        userText: '',
    }   

    async componentDidUpdate(prevProps){
        if(this.props.conversation !== prevProps.conversation){
            const path = '/conversations/' + this.props.conversation
            const data = await API.get(`topicsApi`, path)
                this.setState({messages: data['messages'].reverse(), userInfo: data['userInfo']},
                () => this.scrollToBottom()
            )
                    
            //Update at every 10 seconds
            setInterval(async () => {
                const path = '/conversations/' + this.props.conversation
                const data = await API.get(`topicsApi`, path)
                this.setState({messages: data['messages'].reverse(), userInfo: data['userInfo']})
                }, 10000);
        }
    }

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
      }

    cancelReply(){
        this.setState({replySelection: null})
    }

    deleteMessageModalOpen(message, index){
        this.setState({ deleteSelection: message.text, deleteDateTime: message.dateTime, deleteIndex: index ,modal:true})
    }

    async deleteMessage(){
        const path = '/conversations/' + this.props.conversation
        const myInit = {
            body:{
                type: 'delete',
                text: this.state.deleteSelection, 
                dateTime: this.state.deleteDateTime,
            }
        }
        const data = await API.post(`topicsApi`, path, myInit)
        if (data['Success'] == 'True'){
            let messages = this.state.messages
            messages.splice(this.state.deleteIndex, 1)
            this.setState({messages: messages, modal: false})
        } 
    }

    selectReply(message){
        this.setState({replySelection : message.text, replySelectionDateTime: message.dateTime})
    }

    textChange = (e) => {
        let inputValue = e.target.value
        this.setState({userText: inputValue})
      }
    
      async sendMessage(){
          if(this.state.replySelection && this.state.userText){
            const path = '/conversations/' + this.props.conversation
            const myInit = {
                body:{
                    type: 'message',
                    text: this.state.userText, 
                    reply: this.state.replySelection,
                    repliedDateTime: this.state.replySelectionDateTime,
                }
            }
            const data = await API.post(`topicsApi`, path, myInit)
            const message = data['message']
            let messages = this.state.messages
            messages.splice(this.state.messages.length, 0, message)
            this.setState({messages: messages}) 
            this.scrollToBottom();           
          }
          else if(this.state.userText){
            const path = '/conversations/' + this.props.conversation
            const myInit = {
                body:{
                    type: 'message',
                    text: this.state.userText
                }
            }
            const data = await API.post(`topicsApi`, path, myInit)
            const message = data['message']
            let messages = this.state.messages
            messages.splice(this.state.messages.length, 0, message)
            this.setState({messages: messages}) 
            this.scrollToBottom();
          }
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
                <VStack w='50%' h='85vh' bgGradient="linear(to-r,gray.50,teal.50,green.50)" spacing={3} overflowY='scroll' className='messagebox'>
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
                                            <ModalHeader>Delete Message</ModalHeader>
                                            <ModalCloseButton />
                                            <ModalBody>
                                                Do you want to delete selected message?
                                                <br/>
                                                Message: {this.state.deleteSelection}
                                            </ModalBody>
                                            <ModalFooter>
                                                <Button bg='red.500' onClick={this.deleteMessage.bind(this)}>Delete</Button>
                                            </ModalFooter>
                                            </ModalContent>
                                        </Modal>
                                        <Box mr='2' my='auto'>
                                            <button onClick={() => this.deleteMessageModalOpen(message, index)}>
                                                <Icon as={RiDeleteBinLine} color='red'/>
                                            </button>
                                        </Box>
                                        <Box mr='2' my='auto'>
                                            <button onClick={() => this.selectReply(message)}>
                                                <Icon as={BsFillReplyAllFill} />
                                            </button> 
                                        </Box>
                                        <Spacer /> 
                                    </> :
                                    <>
                                    </>
                                    }
                                    <VStack w='100%'
                                        align={message.sender == 'user' ? 'right' : 'left'}
                                        spacing='0'
                                    >
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
                                        <Text fontSize='xs' color='gray.500'>
                                            {message.dateTime}
                                        </Text>
                                        <div style={{ float:"left", clear: "both" }}
                                            ref={(el) => { this.messagesEnd = el; }}>
                                        </div>
                                    </VStack>
                                    {message.sender == 'friend' ?
                                    <> 
                                        <Spacer />
                                        <Box ml='2' my='auto'>
                                            <button onClick={() => this.selectReply(message)}>
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
                <VStack w='50%'>
                    {this.state.replySelection ? 
                    <Flex
                        w='100%'
                        align='left'
                        fontSize='xs'
                        pl='3'
                        bgGradient="linear(to-r,gray.400,gray.50)"
                        borderRadius='md'
                    >
                        <Text>
                            Reply: {this.state.replySelection}
                        </Text>
                        <Spacer />
                        <Box mr='2'>
                            <button onClick={this.cancelReply.bind(this)}>
                                <CloseIcon />
                            </button>
                        </Box>
                    </Flex>
                    :
                    <> </>}
                    <HStack w='100%'>
                        <Textarea w='80%' variant="outline" placeholder="Outline" onChange={this.textChange}/>
                        <Button onClick={this.sendMessage.bind(this)} w='20%' bgGradient="linear(to-r,gray.200,teal.200,green.100)">
                            Send
                        </Button>
                    </HStack>
                </VStack>
            </VStack>
        )
    }
}

export default Message
