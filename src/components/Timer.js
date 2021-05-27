import React, { Component } from 'react'
import {HStack, Text} from '@chakra-ui/layout';
import {API} from "aws-amplify";

export default class Timer extends Component {
    constructor() {
        super();
        this.state = { time: {}, seconds: 0 };
        this.timer = 0;
        this.startTimer = this.startTimer.bind(this);
        this.countDown = this.countDown.bind(this);
      }
    
      secondsToTime(secs){
        let hours = Math.floor(secs / (60 * 60));
    
        let divisor_for_minutes = secs % (60 * 60);
        let minutes = Math.floor(divisor_for_minutes / 60);
    
        let divisor_for_seconds = divisor_for_minutes % 60;
        let seconds = Math.ceil(divisor_for_seconds);
    
        let obj = {
          "h": hours,
          "m": minutes,
          "s": seconds
        };
        return obj;
      }
    
      async componentDidMount() {
            const topic = this.props.topic
            const path = '/topics/' + topic.toString()
            const data = await API.get(`topicsApi`, path)
            this.setState({seconds: parseInt(data['time'])})
            let timeLeftVar = this.secondsToTime(this.state.seconds);
            this.setState({ time: timeLeftVar, seconds: this.props.seconds});
            
          
      }
    
      startTimer() {
        if (this.timer == 0 && this.state.seconds > 0) {
          this.timer = setInterval(this.countDown, 1000);
        }
      }
    
      countDown() {
        // Remove one second, set state so a re-render happens.
        let seconds = this.state.seconds - 1;
        this.setState({
          time: this.secondsToTime(seconds),
          seconds: seconds,
        });
        
        // Check if we're at zero.
        if (seconds == 0) { 
          clearInterval(this.timer);
        }
      }
    
      render() {
        return(
          <div>
            <HStack pl='4'>
              <Text color='teal.400'>
                Minute: {this.state.time.m}
              </Text>
              <Text color='cyan.400'>
                Second: {this.state.time.s}
              </Text>
            </HStack>
          </div>
        );
      }
    }
