import React, {useState, useEffect}  from 'react'
import { useParams } from 'react-router'
import '../../App.css';
import {Center, Box, VStack} from "@chakra-ui/react"
import {Auth} from 'aws-amplify'
import Post from '../Post';

function PostDetail() {
    const {post} = useParams()
    const [user, setUser] = useState("");
    
    Auth.currentAuthenticatedUser().then(
      function(result){
        setUser(result['username'])
      }
    )

    return (
        <div>
            <title>Post</title>
            <Center> 
                <VStack spacing="24px" width="70%">            
                    <br/>
                    <Post post={post} user={user} />
                </VStack>
            </Center>
        </div>
    )
}

export default PostDetail
