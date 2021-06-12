import React, { Component } from 'react'
import { Input, InputGroup, InputRightElement, Icon } from "@chakra-ui/react"
import {BsSearch} from "react-icons/bs"
import {API} from "aws-amplify";

export class SearchBar extends Component {
    state={
        text: '',
    }

    handleInputChange = (e) => {
        let inputValue = e.target.value
        this.setState({text: inputValue})
      }

    async makeSearch(){
        this.props.onSearch(this.state.text)
    }

    render() {
        return (
            <div>
                <InputGroup>
                    <Input onChange={this.handleInputChange.bind(this)}/>
                    <InputRightElement children={<Icon as={BsSearch} onClick={this.makeSearch.bind(this)} color="teal.500" />} />
                </InputGroup>
            </div>
        )
    }
}

export default SearchBar
