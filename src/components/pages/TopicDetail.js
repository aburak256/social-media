import React from 'react';
import '../../App.css';
import PostList from '../PostList';
import {Center, Box, VStack} from "@chakra-ui/react"
import { useParams } from 'react-router';

function TopicDetail() {
    const {topic} = useParams()
    return (        
        <div>
            <title>Topics</title>
            <Center> 
                <VStack spacing="24px" width="70%">            
                    <br/>
                    <PostList topic={topic}/>
                </VStack>
            </Center>
        </div>
    )
}

export default TopicDetail
