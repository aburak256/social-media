import React, { Component } from 'react'
import {API} from "aws-amplify";
import { Spinner } from "@chakra-ui/react"
import { VStack, Box, Badge, HStack, Text} from '@chakra-ui/layout';

export class Post extends Component {
    state = {
        comments: [],
        post: [],
        loading:true
    }
      
    async componentDidMount() {
        const path = '/posts/' + (this.props.post).toString()
        const data = await API.get(`topicsApi`, path)
        this.setState({  loading:false, post: data["post"], comments: data["comments"] })
    }
    
    render() {
        return (
            <VStack w="80%">
            {this.state.loading ? 
                <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="blue.500"
                size="xl"
                />
                :  
                <>     
                    {this.state.post.map(p => <Text>{p.text} </Text>)}
                    {this.state.comments.map(comment => <Text>{comment.text} </Text>)}
                </> }
            </VStack>
        )
    }
}

export default Post
