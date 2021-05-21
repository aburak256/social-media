import { StarIcon } from '@chakra-ui/icons'
import {Box} from '@chakra-ui/layout'
import React, { Component } from 'react'

export class Popularity extends Component {
    state = {
        score: 0,
        color:'teal.100'
    }
    async componentDidMount(){
        const score = this.props.likes - this.props.dislikes
        this.setState({ score:score})
        if (score <= -20){
            this.setState({color:'red.300'})
        }
        else if (score <= 0){
            this.setState({color:'red.100'})
        }
        else if (score >= 50){
            this.setState({color:'teal.500'})
        }
        else if (score >= 30){
            this.setState({color:'teal.400'})
        } 
        else if (score >= 10){
            this.setState({color:'teal.300'})
        }          
    }

    render() {
        return (
            <div>
                <StarIcon mb='1.5' ml='7' key={this.state.score} w={4} h={4} color={this.state.color}/>
                <Box as="span" ml="2" color="gray.600" fontSize="sm">
                    {this.state.score}
                </Box>
            </div>
        )
    }
}
