import React, { Component } from 'react'
import { VStack, Box, Badge, HStack, Text, Center} from '@chakra-ui/layout';
import {API} from "aws-amplify";
import Timer from '../Timer'
import { Button, ButtonGroup } from "@chakra-ui/react"

export default class Test extends React.Component{
    triggerTimer() {
        this.refs.timer.startTimer();
    }
    render(){
        return (
            <div>
                <Center> 
                    <VStack spacing="24px" width="70%" bg='gray.50'>
                        <HStack width="100%" mt="4">
                            <Box width="80%"/>
                            <Box width="15%" align='center' py="3" borderRadius="lg" boxShadow="lg" bg='gray.200'>
                                <Timer ref='timer'/>          
                        <Timer ref='timer'/>
                                <Timer ref='timer'/>          
                            </Box>  
                        </HStack>         
                        <Box width="70%" bg='gray.100'>
                            Questions will come this place
                        </Box>
                        <Button colorScheme="teal" size="lg" onClick={this.startTest.bind(this)}>Start Test</Button>
                    </VStack>
                </Center>
            </div>
        )
    }
}


