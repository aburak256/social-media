import React, { Component } from 'react'
import { Box, Textarea, VStack, HStack, Button, Progress, Text, Alert, AlertIcon, } from "@chakra-ui/react"
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
               <VStack pb='4' w='100%'>
                    <Textarea
                        onChange={this.handleInputChange}
                        value={this.state.comment}
                        placeholder="Here is a sample placeholder"
                        size="lg"
                        w='70%'
                        placeholder={'Share anything about this post'}
                        boxShadow="lg"
                        borderRadius="lg"
                    />
                    <HStack spacing='8'>                                         
                        <Button bg='teal.200' onClick={this.postComment.bind(this)}>Post</Button>
                        {this.state.message ? 
                        <> 
                        <Alert status="error">
                            <AlertIcon />
                            {this.state.message}
                        </Alert>
                        </> :
                        <> </> }
                    </HStack>                       
                </VStack> 
        )
    }
}

export default SendComment
