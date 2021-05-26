import React, { Component } from 'react'
import { Box, Textarea, Center, VStack, HStack, Button } from "@chakra-ui/react"
import { Storage, Auth, API } from 'aws-amplify';
import { AttachmentIcon } from '@chakra-ui/icons'

export class SendPost extends Component {
    state={
        post: '',
        image: null,
        topic:'',
        user: ''
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
        this.setState({ image: event.target.files[0]})
        console.log(Date().toLocaleString(), this.state.user.attributes.sub)
    }

    async post (){
        const path = '/posts/' + this.props.topic
        let image = null
        if(this.state.image != null){
            const result = await Storage.put( this.state.user.attributes.sub + Date().toLocaleString(), this.state.image, {
                level: 'public',
                contentType: 'image/png',
            })
            console.log(result)
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
        console.log(data)
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
                <HStack spacing='8'>
                    <label htmlFor='fileInput'>
                        <AttachmentIcon color='teal.400' w={8} h={8}/>
                    </label>
                    <input id='fileInput' type='file' style={{display:'none'}} onChange={this.imageSelectHandler} />        
                    <Button bg='teal.300' onClick={this.post.bind(this)}>Post</Button>
                </HStack>
            </VStack>
        )
    }
}

export default SendPost
