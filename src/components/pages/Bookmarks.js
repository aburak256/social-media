import { Center, VStack, Box, Text } from '@chakra-ui/layout'
import React, { Component } from 'react'
import PostList from '../PostList'

export class Bookmarks extends Component {
    render() {
        return (
            <div>
                <Center>
                    <VStack w='70%' spacing="24px">
                        <Text
                            mt='4'
                            fontWeight="semibold"
                            lineHeight="tight"
                            fontSize='xl'
                            
                        >
                            Your marked posts
                        </Text>
                        <PostList path='/topics/bookmarks'/>
                    </VStack>
                </Center>
            </div>
        )
    }
}

export default Bookmarks
