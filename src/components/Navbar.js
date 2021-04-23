import React, {useState, useEffect} from 'react'
import {Link} from 'react-router-dom'
import {Button} from './Button';
import {Auth} from 'aws-amplify'
import './Navbar.css';


function Navbar() {
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
                <div className="navbar-container">
                    <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
                        SOCM
                    </Link>
                    <div className='menu-icon' onClick={handleClick}>
                        <i className={click ? 'fas fa-times': 'fas fa-bars'} />
                    </div>
                    <ul className={click ? 'nav-menu active' : 'nav-menu'}>
                        <li className='nav-item'>
                            <Link to='/' className='nav-links' onClick={closeMobileMenu}>
                                Home
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link to='/topics' className='nav-links' onClick={closeMobileMenu}>
                                Topics
                            </Link>
                        </li>
                        <li className='nav-item'>
                            <Link to='/about' className='nav-links' onClick={closeMobileMenu}>
                                About
                            </Link>
                        </li>
                        {!user ? 
                            <li>
                                <Link to='/sign-up' className='nav-links-mobile' onClick={closeMobileMenu}>
                                    Sign Up
                                </Link>
                            </li> 
                            :<li>
                                <Link to='/profile' className='nav-links-mobile' onClick={closeMobileMenu}>
                                    {user}
                                </Link>
                            </li>}
                    </ul>
                    {!user && button ? <Button buttonStyle='btn--outline'>SIGN UP</Button> 
                        :<Link to='/profile' className='nav-links' onClick={closeMobileMenu}>
                            {user}
                        </Link>}
                </div>
            </nav>
        </>
    )
}

export default Navbar
