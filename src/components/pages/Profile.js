import React, { Component } from 'react'
import { Box, Center, Grid, GridItem, HStack, VStack,  SkeletonCircle, SkeletonText, Image, Text, Button, Badge, Icon, Spacer,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Textarea, } from "@chakra-ui/react"
import { ChevronUpIcon, ChevronDownIcon , ChatIcon, EditIcon } from '@chakra-ui/icons'
import { Popularity } from '../Popularity';
import {Link} from 'react-router-dom'
import {API} from "aws-amplify";
import { BsBookmark, BsFillBookmarkFill } from "react-icons/bs"

export class Profile extends Component {
    state={
        profile:'',
        posts: [],
        own: false,
        loading: true,
        isOpen: false,
        newBio: ''
    }

    async componentDidMount(){
        if(this.props.match.params.profile){
            const path = '/profile/' + this.props.match.params.profile
            console.log(path)
            const data = await API.get(`topicsApi`, path)
            this.setState({ profile: data['profile'], posts: data['posts'], user: data['user'], loading:false})
        }
        else{
            const path = '/profile'
            const data = await API.get(`topicsApi`, path)
            this.setState({ profile: data['profile'], posts: data['posts'], own:true , loading:false})
        }
    }

    followUser(){
        console.log('Follow User' + this.props.match.params.profile)
    }

    onClose(){
        this.setState({isOpen: false})
    }

    openEditModal(){
        this.setState({isOpen: true})
    }

    async saveNewBio(){
        const path = '/profile'
        const myInit = {
            body:{
                type: 'bioChange',
                text: this.state.newBio, 
            }
        }
        const data = await API.post(`topicsApi`, path, myInit)
        let profile = this.state.profile
        profile.bio = data['bio']
        this.setState({profile: profile, isOpen: false})
    }

    textChange = (e) => {
        let inputValue = e.target.value
        this.setState({newBio: inputValue})
      }

    async postLike(postId, index){
        const path = '/posts/' + postId
        const myInit = {
            body: {
                reaction: 'Like'
            }
        }
        const data = await API.post(`topicsApi`, path, myInit)
        let posts = this.state.posts
        posts[index] = data["post"][0]
        this.setState({posts: posts})
      }
    
      async postDislike(postId, index){
        const path = '/posts/' + postId
        const myInit = {
            body: {
                reaction: 'Dislike'
            }
        }
        const data = await API.post(`topicsApi`, path, myInit)
        let posts = this.state.posts
        posts[index] = data["post"][0]
        this.setState({posts: posts})
    }
    
      async postBookmark(postId, index){
        const path = '/posts/' + postId
        const myInit = {
            body: {
                bookmark: postId
            }
        }
        const data = await API.post(`topicsApi`, path, myInit)
        console.log(data)
        let posts = this.state.posts
        posts[index].bookmark = data["bookmark"]
        this.setState({posts: posts})
      }

