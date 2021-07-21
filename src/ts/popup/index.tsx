import React, { StrictMode } from "react";
import ReactDOM from "react-dom";
import { ChakraProvider } from "@chakra-ui/react";

import App from "./App";
import theme from "../theme";

import "../i18n";

ReactDOM.render(
    <>
        <StrictMode>
            <ChakraProvider resetCSS={true} theme={theme}>
                <App />
            </ChakraProvider>
        </StrictMode>
    </>,
    document.querySelector("#root"),
);
