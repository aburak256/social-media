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
                <div className="navbar-container">
                    <Link to="/" className="navbar-logo" onClick={() => props.onCloseSearch()} onClick={closeMobileMenu}>
                        <Box ml='15vh'>
                            <Logo />
                        </Box>
                    </Link>
                    <Box w='50%' ml='20vh' bg='white' borderRadius='lg'>
                        <SearchBar onSearch={(event) => props.handleSearch(event)}/>
                    </Box>
                    <div className='menu-icon' onClick={handleClick}>
                        <i className={click ? 'fas fa-times': 'fas fa-bars'} />
                    </div>
                    
                    <ul className={click ? 'nav-menu active' : 'nav-menu'}>
                        <li className='nav-item'>
                            <Link to='/' className='nav-links' onClick={closeMobileMenu} onClick={() => props.onCloseSearch()}>
                                Home
                            </Link>
                        </li>
                        <li className='nav-item'>
                                <Link to='/messages' className='nav-links' onClick={closeMobileMenu} onClick={() => props.onCloseSearch()}>
                                    Messages
                                </Link>
                        </li>
                        <li className='nav-item'>
                            <Link to='/topics' className='nav-links' onClick={closeMobileMenu} onClick={() => props.onCloseSearch()}>
                                Topics
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link to='/about' className='nav-links' onClick={closeMobileMenu} onClick={() => props.onCloseSearch()}>
                                About
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link to='/profile' className='nav-links' onClick={closeMobileMenu} onClick={() => props.onCloseSearch()}>
                                {user}
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
