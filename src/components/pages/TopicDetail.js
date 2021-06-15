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
                <VStack spacing="24px" ml='10%' width="100%">
                    <InfoBar topic={topic} />            
                    <br/>
                    <PostList topic={topic}/>
                </VStack>

        </div>
    )
}

export default TopicDetail
