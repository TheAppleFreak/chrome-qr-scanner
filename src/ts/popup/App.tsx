import React, { Component, Suspense } from "react";
import {
    Box,
    Icon,
    TabPanels,
    Tabs,
    Tab,
    TabPanel,
    TabList,
    Spinner,
} from "@chakra-ui/react";
import { IoCamera, IoQrCode } from "react-icons/io5";
import { withTranslation, WithTranslation } from "react-i18next";
import { Message, Settings } from "../types";
import SettingsValidator from "../settingsSchema";

const GenerateTab = React.lazy(() => import("./GenerateTab"));

class App extends Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            isSettingsLoaded: false,
            closeOnBlur: true,
        };
    }

    componentDidMount() {
        // Set up message handlers
        chrome.runtime.onMessage.addListener((msg) => this.onMessage(msg));

        // Add handler for program dismissal logic
        window.addEventListener("blur", () => this.onBlur());

        // Send request for settings
        chrome.runtime.sendMessage({ msgType: "getSettings" });
    }

    onMessage({ msgType, data }: Message) {
        switch (msgType) {
            case "settings": {
                const settings: Settings = Object.assign({}, data.settings);

                if (SettingsValidator(settings)) {
                    this.setState({
                        isSettingsLoaded: true,

                        // TODO: Update this with a properly validated setup later
                        closeOnBlur:
                            settings.closeOnBlur !== undefined
                                ? settings.closeOnBlur
                                : true,
                    });
                } else {
                    console.error("shit's broke sorry");
                }

                break;
            }
        }
    }

    async onBlur() {
        if (this.state.closeOnBlur) {
            window.top.close();
        }
    }

    render() {
        return this.state.isSettingsLoaded ? (
            <Tabs
                isFitted
                isLazy
                lazyBehavior="unmount"
                align="center"
                display="flex"
                flexDir="column"
                height="100%"
                overflow="hidden"
            >
                <TabList flexShrink={0}>
                    <Tab>
                        <Icon as={IoQrCode} mr="2" />{" "}
                        {this.props.t("generateTab")}
                    </Tab>
                    <Tab isDisabled={true}>
                        <Icon as={IoCamera} mr="2" /> {this.props.t("scanTab")}
                    </Tab>
                </TabList>
                <TabPanels>
                    <TabPanel
                        height="100%"
                        display="flex"
                        flexDirection="column"
                    >
                        <Suspense fallback={<Spinner />}>
                            <GenerateTab />
                        </Suspense>
                    </TabPanel>
                    <TabPanel
                        height="100%"
                        display="flex"
                        flexDirection="column"
                    >
                        <p>temp</p>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        ) : (
            <Box
                width="100%"
                height="100vh"
                display="flex"
                justifyContent="center"
                alignItems="center"
            >
                <Spinner />
            </Box>
        );
    }
}

export default withTranslation(["app"])(App);

interface IProps extends WithTranslation {}

interface IState {
    isSettingsLoaded: boolean;
    closeOnBlur: boolean;
}
