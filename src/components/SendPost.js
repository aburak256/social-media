import React, { Component } from 'react'
import { Box, Textarea, VStack, HStack, Button, Progress, Text, Alert, AlertIcon, } from "@chakra-ui/react"
import { Storage, Auth, API } from 'aws-amplify';
import { AttachmentIcon } from '@chakra-ui/icons'

export class SendPost extends Component {
    state={
        post: '',
        image: null,
        topic:'',
        user: '',
        prog: 0,
        message: '',
    }
    componentDidMount(){
        this.setState({topic: this.props.topic})
        Auth.currentAuthenticatedUser().then(
            (result) => {
                this.setState({user: result})
            }
          )
    }

    handleInputChange = (e) => {
        let inputValue = e.target.value
        this.setState({post: inputValue})
      }
    
    imageSelectHandler = event => {
        if(event.target.files[0].type == "image/png" || event.target.files[0].type == "image/jpeg"){
            this.setState({ image: event.target.files[0]})
        }
        else{
            this.setState({message: "Uploaded file is not a png or jpeg file"})
        }
    }

    async post (){
        const path = '/posts/' + this.props.topic
        let image = null
        if(this.state.image != null){
            const config = {
                level: 'public',
                contentType: 'image/png',
                progressCallback: progressEvent => {
                    let prog = (progressEvent.loaded / progressEvent.total) * 100
                    this.setState({ prog: prog })
                }
              }
            const result = await Storage.put(this.state.user.attributes.sub + Date().toLocaleString(), this.state.image, config)
            image = result.key
        }
        const myInit = {
            body:{
                type: "post", 
                text: this.state.post,
                image: image
            }
        }
        const data = await API.post(`topicsApi`, path, myInit)
    }

    render() {
        return (
            <VStack pb='4' w='100%'>
                <Textarea
                    onChange={this.handleInputChange}
                    value={this.state.post}
                    placeholder="Here is a sample placeholder"
                    size="lg"
                    w='70%'
                    placeholder={'Share anything about ' + this.state.topic}
                    boxShadow="lg"
                    borderRadius="lg"
                />
                {this.state.prog = 0 ? <>   </> : <Progress size='xs' w='70%' value={this.state.prog}/>}
                <HStack spacing='8'>
                    <label htmlFor='fileInput'>
                        <AttachmentIcon color='teal.400' w={8} h={8}/>
                    </label>
                    <input id='fileInput' type='file' style={{display:'none'}} onChange={this.imageSelectHandler} />   
                                    
                    <Button bg='teal.300' onClick={this.post.bind(this)}>Post</Button>
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

export default SendPost
