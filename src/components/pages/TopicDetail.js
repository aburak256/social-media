import React from 'react';
import '../../App.css';
import PostList from '../PostList';
import InfoBar from '../InfoBar'
import {Center, Box, VStack} from "@chakra-ui/react"
import { useParams } from 'react-router';

function TopicDetail() {
    const {topic} = useParams()
    return (        
        <div>
            <title>Topics</title>
            <Center w='100%'> 
                <VStack spacing="24px" width="70%">
                    <InfoBar topic={topic} />            
                    <br/>
                    <PostList topic={topic}/>
                </VStack>
            </Center>
        </div>
    )
}

export default TopicDetail
