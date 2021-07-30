import React, { Component, Suspense } from "react";
import {
    Box,
    Grid,
    Icon,
    Portal,
    TabPanels,
    Tabs,
    Tab,
    TabPanel,
    TabList,
    Spinner,
} from "@chakra-ui/react";
import { IoCamera, IoQrCode } from "react-icons/io5";
import { withTranslation, WithTranslation } from "react-i18next";
import { Message } from "../types";

const GenerateTab = React.lazy(() => import("./GenerateTab"));

class App extends Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            current: undefined,
            tabs: {},
            isReady: false,
            generate: {
                data: "",
                key: 0,
            },
        };
    }

    componentDidMount() {
        // Set up message handlers, since this appears to be a big buggy in the constructor
        chrome.runtime.onMessage.addListener((msg) => this.onMessage(msg));

        // Add handler for program dismissal logic
        window.addEventListener("blur", () => this.onBlur());

        // Send request for settings
        // chrome.runtime.sendMessage({
        //     type: "reqSettings"
        // }, (settings) => {
        //     // Clean this up later
        //     this.settings = settings;
        // });

        // Send request for initial tabs
        chrome.runtime.sendMessage({ msgType: "getInitialTabs" });
    }

    onMessage({ msgType, data }: Message) {
        switch (msgType) {
        }
    }

    async onBlur() {}

    render() {
        return (
            <Tabs isFitted isLazy lazyBehavior="unmount" 
                align="center" display="flex" flexDir="column"
                height="100%"
            >
                <TabList flexShrink={0}>
                    <Tab><Icon as={IoQrCode} mr="1.5" /> {this.props.t("generateTab")}</Tab>
                    <Tab><Icon as={IoCamera} mr="1.5" /> {this.props.t("scanTab")}</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel height="100%" display="flex" flexDirection="column">
                        <Suspense fallback={<Spinner />} >
                            <GenerateTab />
                        </Suspense>
                    </TabPanel>
                    <TabPanel height="100%" display="flex" flexDirection="column">
                        <p>temp</p>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        );
    }
}

export default withTranslation(["app"])(App);

interface IProps extends WithTranslation {}

interface IState {
    current?: chrome.tabs.Tab;
    tabs: { [key: string]: chrome.tabs.Tab[] };
    isReady: boolean;
    generate: {
        data: string;
        key: string | number;
    };
}