    render() {
        return (
            <div>
                <Center w='100%' mt='10'>
                    <VStack w='70%'>           
                        {this.state.loading ? 
                            <Box w='100%' padding="6" boxShadow="lg" bg="white">
                                <SkeletonCircle size="100" />
                                <SkeletonText mt="4" noOfLines={6} spacing="4" />
                            </Box>
                            :  
                            <>
                                <HStack w='100%' bg='gray.50' boxShadow='lg' borderRadius='lg'>
                                    <VStack ml='4vh' py='2vh' w='25%'>
                                        <Box>
                                            <Image borderRadius='full' boxShadow="lg" h='20vh' maxw='20vh' src={this.state.profile.imageUrl ? this.state.profile.imageUrl : 'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png'} />
                                        </Box>
                                        <Text
                                            color='gray.600'
                                        >
                                            {this.state.profile.username}
                                        </Text>
                                        { !this.state.own && this.state.profile.followInfo == 'False' ? <>  <Button bg='gray.300' borderRadius='lg' boxShadow='lg' onClick={this.followUser.bind(this)}>Follow</Button> </> : <> </>}
                                        { !this.state.own && this.state.profile.followInfo == 'True' ? <>  <Button bg='red.400' borderRadius='lg' boxShadow='lg' onClick={this.followUser.bind(this)}>Unfollow</Button> </> : <> </>}
                                    </VStack>
                                    <HStack w='75%'>
                                        <VStack w='45%'>
                                            <Box
                                                mb='15'
                                            >
                                                Followers: {this.state.profile.followers}
                                            </Box>
                                            <Box>
                                                Follows: {this.state.profile.follows}
                                            </Box>
                                        </VStack>
                                        <Text
                                            fontSize='sm'
                                            color='gray.600'
                                            w='100%'
                                            
                                            pr='3vh'
                                        >
                                            {this.state.profile.bio}
                                            <>
                                                {this.state.own == 'True' ? <>
                                                    <Spacer />
                                                        <button onClick={this.openEditModal.bind(this)}>
                                                            <EditIcon />
                                                        </button>
                                                    <Modal
                                                        isCentered
                                                        onClose={this.onClose.bind(this)}
                                                        isOpen={this.state.isOpen}
                                                        motionPreset="slideInBottom"
                                                    >
                                                        <ModalOverlay />
                                                        <ModalContent>
                                                            <ModalHeader>Change your bio</ModalHeader>
                                                            <ModalCloseButton />
                                                            <ModalBody>
                                                                <Textarea onChange={this.textChange}/>
                                                            </ModalBody>
                                                            <ModalFooter>
                                                                <Button colorScheme="blue" mr={3} onClick={this.onClose.bind(this)}>
                                                                    Close
                                                                </Button>
                                                                <Button onClick={this.saveNewBio.bind(this)} variant="ghost">Save</Button>
                                                            </ModalFooter>
                                                        </ModalContent>
                                                    </Modal> </>
                                                    :
                                                    <> </>} 
                                            </>
                                            
                                        </Text>
                                    </HStack>
                                </HStack>
                                {this.state.posts ? <>{this.state.posts.map((post, index) => 
                                <Box w="80%" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="lg" key={post.PK}>         
                                    <Box p="4" paddingLeft="4">
                                        <HStack alignItems="baseline">
                                            <Badge borderRadius="full" px="2" colorScheme="teal">
                                                {post.username}
                                            </Badge>
                                            <Box
                                                color="gray.400"
                                                fontWeight="semibold"
                                                letterSpacing="wide"
                                                fontSize="xs"
                                                textTransform="uppercase"
                                                ml="6"
                                                pl='2'
                                            >
                                                Posted at {post.dateTime}
                                            </Box>
                                        </HStack>            
                                        <HStack>     
                                            <Text
                                                w='70%'
                                                mt="2"
                                                fontWeight="semibold"
                                                lineHeight="tight"
                                                noOfLines={[1, 2, 3, 4]}
                                            >
                                                <Link to={'/posts/' + post.postId }>
                                                {post.text}
                                                </Link>
                                            </Text>
                                            <Box
                                                w='30%'
                                            >
                                                <Image w='100%' borderRadius='xl'  src={post.imageURL}/>
                                            </Box>
                                        </HStack>
                                        <Box d="flex" mt="4" alignItems="center">
                                        <button id={post.postId} onClick={() => this.postLike(post.postId, index)}>                
                                            <ChevronUpIcon w={8} h={8} color={post.Reaction == "Like" ? "teal.300" : "teal.100"}/>
                                        </button>
                                        <Box
                                            as="span"
                                            color={post.Reaction == "Like" ? "teal.300" : "gray.300"}
                                            fontSize="sm"
                                            >
                                            {post.numberOfLikes}
                                        </Box>
                                        <button id={post.postId} onClick={() => this.postDislike(post.postId, index)}>
                                            <ChevronDownIcon w={8} h={8} ml="4" color={post.Reaction == "Dislike" ? "red.300" : "red.100"}/>
                                        </button>
                                        <Box as="span" color={post.Reaction == "Dislike" ? "red.300" : "gray.300"} fontSize="sm">
                                            {post.numberOfDislikes}
                                        </Box>
                                        <Popularity likes={post.numberOfLikes} dislikes={post.numberOfDislikes}/>
                                        <Text
                                            fontSize='sm'
                                            ml='7'
                                        >
                                            <ChatIcon
                                            w={4} h={4}
                                            color='teal.500'
                                            /> : {post.numberOfComments}
                                        </Text>
                                        <Box as="span" fontSize="sm" ml="6">
                                            <button id={post.postId} onClick={() => this.postBookmark(post.postId, index)}>
                                            <Icon
                                                as={post.bookmark == "True" ? BsFillBookmarkFill :  BsBookmark}
                                                w={6} h={6}
                                                color='teal.500'
                                            />
                                            </button>
                                        </Box>
                                        </Box>             
                                    </Box>
                                </Box>             
                                )} </> : <> </>}
                                
                            </>}
                        </VStack>
                </Center>      
            </div>
        )
    }
}

export default Profile
