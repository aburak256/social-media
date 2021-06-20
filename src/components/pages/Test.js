import React, { Component } from 'react'
import { VStack, Box, Badge, HStack, Text, Center} from '@chakra-ui/layout';
import { WarningTwoIcon} from '@chakra-ui/icons'
import {API} from "aws-amplify";
import Timer from '../Timer'
import { Button, Radio, RadioGroup } from "@chakra-ui/react"

export default class Test extends React.Component{
    state = {
        started: false,
        question: '',
        answers: [],
        selection: 'No selection',
        end: false,
        success: false,
    }

    async startTest() {
        const topic = this.props.match.params.topic
        const path = '/topicTest/' + topic.toString()
        const data = await API.get(`topicsApi`, path)
        console.log(data)
        if( data['end']){
            this.setState({
                end: 'True',
                success: data['message']
            })
        }
        else{
            this.setState({ started: true, question:data['question'], answers:data['answers']})
            this.refs.timer.startTimer();
        } 
    }

    
    myChangeHandler = (event) => {
        this.setState({ selection: event})   
    }

    async sendQuestion(){
        const topic = this.props.match.params.topic
        const path = '/topicTest/' + topic.toString()
        const myInit = {
            body: {
                answer: this.state.selection
            }
        }
        const data = await API.post(`topicsApi`, path, myInit)
        console.log(data)
        if (data['question']){
            this.setState({
                question: data['question'],
                answers: data['answers']
            })
        }
        else if(data['end']){
            this.setState({
                end: 'True',
                success: data['message']
            })
        }
        else{
            console.log("Fail from post answer")
        }
    }

    render(){
        return (
            <div>
                {this.state.end == 'True' ?
                <Center w='100vw'>
                    <Center w='60%' h='500px' bg='gray.100' p='12'>
                        <Text 
                            pb='4'
                            color={this.state.succss = "Success" ? 'green.500' : 'red.500'}
                            fontWeight="semibold"
                            letterSpacing="wide"
                            fontSize="xl"
                            textTransform="uppercase">
                                Your test is ended with {this.state.success}
                        </Text>
                    </Center>
                </Center>
                :
                <Center w='100vw'> 
                    <VStack spacing="24px" w="70%" bg='gray.50' pb='8'>
                        <HStack width="100%" mt="4">
                            <Box width="80%"/>
                            <Box width="15%" align='center' py="3" borderRadius="lg" boxShadow="lg" bg='gray.200'>
                                <Timer ref='timer' topic={this.props.match.params.topic}/>          
                            </Box>  
                        </HStack>
                        {this.state.answers.length == 0 ? <>
                        <HStack>
                            <WarningTwoIcon color='yellow.500' w={6} h={6}/>
                            <Text pl='8' width="70%" fontSize='xl' color='gray.400' fontWeight='semibold' letterSpacing='wide'>
                                This is the write authorization test for {this.props.match.params.topic}.
                                If you solved this test 90 days or more ago, you can solve again.
                                <br/>
                                Also if you have permission to write, you can't solve this test again.                       
                            </Text>
                        </HStack>
                        <Button colorScheme="teal" size="lg" onClick={this.startTest.bind(this)}>Start Test</Button>
                        </>:
                        <>
                        <Center>
                            <VStack>
                                <Text
                                    pb='4'
                                    px='4'
                                    color="gray.500"
                                    fontWeight="semibold"
                                    letterSpacing="wide"
                                    fontSize="lg"
                                    textTransform="uppercase"
                                >
                                    {this.state.question}
                                </Text>
                                <RadioGroup onChange={this.myChangeHandler} pb='8'>
                                    <VStack spacing="24px">
                                        {this.state.answers.map(answer =>
                                            <Radio value={answer.text}>{answer.text}</Radio>)}
                                    </VStack>
                                </RadioGroup>
                                <Button colorScheme="teal" size="lg" onClick={this.sendQuestion.bind(this)}>Next</Button>
                            </VStack>
                        </Center>
                        </>
                        }                           
                    </VStack>
                </Center>
                }
            </div>
        )
    }
}


