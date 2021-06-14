import React, { Component } from 'react'
import { Box, Textarea, VStack, HStack, Button, Progress, Text, Alert, AlertIcon, Center} from "@chakra-ui/react"
import { Storage, Auth, API } from 'aws-amplify';
import { AttachmentIcon } from '@chakra-ui/icons'
const Editor = require('react-medium-editor').default;
require('medium-editor/dist/css/medium-editor.css');
require('medium-editor/dist/css/themes/default.css');

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
        if(event.target.files[0].size <= 10000000){
            if(event.target.files[0].type == "image/png" || event.target.files[0].type == "image/jpeg"){
                this.setState({ image: event.target.files[0]})
            }
            else{
                this.setState({message: "Uploaded file is not a png or jpeg file"})
            }
        }
        else{
            this.setState({message: "Uploaded file should be smaller than 10 MB"})
        }
    }

    handleChange(text, medium) {
        this.setState({ post: text });
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
        this.props.onPost(data['post'])
        this.setState({post: ''})
    }

    render() {
        return (
            <VStack pb='4' w='100%'>
                <Center w='70%'>
                    <Box w='100%' boxShadow='lg' p='4' borderRadius='md' ref='editorBox'>
                        <Editor text={this.state.post} onChange={this.handleChange.bind(this)}  options={{toolbar: {buttons: ['bold', 'italic', 'underline','anchor']},
                        autoLink: true,
                        imageDragging: false,
                        placeholder: {text: 'Share post..'}}}/>
                    </Box>
                </Center>

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
