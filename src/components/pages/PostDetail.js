import React from 'react'
import { useParams } from 'react-router'
import '../../App.css';
import {Center, Box, VStack} from "@chakra-ui/react"
import Post from '../Post';

function PostDetail() {
    const {post} = useParams()
    return (
        <div>
            <title>Post</title>
            <Center> 
                <VStack spacing="24px" width="70%">            
                    <br/>
                    <Post post={post}/>
                </VStack>
            </Center>
        </div>
    )
}

export default PostDetail
