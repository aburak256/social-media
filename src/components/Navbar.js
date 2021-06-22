import React, {useState, useEffect} from 'react'
import {Link} from 'react-router-dom'
import {Button} from './Button';
import {Auth} from 'aws-amplify'
import './Navbar.css';
import Sidebar from './Sidebar'
import Logo from './Logo';
import MessageDrawer from './MessageDrawer'
import SearchBar from './SearchBar';
import { Box } from '@chakra-ui/layout';
import {SiGooglemessages} from 'react-icons/si'
import {ImHome} from 'react-icons/im'
import {GiTreeBranch} from 'react-icons/gi'
import {CgProfile} from 'react-icons/cg'
import { Icon } from '@chakra-ui/icons';


function Navbar(props) {
    const [click, setClick] = useState(false);
    const [button, setButton] = useState(true);

    const handleClick = () => setClick(!click);
    const closeMobileMenu = () => setClick(false)

    const showButton = () => {
        if (window.innerWidth <= 960) {
          setButton(false);
        } else {
          setButton(true);
        }
      };

    useEffect(() => {
        showButton();
    }, []);
      
    window.addEventListener('resize', showButton);

    const [user, setUser] = useState("");
  
    Auth.currentAuthenticatedUser().then(
      function(result){
        setUser(result['username'])
      }
    )
    
    return (
        <>
            <nav className="navbar">
                {/* <Sidebar /> */}
                <Link to="/" className="navbar-logo" onClick={closeMobileMenu} onClick={() => props.onCloseSearch()} >
                        <Box ml='7'>
                            <Logo />
                        </Box>
                    </Link>
                <div className="navbar-container">          
                    <Box w='50%' ml='24vw' bg='white' borderRadius='lg'>
                        <SearchBar onSearch={(event) => props.handleSearch(event)}/>
                    </Box>
                    <div className='menu-icon' onClick={handleClick}>
                        <i className={click ? 'fas fa-times': 'fas fa-bars'} />
                    </div>
                    
                    <ul className={click ? 'nav-menu active' : 'nav-menu'}>
                        <li className='nav-item'>
                            <Link to='/' className='nav-links' onClick={closeMobileMenu} onClick={() => props.onCloseSearch()}>
                                <Icon as={ImHome} w={6} h={6} />
                            </Link>
                        </li>
                        <li className='nav-item'>
                                <Link to='/messages' className='nav-links' onClick={closeMobileMenu} onClick={() => props.onCloseSearch()}>
                                    <Icon as={SiGooglemessages} w={6} h={6}/>
                                </Link>
                        </li>
                        <li className='nav-item'>
                            <Link to='/topics' className='nav-links' onClick={closeMobileMenu} onClick={() => props.onCloseSearch()}>
                                <Icon as={GiTreeBranch} w={6} h={6}/>               
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link to='/profile' className='nav-links' onClick={closeMobileMenu} onClick={() => props.onCloseSearch()}>
                                <Icon as={CgProfile} w={6} h={6}/>   
                            </Link>
                        </li>
                        {!user ? 
                            <li>
                                <Link to='/sign-up' className='nav-links-mobile' onClick={closeMobileMenu} onClick={() => props.onCloseSearch()}>
                                    Sign Up
                                </Link>
                            </li> 
                            :<li>
                                <Link to='/profile' className='nav-links-mobile' onClick={closeMobileMenu} onClick={() => props.onCloseSearch()}>
                                    {user}
                                </Link>
                            </li>}
                    </ul>
                    
                </div>
            </nav>
        </>
    )
}

export default Navbar
