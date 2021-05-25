import React, {useState} from 'react';
import '../../App.css';
import {Auth} from 'aws-amplify'

function Signup() {
    const [user, setUser] = useState("");

    function useSignValue(value){
      setUser(value['username'])
    }
  
    Auth.currentAuthenticatedUser().then(
      useSignValue
    )
    
    return (
        <div className='sign-up'>
          <title>Sign-Up</title>
            <h2>This is the signup Page for: {user}</h2>
        </div>
    )
}

export default Signup
