import { Center, VStack } from '@chakra-ui/layout'
import React, { Component } from 'react'
import PostList from './PostList'

export class Timeline extends Component {
    render() {
        return (
            <div>
                <Center w='100%'>
                    <VStack w='70%' mt='4'>
                        <PostList path='/timeline'/>
                    </VStack>
                </Center>
            </div>
        )
    }
}

export default Timeline
