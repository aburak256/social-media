import React, {useState, useEffect} from 'react';
import '../../App.css';
import {Auth} from 'aws-amplify'
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components'

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
            <h2>This is the signup Page for: {user}</h2>
        </div>
    )
}

export default Signup
