import React, { StrictMode } from "react";
import ReactDOM from "react-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider as ReduxProvider } from "react-redux";

import App from "./App";
import theme from "@common/theme";
import store from "@common/store";

import "@common/i18n";

ReactDOM.render(
    <>
        <StrictMode>
            <ReduxProvider store={store}>
                <ChakraProvider resetCSS={true} theme={theme}>
                    <App />
                </ChakraProvider>
            </ReduxProvider>
        </StrictMode>
    </>,
    document.querySelector("#root"),
);
