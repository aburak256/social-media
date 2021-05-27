import React from 'react';
import '../../App.css';
import TopicList from '../TopicList';
import {Center, Box, VStack} from "@chakra-ui/react"

function Topics() {
    return (
        
        <div>
            <title>Topics</title>
                <Center spacing="24px" width="80%" pl='15%'>            
                    <br/>
                    <TopicList/>
                </Center>
        </div>
    )
}

export default Topics
