import React, { Component, Suspense } from "react";
import { VStack } from "@chakra-ui/react";
import Select from "react-select";
import i18next, { TFunction } from "i18next";
import { withTranslation, WithTranslation } from "react-i18next";
import { Message } from "../types";
import _ from "lodash";

const QRGenerate = React.lazy(() => import("./QRGenerate"));

class GenerateTab extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            selected: "",
            key: 0,
            options: [],
        };
    }

    componentDidMount() {
        // Set up message handlers, since this appears to be a big buggy in the constructor
        chrome.runtime.onMessage.addListener((msg) => this.onMessage(msg));

        // Send request for initial tabs
        chrome.runtime.sendMessage({ msgType: "getInitialTabs" });
    }

    onMessage({ msgType, data }: Message) {
        switch (msgType) {
            case "initialTabs": {
                console.log(data);
                const initialTab: chrome.tabs.Tab = data.initialTab;
                const allTabs: chrome.tabs.Tab[] = data.allTabs;
                const options: Array<SelGroup | SelOption> = [];

                if (allTabs.length === 1) {
                    // Only one tab, no need for more options
                    options.push({
                        label: initialTab.title!,
                        value: initialTab.url!,
                    });
                } else {
                    if (allTabs.filter((tab) => tab.active).length > 1) {
                        // Multiple windows are open, so there's multiple active tabs
                        options.push({
                            label: this.props.t("selActiveTabGroupLabel"),
                            options: allTabs
                                .filter((tab) => tab.active)
                                .map((tab) => {
                                    return {
                                        label: tab.title!,
                                        value: tab.url!,
                                    };
                                }),
                        });

                        // Move the actual active tab to the top of the list
                        (options[0] as SelGroup).options.sort((opt1, opt2) => {
                            if (opt1.value === initialTab.url!) {
                                return -1;
                            } else {
                                return 0;
                            }
                        });

                        // Get all window and tab group IDs deduped
                        const groups = _.uniqWith(
                            allTabs.map((tab) => {
                                return {
                                    windowId: tab.windowId,
                                    groupId: tab.groupId,
                                };
                            }),
                            _.isEqual,
                        );

                        groups.map((group) => {
                            const matchingTabs = allTabs.filter((tab) => {
                                return (
                                    tab.windowId === group.windowId
                                );
                            });

                            // Does the window only have one tab group? Just lump everything into one group
                            const groupLabel =
                                groups.filter(
                                    (grp) => grp.windowId === group.windowId,
                                ).length === 1
                                    ? this.props.t("selWinOnlyGroup", {
                                          tabs: matchingTabs.length,
                                      })
                                    : this.props.t("selWinGroup", {
                                          tabs: matchingTabs.length,
                                      });
                        });
                    }
                }

                options.push({
                    label: this.props.t("selManualEntry"),
                    value: "manual",
                });

                console.log("Options", options);

                this.setState({
                    options: options,
                });

                break;
            }
        }
    }

    render() {
        return <Select options={this.state.options} />;
    }
}

export default withTranslation(["generateTab"])(GenerateTab);

interface Props extends WithTranslation {}

interface State {
    selected: string;
    key: string | number;
    options: Array<SelOption | SelGroup>;
}

interface SelOption {
    label: string;
    value: any;
}

interface SelGroup {
    label: string;
    options: SelOption[];
}
