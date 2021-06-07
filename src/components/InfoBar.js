import React, { Component } from 'react'
import {API} from "aws-amplify";
import { VStack, Box, Badge, HStack, Text} from '@chakra-ui/layout';
import {Button } from "@chakra-ui/react"

export class InfoBar extends Component {
    state={
        follow: '',
        followers: '0',
        description: '',
    }

    async componentDidMount(){
        if(this.props.topic){
            const path = '/topics/info/' + (this.props.topic).toUpperCase()
            const data = await API.get(`topicsApi`, path)
            this.setState({follow: data['topic']['followInfo'], followers: data['topic']['Followers'], description: data['topic']['Description']})
        }
    }

    async followTopic(){
        if(this.props.topic){
            const path = '/topics/' + (this.props.topic).toUpperCase()
            const myInit = {
                body: {
                    type: 'follow'
                }
            }
            const data = await API.post(`topicsApi`, path, myInit)
            this.setState({follow: data['followInfo']})       
        }
    }

    render() {
        return (
            <div>
                <HStack w='100vh'  mt='3' boxShadow='lg' p='10' borderRadius='xl' bg='gray.100'>
                    <Box w='100%'>
                        Topic: {this.props.topic}
                        <br/>
                        <Text
                            fontSize='sm'
                            fontWeight="semibold"
                            letterSpacing="wide"
                            color='gray.500'
                        >
                            {this.state.description}
                        </Text>
                    </Box>
                    <Box w='40%'>
                        Followers: {this.state.followers}
                        <br/>
                        {this.state.follow == 'True' ? <Button bg='red.300' onClick={this.followTopic.bind(this)}> Unfollow </Button>: <> </>}
                        {this.state.follow == 'False' ? <Button  bg='gray.300' onClick={this.followTopic.bind(this)}> Follow </Button>: <> </>}
                    </Box>
                </HStack>
            </div>
        )
    }
}

export default InfoBar
