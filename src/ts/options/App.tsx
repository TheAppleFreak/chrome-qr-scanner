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
import SettingsValidator from "../settingsSchema";

import { Message, Settings } from "../types";

class App extends Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            isLoaded: false,
            authorizedTabsScopes: false,
            closeOnBlur: false,
        };
    }

    componentDidMount() {
        // Set up message handlers
        chrome.runtime.onMessage.addListener((msg) => this.onMessage(msg));

        // Send request for settings
        chrome.runtime.sendMessage({ msgType: "getSettings" });
    }

    async onMessage({ msgType, data }: Message) {
        switch (msgType) {
            case "settings": {
                if (SettingsValidator(data.settings)) {
                    const settings: Settings = data.settings;
                    this.setState({
                        isLoaded: true,

                        // TODO: Figure out some way to automate this
                        authorizedTabsScopes: settings.authorizedTabsScopes!,
                        closeOnBlur: settings.closeOnBlur!,
                    });
                }

                break;
            }
        }
    }

    async tabsPermCheckboxOnChange(e: ChangeEvent<HTMLInputElement>) {
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
                        authorizedTabsScopes: true,
                    },
                });

                this.setState({
                    authorizedTabsScopes: true,
                });
            } catch (e) {
                // TODO: Figure out how to alert user that this failed
                chrome.runtime.sendMessage({
                    msgType: "setSettings",
                    data: {
                        authorizedTabsScopes: false,
                    },
                });

                this.setState({
                    authorizedTabsScopes: false,
                });
            }
        } else {
            chrome.permissions.remove({
                permissions: ["tabs", "tabGroups"],
            });

            chrome.runtime.sendMessage({
                msgType: "setSettings",
                data: {
                    authorizedTabsScopes: false,
                },
            });

            this.setState({
                authorizedTabsScopes: false,
            });
        }
    }

    async checkboxOnChange(e: ChangeEvent<HTMLInputElement>) {
        const propName = (e.target as HTMLInputElement).name;

        let update: { [key: string]: any } = {};
        update[propName] = (e.target as HTMLInputElement).checked;

        // @ts-ignore (I don't know how to fix this, admittedly...)
        this.setState(update);

        chrome.runtime.sendMessage({
            msgType: "setSettings",
            data: update,
        });
    }

    render() {
        return (
            <Container minWidth="lg" minHeight="300px">
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
                                    name="authorizedTabScopes"
                                    isChecked={this.state.authorizedTabsScopes}
                                    onChange={(e) =>
                                        this.tabsPermCheckboxOnChange(e)
                                    }
                                >
                                    {this.props.t("chkTabsAuth")}
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
                                    name="closeOnBlur"
                                    isChecked={this.state.closeOnBlur}
                                    onChange={(e) => this.checkboxOnChange(e)}
                                >
                                    {this.props.t("chkCloseOnBlur")}
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

interface IState {
    isLoaded: boolean;

    // Permissions authorization
    authorizedTabsScopes: boolean;

    // Popup settings
    closeOnBlur: boolean;
}
