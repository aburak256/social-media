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
                    <VStack spacing="24px" width="70%">
                        <Timer ref='timer'/>
                        <Button onClick={this.triggerTimer.bind(this)}>Click</Button>
                        <Box>
                            Questions will come this place
                        </Box>
                    </VStack>
                </Center>
            </div>
        )
    }
}


