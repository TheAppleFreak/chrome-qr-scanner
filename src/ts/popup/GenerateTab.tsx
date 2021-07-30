import React, { Component, Suspense, ChangeEvent, Fragment } from "react";
import { Box, Spinner, Input } from "@chakra-ui/react";
import Select from "react-select";
import { withTranslation, WithTranslation } from "react-i18next";
import { Message } from "../types";
// This is tree-shaking friendly
import uniq from "lodash/uniq";
import uniqWith from "lodash/uniqWith";
import isEqual from "lodash/isEqual";
import md5 from "md5";

const QRGenerate = React.lazy(() => import("./QRGenerate"));

class GenerateTab extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            data: "",
            selected: undefined,
            selKey: "",
            qrKey: "",
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
                const initialTab: chrome.tabs.Tab = data.initialTab;
                const allTabs: chrome.tabs.Tab[] = data.allTabs;
                const initialTabGroups: chrome.tabGroups.TabGroup[] =
                    data.initialTabGroups;
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
                    } else {
                        const tab = allTabs.filter((tab) => tab.active);

                        options.push({
                            label: tab[0].title!,
                            value: tab[0].url,
                        });
                    }

                    // Sort by window, then by tab group
                    let groups: { windowId: number; groupId: number }[] = [];
                    let uniqWindows: number[] = [];
                    allTabs.map((tab) => {
                        groups.push({
                            windowId: tab.windowId,
                            groupId: tab.groupId,
                        });
                        uniqWindows.push(tab.windowId);
                    });

                    // Sort by IDs for neatness (and convert the sets to arrays so we can index them)
                    groups = groups.sort((group1, group2) => {
                        if (
                            group1.windowId < group2.windowId ||
                            group1.groupId > group2.windowId
                        ) {
                            return -1;
                        } else {
                            return 1;
                        }
                    });
                    groups = uniqWith(groups, isEqual);
                    uniqWindows = uniq(uniqWindows.sort((a, b) => a - b));

                    // Finally, construct the option groups
                    groups.map((group) => {
                        // Find the group in the listing so we can pull info
                        let groupLabel: string;
                        let color: string | undefined;
                        const winIndex = uniqWindows.indexOf(group.windowId);
                        if (group.groupId === -1) {
                            groupLabel = this.props.t("selWindowUnsortedTabs", {
                                winIndex: winIndex + 1,
                            });
                        } else {
                            const tabGroup = initialTabGroups.find((grp) => {
                                return (
                                    grp.windowId === group.windowId &&
                                    grp.id === group.groupId
                                );
                            })!;

                            color = tabGroup.color;
                            if (tabGroup.title) {
                                groupLabel = this.props.t(
                                    "selWindowNamedTabGroup",
                                    {
                                        winIndex: winIndex + 1,
                                        groupName: tabGroup.title,
                                        color: tabGroup.color,
                                    },
                                );
                            } else {
                                groupLabel = this.props.t(
                                    "selWindowUnnamedTabGroup",
                                    {
                                        winIndex: winIndex + 1,
                                        color: tabGroup.color,
                                    },
                                );
                            }
                        }

                        options.push({
                            label: groupLabel,
                            color,
                            options: allTabs
                                .filter(
                                    (tab) =>
                                        tab.windowId === group.windowId &&
                                        tab.groupId === group.groupId,
                                )
                                .map((tab) => {
                                    return {
                                        label: tab.title!,
                                        value: tab.url!,
                                    };
                                }),
                        });
                    });
                }

                options.push({
                    label: "---------------",
                    options: [
                        {
                            label: this.props.t("selManualEntry"),
                            value: "manual",
                        },
                    ],
                });

                const selected = Object.keys(options[0]).includes("options")
                    ? ((options[0] as SelGroup).options[0] as SelOption)
                    : (options[0] as SelOption);

                this.setState({
                    selected,
                    data: selected.value,
                    options: options,
                    selKey: md5(selected.value),
                    qrKey: md5(selected.value),
                });

                break;
            }
        }
    }

    selOnChange(e: SelGroup | SelOption | null) {
        this.setState({
            data: (e as SelOption).value,
            selected: e,
            qrKey: md5((e as SelOption).value),
        });
    }

    inputOnChange(e: ChangeEvent<HTMLInputElement>) {
        this.setState({
            data: (e.target as HTMLInputElement).value,
            qrKey: md5((e.target as HTMLInputElement).value),
        });
    }

    render() {
        return (
            <Fragment>
                <Select
                    options={this.state.options}
                    key={this.state.selKey}
                    styles={{
                        option: (styles) => {
                            return {
                                ...styles,
                                color: "#111",
                            };
                        },
                    }}
                    defaultValue={
                        this.state.options.length > 0
                            ? Object.keys(this.state.options[0]).includes(
                                  "options",
                              )
                                ? (this.state.options[0] as SelGroup).options[0]
                                : this.state.options[0]
                            : undefined
                    }
                    onChange={(ev) => this.selOnChange(ev)}
                />

                <Box pt="4" pb="2" minHeight="var(--chakra-sizes-10)">
                    {this.state.selected ? (
                        (this.state.selected as SelOption).value ===
                        "manual" ? (
                            <Input onChange={(e) => this.inputOnChange(e)} />
                        ) : undefined
                    ) : undefined}
                </Box>
                {this.state.selected ? (
                    <Box
                        position="relative"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="275px"
                        pt="2"
                    >
                        <Suspense fallback={<Spinner />}>
                            <QRGenerate
                                data={this.state.data}
                                key={this.state.qrKey}
                            />
                        </Suspense>
                    </Box>
                ) : undefined}
            </Fragment>
        );
    }
}

export default withTranslation(["generateTab"])(GenerateTab);

interface Props extends WithTranslation {}

interface State {
    data?: string;
    selected?: SelGroup | SelOption | null;
    selKey: string;
    qrKey: string;
    options: Array<SelOption | SelGroup>;
}

interface SelOption {
    label: string;
    value: any;
}

interface SelGroup {
    label: string;
    color?: string;
    options: SelOption[];
}
