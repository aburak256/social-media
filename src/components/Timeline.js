import { Center, VStack, Box } from '@chakra-ui/layout'
import React, { Component } from 'react'
import PostList from './PostList'

export class Timeline extends Component {
    render() {
        return (
            <div>
                <Box w='100%'>
                    <VStack w='70%' ml='25%' mt='4'>
                        <PostList path='/timeline'/>
                    </VStack>
                </Box>
            </div>
        )
    }
}

export default Timeline
