import { Center, VStack, Box } from '@chakra-ui/layout'
import {Button} from '@chakra-ui/react'
import RecommendModal from './RecommendModal'
import React, { Component } from 'react'
import PostList from './PostList'

export class Timeline extends Component {
    state= {
        length: 0,
        loaded: false,
    }

    handleLength = (len) =>{
        if(len == 0 || len == '0'){
            this.setState({length: 0, loaded:true}) 
            console.log(len)
        }

    }

    render() {
        return (
            <div>
                <Box w='100%'>
                    <VStack w='70%' ml='25%' mt='4'>
                        {this.state.loaded && (this.state.length == 0) ? 
                            <RecommendModal /> 
                            : 
                            <PostList takeLength={this.handleLength} path='/timeline'/>
                        }
                    </VStack>
                </Box>
            </div>
        )
    }
}

export default Timeline
