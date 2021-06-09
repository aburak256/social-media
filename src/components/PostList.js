import React from 'react';
import { VStack, Box, Badge, HStack, Text, Center} from '@chakra-ui/layout';
import { ChevronUpIcon, ChevronDownIcon , ChatIcon } from '@chakra-ui/icons'
import {API} from "aws-amplify";
import { Image, SkeletonCircle, SkeletonText, Button, Icon } from "@chakra-ui/react"
import {Link} from 'react-router-dom'
import { Popularity } from './Popularity';
import {SendPost} from './SendPost'
import InfiniteScroll from "react-infinite-scroll-component"
import { BsBookmark, BsFillBookmarkFill } from "react-icons/bs"
const Editor = require('react-medium-editor').default;
require('medium-editor/dist/css/medium-editor.css');
require('medium-editor/dist/css/themes/default.css');


export default class PostList extends React.Component {
  state = {
    posts: [],
    loading:true,
    sizeOfArray: '',
    permission: false,
    message: '',
    paginator: 1,
    contScroll: true,
  }
  
  async componentDidMount() {
    if(this.props.topic){
      const path = '/topics/' + (this.props.topic).toUpperCase()
      const data = await API.get(`topicsApi`, path)
      this.setState({ title: this.props.topic , sizeOfArray: data['posts'].length, posts: data['posts'], permission: data['permission']})
      if( data['cont'] == 'True'){
        this.setState({contScroll: true})
      }
      else{
        this.setState({contScroll: false})
      }
      this.setState({ loading: false })
    }
    else{
      const path = this.props.path
      const data = await API.get(`topicsApi`, path)
      if (data['FailMessage']){
        this.setState({ message: data['FailMessage'],loading: false})
      }
      else{
        this.setState({ sizeOfArray: data['posts'].length, posts: data['posts'], permission: data['permission']})
        if( data['cont'] == 'True'){
          this.setState({contScroll: true})
        }
        else{
          this.setState({contScroll: false})
        }
        this.setState({ loading: false })
      }
    }
    
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

  handlePost = (post) =>{
    let posts = this.state.posts
    posts.splice(0, 0, post)
    this.setState({posts: posts}) 
}

  render() {
    return (
        <VStack w="100%">
          {this.state.loading ? 
            <Box w='100%' padding="6" boxShadow="lg" bg="white">
              <SkeletonCircle size="100" />
              <SkeletonText mt="4" noOfLines={6} spacing="4" />
            </Box>
            :
            <>{this.state.message ? 
            <>
            <Box mt='4' fontSize='xl' fontWeight="semibold" lineHeight="tight">
              {this.state.message} 
            </Box>
            </> :   
              <>{this.state.sizeOfArray ?  
                <>{this.props.topic ? 
                  <> {this.state.permission == 'Writer' ? <SendPost topic={this.props.topic} onPost={this.handlePost}/> : 
                    <>
                      <VStack>
                        <Text
                          fontWeight="semibold"
                          lineHeight="tight"
                          fontSize='lg'
                        >                   
                          You are not a writer. If you want you can take test
                        </Text>
                        <Link to={'/test/' + this.props.topic}>
                          <Button bg='teal.200'>Go to Test</Button>
                        </Link>      
                      </VStack>
                    </>} 
                  </>
                  :
                  <> 
                  </>
                  }       

                <InfiniteScroll
                  dataLength={this.state.posts.length}
                  next={this.fetchMoreData}
                  hasMore={this.state.contScroll}
                  loader={<Center w='100%' h='10vh' boxShadow='lg' borderRadius='lg'>Loading...</Center>}
                  endMessage={
                    <Center w='100%' h='10vh' boxShadow='lg' borderRadius='lg'>
                      <b>You have seen it all</b>
                    </Center>
                  }
                >  
                {this.state.posts.map((post, index) => 
                <Box w="100vh" borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="lg" key={post.PK}>         
                  <Box p="4" paddingLeft="4">
                    <HStack alignItems="baseline">
                      <Badge borderRadius="full" px="2" colorScheme="teal">
                        <Link to={'/profile/' + post.userId}>
                          {post.username}
                        </Link>
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
                        <Editor text={post.text}  options={{
                          toolbar: {buttons: []},
                          disableEditing: true 
                          }}/>
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
                )} 
                 </InfiniteScroll>
                </>: 
                <Box>
                  No posts in this topic 
                </Box>
              }
              </>
              
            }
            </>
          }
        </VStack>
    )
  }
}