import React, { Component } from 'react'
import {API} from "aws-amplify";
import { Text, VStack, Box, StackDivider, HStack, Center, Flex, Spacer } from '@chakra-ui/layout';
import {InfoOutlineIcon, CloseIcon} from '@chakra-ui/icons'
import {Link} from 'react-router-dom'
import { Image } from '@chakra-ui/image';
import {Icon, Button, Input, Textarea} from '@chakra-ui/react'
import {BsFillReplyAllFill} from 'react-icons/bs'
import {RiDeleteBinLine} from 'react-icons/ri'
import InfiniteScroll from "react-infinite-scroll-component"
import _ from 'lodash'
import isEqual from 'lodash/isEqual'
import {BiCheckDouble} from 'react-icons/bi'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverFooter,
    PopoverArrow,
    PopoverCloseButton,
    Portal,
  } from "@chakra-ui/react"
const Editor = require('react-medium-editor').default;
require('medium-editor/dist/css/medium-editor.css');
require('medium-editor/dist/css/themes/default.css');
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
        contScroll: '',
    }   

    async componentDidUpdate(prevProps){
        if(this.props.conversation !== prevProps.conversation){
            const path = '/conversations/' + this.props.conversation
            const data = await API.get(`topicsApi`, path)
            console.log(data)
            this.setState({messages: data['messages'].reverse(), userInfo: data['userInfo']},
                () => this.scrollToBottom()
            )
            if( data['cont'] == 'True'){
                this.setState({contScroll: true})
              }
            else{
                this.setState({contScroll: false})
              }
                    
            //Update at every 10 seconds
            setInterval(async () => {
                const path = '/conversations/' + this.props.conversation
                const data = await API.get(`topicsApi`, path)
                //Check the last elements of data. If they are same no new messages
                if( _.isEqual(data['messages'].reverse()[data['messages'].length-1]['dateTime'], this.state.messages[this.state.messages.length - 1]['dateTime'])){
                    //Do nothing
                }
                else{
                    //If there are new messages then change state
                    this.setState({messages: data['messages'].reverse(), userInfo: data['userInfo']})
                    if( data['cont'] == 'True'){
                        this.setState({contScroll: true})
                    }
                    else{
                        this.setState({contScroll: false})
                    }
                }
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
            this.setState({messages: messages, replySelection: null, userText: null}) 
            this.scrollToBottom()
            this.refs.messageArea.value = ''          
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
            this.setState({messages: messages, userText: null}) 
            this.scrollToBottom()
            this.refs.messageArea.value = ''
          }
      }

    fetchMoreData = () => {
        if(this.state.contScroll){
          setTimeout(async () => {
            const myInit = {
              queryStringParameters:{
                paginator: this.state.messages[0]['dateTime']
              }
            }
            console.log(myInit)
            const path = '/conversations/' + this.props.conversation
            const data = await API.get(`topicsApi`, path, myInit)
            console.log(data)
            let messages = this.state.messages
            const result = data['messages'].reverse().concat(messages)
            this.setState({messages: result})
            if( data['cont'] == 'True'){
                this.setState({contScroll: true})
            }
            else{
                this.setState({contScroll: false})
            }
            this.setState({ loading: false })
          }, 1500);
        }
      };

    render() {
        return (
            <VStack w='100%' align='left' boxShadow="lg">
                {this.state.userInfo ?
                    <HStack w='50%' h='5vh' bgGradient="linear(to-r,gray.300,teal.200)" align='left' pl='4' py='2.5' borderRadius='md'>
                        {this.state.userInfo.image ? 
                            <Image src={this.state.userInfo.image} h={6} maxW={6} />
                        :
                            <InfoOutlineIcon w={6} h={6} />
                        }
                        <Text ml='3'>
                            {this.state.userInfo.username}
                        </Text>
                        <Box w='100%' align='right' pr='2' fontSize='xs'>
                            To reply or delete: Click the message
                        </Box>
                    </HStack> 
                : <> </>}
                <VStack w='50%' h='85vh' bgGradient="linear(to-r,gray.50,teal.50,green.50)" spacing={3} overflowY='scroll' className='messagebox' sx={{
                    '&::-webkit-scrollbar': {
                    width: '8px',
                    borderRadius: '8px',
                    backgroundColor: `rgba(0, 0, 0, 0.05)`,
                    },
                    '&::-webkit-scrollbar-thumb': {
                    backgroundColor: `rgba(0, 0, 0, 0.05)`,
                    },
                }}>
                    {this.state.contScroll ? <Center onClick={this.fetchMoreData.bind(this)} boxShadow='xl' p='2' borderRadius='lg' w='100%'>Show more</Center> : <> </>} 
                    {this.state.messages.map((message, index) =>  
                        <> {message.type == 'post' ? <>
                        <Box
                            w='100%'
                            align={message.sender == 'user' ? 'right' : 'left'}
                            px='3'>
                              <Flex w='60%'>
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
                                        <Spacer /> 
                                        <Box my='auto' mr='1'>
                                                <Icon color={message.seen == 'True' ? 'blue' : 'gray'} as={BiCheckDouble} /> 
                                        </Box>          
                                    </> :
                                    <>
                                    </>
                                    }
                                    <VStack
                                        align={message.sender == 'user' ? 'right' : 'left'}
                                        spacing='1'
                                        w='100%'
                                    >
                                       <Popover>
                                            <PopoverTrigger>
                                                <Text
                                                    bg='gray.100'
                                                    maxW='40vh'                                       
                                                    pl = {message.sender == 'user' ? '2' : '4'}
                                                    pr = {message.sender == 'user' ? '4' : '2'}
                                                    borderRadius='lg'
                                                    fontSize='14'
                                                    as='cite'
                                                >
                                                    <VStack w='100%' align='left' py='2' spacing='2' px='2'>
                                                        <Text  fontSize='xs' align='left'>
                                                            {message.username}
                                                        </Text>
                                                        <Text w='80%' align='left' noOfLines={[1, 2, 3, 4, 5, 6, 7]}>
                                                            <Editor text={message.text}  options={{
                                                                toolbar: {buttons: []},
                                                                disableEditing: true 
                                                                }}/>
                                                        </Text>
                                                        {message.imageUrl ? <Image borderRadius='xl' pb='4' w='100%' src={message.imageUrl} /> : <> </>}
                                                    </VStack>
                                                </Text>
                                                </PopoverTrigger>
                                                <Portal>
                                                    <PopoverContent color="white" bg="black" borderColor="blue.800" w='35vh'>
                                                        <PopoverArrow />
                                                        <PopoverCloseButton />
                                                        <PopoverBody>
                                                        <HStack>
                                                            {message.sender =='user' ? 
                                                            <Box  my='auto'>
                                                                <Button bg='red.600' onClick={() => this.deleteMessageModalOpen(message, index)}>
                                                                    Delete
                                                                </Button>
                                                            </Box> : <> </> }
                                                            
                                                            <Box  my='auto'>
                                                                <Button bg='cyan.600' onClick={() => this.selectReply(message)}>
                                                                    Reply
                                                                </Button> 
                                                            </Box>
                                                            <Box ml='2' mx='auto' my='auto'>
                                                                <Button  bg='green.600'>
                                                                    <Link to={'/posts/' + message.postId}>
                                                                        Go to Post
                                                                    </Link>
                                                                </Button>
                                                            </Box>
                                                        </HStack>
                                                        </PopoverBody>
                                                    </PopoverContent>
                                                </Portal>
                                            </Popover>
                                            
                                        
                                        <Text fontSize='10' color='gray.500'>
                                            {message.dateTime.substring(0,5) + ' ' + message.dateTime.substring(12,17)}
                                        </Text>
                                        <div style={{ float:"left", clear: "both" }}
                                            ref={(el) => { this.messagesEnd = el; }}>
                                        </div>
                                    </VStack>
                                    {message.sender == 'friend' ?
                                    <> 
                                        <Spacer />
                                        
                                         
                                    </>
                                    :
                                    <>
                                    </>
                                    }
                                </Flex>  
                        </Box>
                        
                        </> : 
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
                                        <Spacer /> 
                                        <Box my='auto' mr='1'>
                                                <Icon color={message.seen == 'True' ? 'blue' : 'gray'} as={BiCheckDouble} /> 
                                        </Box>          
                                    </> :
                                    <>
                                    </>
                                    }
                                    <VStack
                                        align={message.sender == 'user' ? 'right' : 'left'}
                                        spacing='0'
                                    >
                                       <Popover>
                                            <PopoverTrigger>
                                                <Text
                                                    bg={message.sender == 'user' ? 'cyan.400' : 'cyan.500'}
                                                    maxW='35vh'
                                                    color={message.sender == 'user' ? 'white' : 'white'}
                                                    pl = {message.sender == 'user' ? '2' : '4'}
                                                    pr = {message.sender == 'user' ? '4' : '2'}
                                                    borderRadius='lg'
                                                    fontSize='14'
                                                    as='cite'
                                                >
                                                    {message.text}
                                                </Text>
                                                </PopoverTrigger>
                                                <Portal>
                                                    <PopoverContent color="white" bg="black" borderColor="blue.800" w='25vh'>
                                                        <PopoverArrow />
                                                        <PopoverCloseButton />
                                                        <PopoverBody>
                                                        <HStack>
                                                            {message.sender =='user' ? 
                                                            <Box mr='2' my='auto'>
                                                                <Button bg='red.600' onClick={() => this.deleteMessageModalOpen(message, index)}>
                                                                    Delete
                                                                </Button>
                                                            </Box> : <> </> }
                                                            
                                                            <Box mr='2' my='auto'>
                                                                <Button bg='cyan.600' onClick={() => this.selectReply(message)}>
                                                                    Reply
                                                                </Button> 
                                                            </Box>
                                                        </HStack>
                                                        </PopoverBody>
                                                    </PopoverContent>
                                                </Portal>
                                            </Popover>
                                            
                                        
                                        <Text fontSize='10' color='gray.500'>
                                            {message.dateTime.substring(0,5) + ' ' + message.dateTime.substring(12,17)}
                                        </Text>
                                        <div style={{ float:"left", clear: "both" }}
                                            ref={(el) => { this.messagesEnd = el; }}>
                                        </div>
                                    </VStack>
                                    {message.sender == 'friend' ?
                                    <> 
                                        <Spacer />
                                        
                                         
                                    </>
                                    :
                                    <>
                                    </>
                                    }
                                </Flex>
                        </Box>
                        } </>
                           
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
                        <Textarea ref='messageArea' w='80%' variant="outline" placeholder="Outline" onChange={this.textChange}/>
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
