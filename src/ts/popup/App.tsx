import React, { Component, Suspense } from "react";
import {
    Box,
    Icon,
    IconButton,
    TabPanels,
    Tabs,
    Tab,
    TabPanel,
    TabList,
    Spinner,
} from "@chakra-ui/react";
import { IoCamera, IoQrCode, IoOptions } from "react-icons/io5";
import { withTranslation, WithTranslation } from "react-i18next";

import { Message, Settings } from "@common/validators";
import type { TMessage, ISettings } from "@common/interfaces";
import defaultSettings from "@common/store/defaultState";

const GenerateTab = React.lazy(() => import("./GenerateTab"));
const PermissionsAlert = React.lazy(() => import("./PermissionsAlert"));

class App extends Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            isSettingsLoaded: false,
            initialPermissionsConflict: false,
            permissionsConflict: false,
            permissionsAlertKey: Math.floor(Math.random() * 1000),
            temporarilySuppressCloseOnBlur: false,
            ...defaultSettings,
        };
    }

    componentDidMount() {
        // Set up message handlers
        chrome.runtime.onMessage.addListener((msg) => this.onMessage(msg));

        // Add handler for program dismissal logic
        window.addEventListener("blur", () => this.onBlur());

        // Send request for settings
        chrome.runtime.sendMessage({ msgType: "getSettings" });
        chrome.runtime.sendMessage({ msgType: "checkPermissionsConflict" });
    }

    onMessage(payload: TMessage) {
        payload = Message.parse(payload);

        switch (payload.msgType) {
            case "settings": {
                const { popup, permissions } = payload.data.settings;

                this.setState({
                    isSettingsLoaded: true,
                    permissions,
                    popup,
                });

                break;
            }
            case "permissionsConflict": {
                if (payload.data) {
                    window.resizeBy(0, 144);
                }

                this.setState({
                    initialPermissionsConflict: payload.data,
                    permissionsConflict: payload.data,
                });

                break;
            }
        }
    }

    async onBlur() {
        if (
            !this.state.temporarilySuppressCloseOnBlur &&
            this.state.popup.closeOnBlur
        ) {
            window.top.close();
        }
    }

    async onGrantPermsClick(
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) {
        this.setState({
            temporarilySuppressCloseOnBlur: true,
        });

        let resolve: (value: boolean | PromiseLike<boolean>) => void,
            reject: (reason: any) => void;
        const lock = new Promise<boolean>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        chrome.permissions.request(
            {
                permissions: ["tabs", "tabGroups"],
            },
            (success) => {
                if (success) {
                    resolve(success);
                } else {
                    reject(success);
                }
            },
        );

        try {
            await lock;

            window.resizeBy(0, -72);

            this.setState({
                permissionsConflict: false,
                permissionsAlertKey: Math.floor(Math.random() * 1000),
                temporarilySuppressCloseOnBlur: false,
            });
        } catch (err) {
            this.setState({
                temporarilySuppressCloseOnBlur: false,
            });
            console.error(this.props.t("permissionsNeededFail"));
        }
    }

    render() {
        return this.state.isSettingsLoaded ? (
            <>
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
                    <TabList flexShrink={0} pr={10}>
                        <Tab>
                            <Icon as={IoQrCode} mr="2" />{" "}
                            {this.props.t("generateTab")}
                        </Tab>
                        <Tab isDisabled={true}>
                            <Icon as={IoCamera} mr="2" />{" "}
                            {this.props.t("scanTab")}
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
                {this.state.initialPermissionsConflict ? (
                    <Suspense fallback={<Spinner />}>
                        <PermissionsAlert
                            resolved={!this.state.permissionsConflict}
                            onGrantPermsClick={(e) => this.onGrantPermsClick(e)}
                            key={this.state.permissionsAlertKey}
                        />
                    </Suspense>
                ) : undefined}
                <IconButton
                    aria-label="Options"
                    icon={<IoOptions />}
                    position="fixed"
                    variant="ghost"
                    top={0}
                    right={0}
                    borderRadius={0}
                    onClick={(e) => chrome.runtime.openOptionsPage()}
                />
            </>
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

interface IState extends Pick<ISettings, "permissions" | "popup"> {
    isSettingsLoaded: boolean;
    initialPermissionsConflict: boolean;
    permissionsConflict: boolean;
    permissionsAlertKey: number;
    temporarilySuppressCloseOnBlur: boolean;
}
