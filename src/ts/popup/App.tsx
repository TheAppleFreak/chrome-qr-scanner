import React, { ChangeEventHandler, Component, Suspense } from "react";
import {
    Center,
    TabPanels,
    Tabs,
    Tab,
    TabPanel,
    TabList,
    Spinner,
    VStack,
} from "@chakra-ui/react";
import { Translation } from "react-i18next";
import { Message } from "../types";

const GenerateTab = React.lazy(() => import("./GenerateTab"));

export default class App extends Component<{}, State> {
    private settings: any;

    constructor(props: {}) {
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
                    <Tab>
                        <Translation>
                            {(t, { i18n }) => t("generateTab")}
                        </Translation>
                    </Tab>
                    <Tab>
                        <Translation>
                            {(t, { i18n }) => t("scanTab")}
                        </Translation>
                    </Tab>
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

interface State {
    current?: chrome.tabs.Tab;
    tabs: { [key: string]: chrome.tabs.Tab[] };
    isReady: boolean;
    generate: {
        data: string;
        key: string | number;
    };
}
