import './App.css';
import Navbar from './components/Navbar';
import Home from './components/pages/Home';
import Signup from './components/pages/Signup';
import Topics from './components/pages/Topics';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import Amplify from "aws-amplify";
import awsExports from "./aws-exports";
import { withAuthenticator } from '@aws-amplify/ui-react';
Amplify.configure(awsExports);



function App() {   
    return (
        <div className = "App">
            <Router>
                <Navbar />
                <Switch>
                    <Route path='/' exact component={Home} />
                    <Route path='/sign-up' exact component={Signup} />
                    <Route path='/topics' exact component={Topics} />
                    {/* <Route path='/about' exact component={About} /> */}
                </Switch>
            </Router>
        </div >
    );
}

export default withAuthenticator(App)