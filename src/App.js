import './App.css';
import Navbar from './components/Navbar';
import Home from './components/pages/Home';
import Signup from './components/pages/Signup';
import Topics from './components/pages/Topics';
import TopicDetail from './components/pages/TopicDetail';
import PostDetail from './components/pages/PostDetail';
import Bookmarks from './components/pages/Bookmarks'
import Test from './components/pages/Test'
import Messages from './components/pages/Messages'
import Profile from './components/pages/Profile'
import SearchResults from './components/SearchResults';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import Amplify, {API, Storage} from "aws-amplify";
import awsExports from "./aws-exports";
import { withAuthenticator } from '@aws-amplify/ui-react';
import Sidebar from './components/Sidebar';
import {useState, useEffect} from 'react'
import {HStack, VStack, Box} from '@chakra-ui/react'
Amplify.configure(awsExports);



function App() {
    const [search, setSearch] = useState(false);
    const [searchText, setSearchText] = useState('')

    const handleSearch = (index) => {   
        setSearchText(index) 
        setSearch(true)
      };
    
    
    return (
        <div className = "App">
            <Router>
                <Navbar handleSearch={handleSearch}/>
                <HStack align='top' spacing='1' bg='gray.100' >
                    <Box w='23%' style={{position: 'fixed', top: '5'}}>
                        <Sidebar />
                    </Box>
                    {search ? <VStack w='50%' pl='43%' minH='100vh'><SearchResults text={searchText} onClose={() => setSearch(false)}/>  </VStack> : 
                    <VStack w='50%' pl='43%' minH='100vh'>
                        <Switch>
                            <Route path='/' exact component={Home} />
                            <Route path='/sign-up' exact component={Signup} />
                            <Route path='/topics' exact component={Topics} />
                            <Route path='/Bookmarks' exact component={Bookmarks} />
                            <Route path='/Messages' exact component={Messages} />
                            <Route exact path="/topics/:topic" component={TopicDetail} />
                            <Route exact path="/test/:topic" component={Test} />
                            <Route exact path="/profile/:profile" component={Profile} />
                            <Route exact path="/profile/" component={Profile} />
                            <Route exact path="/posts/:post" component={PostDetail} />
                            {/* <Route path='/about' exact component={About} /> */}
                        </Switch>
                    </VStack>
                    }
                </HStack>
            </Router>
        </div >
    );
}

export default withAuthenticator(App)