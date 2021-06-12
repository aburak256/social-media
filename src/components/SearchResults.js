import { Box, Button, Image, SkeletonCircle, SkeletonText, Badge } from '@chakra-ui/react'
import React, { Component } from 'react'
import {Link} from 'react-router-dom'
import { Text, VStack, HStack, Flex, Spacer, Center } from '@chakra-ui/layout';
import {API} from "aws-amplify";
const Editor = require('react-medium-editor').default;
require('medium-editor/dist/css/medium-editor.css');
require('medium-editor/dist/css/themes/default.css');

export class SearchResults extends Component {
    state={
        text: '',
        topics: [],
        posts: [],
        users: [],
        loading: true,
        selection: null
    }

    async componentDidMount(){
        const myInit = {
            queryStringParameters:{
              search: this.props.text
            }
          }
        const path = '/search/' 
        const data = await API.get(`topicsApi`, path, myInit)
        console.log(data)
        if(data['topics'] != null){
            this.setState({topics: data['topics']})
        }
        if(data['posts'] != null){
            this.setState({posts: data['posts']})
        }
        if(data['usernames'] != null){
            this.setState({users: data['usernames']})
        }
        this.setState({ loading:false})       
    }

    render() {
        return (
            <div>
                <VStack w='100%'>
                {this.state.loading ? 
                    <Box w='100%' padding="6" boxShadow="lg" bg="white">
                        <SkeletonCircle size="100" />
                        <SkeletonText mt="4" noOfLines={6} spacing="4" />
                    </Box>
                    :
                    <Flex w='60%' mt='3vh' boxShadow='lg' p='3' align='center' borderRadius='lg'>  
                            <Box w='25%' align='center'>
                                <Button bg='teal.300' onClick={() => this.setState({selection: 'users'})}>
                                    Users: {this.state.users.length}
                                </Button>
                            </Box>
                            <Box w='25%' align='center' onClick={() => this.setState({selection: 'posts'})}>
                                <Button bg='teal.300'>
                                    Posts: {this.state.posts.length}
                                </Button>
                            </Box>
                            <Box w='25%' align='center' onClick={() => this.setState({selection: 'topics'})}>
                                <Button bg='teal.300'>
                                    Topics: {this.state.topics.length}
                                </Button>
                            </Box>
                            <Box w='25%' align='center' onClick={() => this.props.onClose()}>
                                <Button bg='teal.300'>
                                    Close
                                </Button>
                            </Box>              
                    </Flex>
                }


                {this.state.selection == 'users' && this.state.users.length != 0 ?
                <VStack w='70%'> 
                    {this.state.users.map((user) => 
                        <Box w='100%' borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="lg" p='4'>
                            <HStack spacing='20' w='100%'>
                                <Image borderRadius='lg' boxShadow="lg" h='15vh' maxW='20vh' src={user.image ? user.image : 'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png'} />
                                <VStack>
                                    <Text
                                        fontWeight="semibold"
                                        lineHeight="tight"
                                        fontSize='lg'
                                    >
                                        <Link onClick={() => this.props.onClose()} to={'/profile/' + user.userId}>
                                            {user.username}
                                        </Link>
                                    </Text>
                                    <Text
                                        fontWeight="semibold"
                                        lineHeight="tight"
                                        fontSize='sm'
                                        >
                                            Followers: {user.numberOfFollowers} 
                                    </Text>
                                    <Text
                                        fontWeight="semibold"
                                        lineHeight="tight"
                                        fontSize='sm'
                                        >
                                            Follows: {user.numberOfFollows} 
                                    </Text>
                                </VStack>
                                <Text
                                    fontWeight="semibold"
                                    lineHeight="tight"
                                    fontSize='sm'
                                    maxW='50%'
                                    >
                                        {user.bio}
                                </Text>
                            </HStack>
                        </Box>
                    )}
                </VStack>
                :             
                <> </>}


                {this.state.selection == 'posts' && this.state.posts.length != 0 ?
                <VStack w='70%'> 
                    {this.state.posts.map((post) => 
                        <Box w='100%' borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="lg" p='4'>
                            <Box p="4" paddingLeft="4">
                                <HStack alignItems="baseline">
                                <Badge borderRadius="full" px="2" colorScheme="teal">
                                    <Link onClick={() => this.props.onClose()} to={'/profile/' + post.userId}>
                                    {post.username}
                                    </Link>
                                </Badge>
                                </HStack>            
                                <HStack>     
                                    <Text
                                        w='70%'
                                        mt="2"
                                        fontWeight="semibold"
                                        lineHeight="tight"
                                        noOfLines={[1, 2, 3, 4]}
                                    >
                                        <Link onClick={() => this.props.onClose()} to={'/posts/' + post.postId }>
                                            <Editor text={post.text}  options={{
                                            toolbar: {buttons: []},
                                            disableEditing: true 
                                            }}/>
                                        </Link>
                                    </Text>
                                    <Box
                                        w='30%'
                                    >
                                        <Image w='100%' maxH='40vh' borderRadius='xl'  src={post.image}/>
                                    </Box>
                                </HStack>             
                            </Box>
                        </Box>
                    )}
                </VStack>
                :             
                <> </>}


                {this.state.selection == 'topics' && this.state.topics.length != 0 ?
                <VStack w='70%'> 
                    {this.state.topics.map((topic) => 
                        <Box w="80%" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="lg" mt='4'>  
                            <Image src={topic.image} alt={topic.topic} />       
                            <Box p="6">
                                <Box alignItems="baseline">
                                    <Badge borderRadius="full" px="2" colorScheme="teal">
                                    <Link to={'/topics/' + topic.topic }>
                                    {topic.topic}
                                    </Link>
                                    </Badge>
                                </Box>     
                                <Text
                                    mt="2"
                                    fontWeight="semibold"
                                    lineHeight="tight"
                                    noOfLines={[1, 2, 3]}
                                >
                                    { topic.text }
                                </Text>
                                
                            </Box>
                        </Box>  
                    )}
                </VStack>
                :             
                <> </>}


                </VStack>
            </div>
        )
    }
}

export default SearchResults
