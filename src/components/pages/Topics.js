import React from 'react';
import '../../App.css';
import TopicList from '../TopicList';
import {Center, Box, VStack} from "@chakra-ui/react"

function Topics() {
    return (
        
        <div>
            <title>Topics</title>
            <Center> 
                <VStack spacing="24px" width="70%">            
                    <h2>This is the topics page</h2>
                    <br/>
                    <TopicList/>
                </VStack>
            </Center>
        </div>
    )
}

export default Topics
