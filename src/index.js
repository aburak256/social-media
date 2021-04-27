import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { ChakraProvider } from "@chakra-ui/react";

import Amplify from "aws-amplify";
import awsExports from "./aws-exports";
Amplify.configure(awsExports);

ReactDOM.render(
    <React.StrictMode>
      <ChakraProvider resetCSS>
        <App />
      </ChakraProvider>
    </React.StrictMode>,
    document.getElementById("root")
  );