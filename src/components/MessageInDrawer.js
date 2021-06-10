import React, { Component } from 'react'
import {API} from "aws-amplify";
import { Text, VStack, Box, HStack, Flex, Spacer, Center } from '@chakra-ui/layout';
import {InfoOutlineIcon, CloseIcon, CheckIcon} from '@chakra-ui/icons'
import { Image } from '@chakra-ui/image';
import {Icon, Button, Input} from '@chakra-ui/react'
import {BsFillReplyAllFill} from 'react-icons/bs'
import {RiDeleteBinLine} from 'react-icons/ri'
import {BiCheckDouble} from 'react-icons/bi'
import _ from 'lodash'
import isEqual from 'lodash/isEqual'
import {FaQuoteRight} from 'react-icons/fa'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
  } from "@chakra-ui/react"

export class MessageInDrawer extends Component {
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
        if((this.props !== prevProps)){
            const path = '/conversations/' + this.props.conversation
            const data = await API.get(`topicsApi`, path)
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
        this.setState({replySelection : message.text, replySelectionDateTime: message.dateTime}, () => this.scrollToBottom())
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
            <VStack h='40vh' w='100%' align='left' boxShadow="lg" spacing='0'>
                {this.state.userInfo ?
                    <HStack w='100%' h='5vh' bgGradient="linear(to-r,gray.300,teal.200)" align='left' pl='4' py='2.5' borderRadius='md'>
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
                <VStack w='100%' h={this.state.messages.length == 0 ? '35vh' : '30vh'} bgGradient="linear(to-r,gray.50,teal.50,green.50)" spacing={3} overflowY='scroll' className='messagebox' sx={{
                    '&::-webkit-scrollbar': {
                    width: '8px',
                    borderRadius: '8px',
                    backgroundColor: `rgba(0, 0, 0, 0.05)`,
                    },
                    '&::-webkit-scrollbar-thumb': {
                    backgroundColor: `rgba(0, 0, 0, 0.05)`,
                    },
                }}>
                    {this.state.contScroll ? <Center  
                    onClick={this.fetchMoreData.bind(this)} 
                    boxShadow='xl' p='2' 
                    borderRadius='lg' w='100%'
                    _hover={{
                        bgGradient: "linear(to-r, gray.300, gray.500)",
                    }}
                    >Show more</Center> : <> </>}
                    {this.state.messages.map((message, index) =>  
                        <Box
                            w='100%'
                            align={message.sender == 'user' ? 'right' : 'left'}
                            px='2'
                            >
                                {message.reply ? 
                                <Text
                                    bgGradient="linear(to-r,gray.400,gray.50)"
                                    maxW='15vh'
                                    pl = {message.sender == 'user' ? '2' : '4'}
                                    pr = {message.sender == 'user' ? '4' : '2'}
                                    borderRadius='lg'
                                    mb='1'
                                    fontSize='10'
                                >
                                    Replied to: {message.reply.text}
                                </Text> : <> </>
                                }
                                <Flex w='50%'>
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
                                        <Text
                                            bg={message.sender == 'user' ? 'cyan.400' : 'cyan.500'}
                                            maxW='35vh'
                                            color={message.sender == 'user' ? 'white' : 'white'}
                                            pl = {message.sender == 'user' ? '2' : '4'}
                                            pr = {message.sender == 'user' ? '4' : '2'}
                                            borderRadius='lg'
                                            fontSize='12'
                                            as='cite'
                                        >
                                            {message.text}
                                        </Text>
                                            
                                        
                                        <Text fontSize='9' color='gray.500'>
                                            {message.dateTime.substring(0,5) + ' ' + message.dateTime.substring(12,17)}
                                        </Text>
                                        <div style={{ float:"left", clear: "both" }}
                                            ref={(el) => { this.messagesEnd = el; }}>
                                        </div>
                                    </VStack>
                                    {message.sender == 'friend' ?
                                    <> 
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
                </VStack>
                <VStack w='100%'>      
                    <HStack w='100%' spacing='0'>
                        <Input fontSize='xs' ref='messageArea' w='80%' variant="outline" placeholder="Send Message..." onChange={this.textChange}/>
                        <Button onClick={this.sendMessage.bind(this)} w='20%'  bgGradient="linear(to-r,gray.200,teal.200,green.100)">
                            <CheckIcon />
                        </Button>
                    </HStack>
                </VStack>
            </VStack>
        )
    }
}

export default MessageInDrawer
