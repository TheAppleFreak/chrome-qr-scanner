import React, { Component, Suspense } from "react";
import {
    TabPanels,
    Tabs,
    Tab,
    TabPanel,
    TabList,
    Spinner,
} from "@chakra-ui/react";
import { withTranslation, WithTranslation } from "react-i18next";
import { Message } from "../types";

const GenerateTab = React.lazy(() => import("./GenerateTab"));

class App extends Component<Props, State> {
    constructor(props: Props) {
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
            <Tabs isLazy>
                <TabList>
                    <Tab>{this.props.t("generateTab")}</Tab>
                    <Tab>{this.props.t("scanTab")}</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <Suspense fallback={<Spinner />}>
                            <GenerateTab />
                        </Suspense>
                    </TabPanel>
                    <TabPanel>
                        <p>temp</p>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        );
    }
}

export default withTranslation(["app"])(App);

interface Props extends WithTranslation {}

interface State {
    current?: chrome.tabs.Tab;
    tabs: { [key: string]: chrome.tabs.Tab[] };
    isReady: boolean;
    generate: {
        data: string;
        key: string | number;
    };
}
