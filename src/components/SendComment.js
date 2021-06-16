import React, { Component } from 'react'
import { Box, Textarea, VStack, HStack, Button, Progress, Text, Alert, AlertIcon, Input, InputRightElement, InputGroup   } from "@chakra-ui/react"
import { Storage, Auth, API } from 'aws-amplify';
import { AttachmentIcon } from '@chakra-ui/icons'

export class SendComment extends Component {
    state={
        comment:'',
    }

    componentDidMount(){
        this.setState({post: this.props.post})
    }

    handleInputChange = (e) => {
        let inputValue = e.target.value
        this.setState({comment: inputValue})
      }
    
    async postComment(){
        const path = '/comments/' + this.state.post
        const myInit = {
            body:{
                type: "post", 
                text: this.state.comment,
            }
        }
        const data = await API.post(`topicsApi`, path, myInit)
        this.setState({comment: ''})
        this.props.onPostComment(data)
    }

    render() {
        return (        
               <VStack pb='4' w='75%'>
                    <InputGroup w='100%' bg='white' boxShadow="md" borderRadius="lg" > 
                        <Input
                            onChange={this.handleInputChange}
                            value={this.state.comment}
                            placeholder="Here is a sample placeholder"
                            size="lg"
                            w='100%'
                            placeholder={'Share anything about this post'}
                            boxShadow="lg"
                            borderRadius="lg"
                        />
                        <InputRightElement width="4.5rem"> 
                            <Button bg='teal.200' size="md" h="2.5rem" mt='1.5' onClick={this.postComment.bind(this)}>Post</Button>
                        </InputRightElement>
                    </InputGroup>                                                               
                </VStack> 
        )
    }
}

export default SendComment
