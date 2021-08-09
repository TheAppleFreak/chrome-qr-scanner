import React, { ChangeEvent, Component, ReactText, Suspense } from "react";
import {
    Checkbox,
    CheckboxGroup,
    Container,
    Divider,
    Heading,
    Skeleton,
    Stack,
} from "@chakra-ui/react";
import { withTranslation, WithTranslation } from "react-i18next";
import _merge from "lodash/merge";
import _get from "lodash/get";
import _set from "lodash/set";

import { Message, Settings, SettingsPartial } from "@common/validators";
import defaultSettings from "@common/store/defaultState";
import type { ISettings, ISettingsPartial, TMessage } from "@common/interfaces";

class App extends Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            isLoaded: false,
            ...defaultSettings,
        };
    }

    componentDidMount() {
        // Set up message handlers
        chrome.runtime.onMessage.addListener((msg) => this.onMessage(msg));

        // Send request for settings
        chrome.runtime.sendMessage({ msgType: "getSettings" });
    }

    async onMessage(payload: TMessage) {
        payload = await Message.parseAsync(payload);

        switch (payload.msgType) {
            case "settings": {
                const settings = payload.data.settings;

                this.setState({
                    isLoaded: true,
                    ...settings,
                });

                break;
            }
        }
    }

    tabsPermCheckboxOnChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if ((e.target as HTMLInputElement).checked) {
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

                chrome.runtime.sendMessage({
                    msgType: "setSettings",
                    data: {
                        permissions: {
                            authorizedTabsScopes: true,
                        },
                    },
                } as TMessage);

                this.setState(
                    _merge({ ...this.state }, {
                        permissions: {
                            authorizedTabsScopes: true,
                        },
                    } as ISettingsPartial),
                );
            } catch (e) {
                // TODO: Figure out how to alert user that this failed
                chrome.runtime.sendMessage({
                    msgType: "setSettings",
                    data: {
                        permissions: {
                            authorizedTabsScopes: false,
                        },
                    },
                } as TMessage);

                const state = _merge({ ...this.state }, {
                    permissions: {
                        authorizedTabsScopes: true,
                    },
                } as ISettingsPartial);
                this.setState(state);
            }
        } else {
            chrome.permissions.remove({
                permissions: ["tabs", "tabGroups"],
            });

            chrome.runtime.sendMessage({
                msgType: "setSettings",
                data: {
                    permissions: {
                        authorizedTabsScopes: false,
                    },
                },
            } as TMessage);

            const state = _merge({ ...this.state }, {
                permissions: {
                    authorizedTabsScopes: false,
                },
            } as ISettingsPartial);
            this.setState(state);
        }
    };

    checkboxOnChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const propName = (e.target as HTMLInputElement).name;

        const update = await Settings.parseAsync(
            _set(
                {
                    ...this.state,
                },
                propName,
                (e.target as HTMLInputElement).checked,
            ),
        );

        this.setState(update);

        chrome.runtime.sendMessage({
            msgType: "setSettings",
            data: update,
        } as TMessage);
    };

    render() {
        return (
            <Container minWidth="xl" minHeight="400px">
                <Skeleton isLoaded={this.state.isLoaded}>
                    <Heading pt={2} size="2xl">
                        {this.props.t("optionsHeading")}
                    </Heading>

                    <Stack p={4}>
                        <Heading size="lg">
                            {this.props.t("permissionsHeading")}
                        </Heading>

                        <CheckboxGroup>
                            <Stack direction="column">
                                <Checkbox
                                    name="permissions.authorizedTabScopes"
                                    isChecked={
                                        this.state.permissions
                                            .authorizedTabsScopes
                                    }
                                    onChange={this.tabsPermCheckboxOnChange}
                                >
                                    {this.props.t(
                                        "permissions.authorizedTabScopes.label",
                                    )}
                                </Checkbox>
                            </Stack>
                        </CheckboxGroup>
                    </Stack>

                    <Divider />

                    <Stack p={4}>
                        <Heading size="lg">
                            {this.props.t("popupHeading")}
                        </Heading>

                        <CheckboxGroup>
                            <Stack direction="column">
                                <Checkbox
                                    name="popup.closeOnBlur"
                                    isChecked={this.state.popup.closeOnBlur}
                                    onChange={this.checkboxOnChange}
                                >
                                    {this.props.t("popup.closeOnBlur.label")}
                                </Checkbox>
                            </Stack>
                        </CheckboxGroup>
                    </Stack>

                    <Divider />

                    <Stack p={4}>
                        <Heading size="lg">
                            {this.props.t("generateHeading")}
                        </Heading>

                        <CheckboxGroup>
                            <Stack direction="column">
                                <Stack>temp</Stack>
                            </Stack>
                        </CheckboxGroup>
                    </Stack>

                    <Divider />

                    <Stack p={4}>
                        <Heading size="lg">
                            {this.props.t("scanHeading")}
                        </Heading>

                        <CheckboxGroup>
                            <Stack direction="column">
                                <Checkbox
                                    name="scan.startWebcamImmediately"
                                    isChecked={
                                        this.state.scan.startWebcamImmediately
                                    }
                                    onChange={this.checkboxOnChange}
                                >
                                    {this.props.t(
                                        "scan.startWebcamImmediately.label",
                                    )}
                                </Checkbox>
                            </Stack>
                        </CheckboxGroup>
                    </Stack>
                </Skeleton>
            </Container>
        );
    }
}

export default withTranslation(["options"])(App);

interface IProps extends WithTranslation {}

interface IState extends ISettings {
    isLoaded: boolean;
}
