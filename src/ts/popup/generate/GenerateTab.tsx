import React, { useState, useEffect, createRef, Suspense, ChangeEvent, Fragment } from "react";
import { Box, Button, HStack, Input, Spinner, VStack } from "@chakra-ui/react";
import Select from "react-select";
import { useTranslation } from "react-i18next";
import md5 from "md5";
import * as clipboard from "clipboard-polyfill";
import { IoCopy, IoDownload, IoCheckmark } from "react-icons/io5";
// This is tree-shaking friendly
import _uniq from "lodash/uniq";
import _uniqWith from "lodash/uniqWith";
import _isEqual from "lodash/isEqual";
import _merge from "lodash/merge";

import { Message } from "@common/validators";
import defaultSettings from "@common/store/defaultState";
import type { TMessage } from "@common/interfaces";

const QRGenerate = React.lazy(() => import("./QRGenerate"));

export default function GenerateTab() {
    let copyBtnTimeout: NodeJS.Timeout | undefined;
    let saveBtnTimeout: NodeJS.Timeout | undefined;

    const { t } = useTranslation();

    // Not sure how else to call the method on the component
    const qrRef = createRef<any>();

    const [data, setData] = useState<string>();
    const [selected, setSelected] = useState<SelGroup | SelOption | null>();
    const [selKey, setSelKey] = useState("");
    const [qrKey, setQrKey] = useState("");
    const [options, setOptions] = useState<Array<SelGroup | SelOption>>([]);
    const [copyBtn, setCopyBtn] = useState<ButtonDetails>({
        color: "blue",
        icon: <IoCopy />,
        label: t("copyBtn"),
        variant: "outline",
    });
    const [saveBtn, setSaveBtn] = useState<ButtonDetails>({
        color: "blue",
        icon: <IoDownload />,
        label: t("saveBtn"),
        variant: "outline",
    });
    const [generate, setGenerate] = useState(defaultSettings.generate);

    useEffect(() => {
        // Set up message handlers, since this appears to be a big buggy in the constructor
        chrome.runtime.onMessage.addListener(onMessage);

        // Send request for initial tabs
        chrome.runtime.sendMessage({ msgType: "getInitialTabs" });
    }, []);

    const onMessage = async (payload: TMessage) => {
        payload = Message.parse(payload);

        switch (payload.msgType) {
            case "initialTabs": {
                const { initialTab, initialTabGroups, allTabs } = payload.data;

                const opts: Array<SelGroup | SelOption> = [];

                if (allTabs.length === 1) {
                    // Only one tab, no need for more options
                    opts.push({
                        label: initialTab.title!,
                        value: initialTab.url!,
                    });
                } else {
                    if (allTabs.filter((tab) => tab.active).length > 1) {
                        // Multiple windows are open, so there's multiple active tabs
                        opts.push({
                            label: t("selActiveTabGroupLabel"),
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
                        (opts[0] as SelGroup).options.sort((opt1, opt2) => {
                            if (opt1.value === initialTab.url!) {
                                return -1;
                            } else {
                                return 0;
                            }
                        });
                    } else {
                        const tab = allTabs.filter((tab) => tab.active);

                        opts.push({
                            label: tab[0].title!,
                            value: tab[0].url,
                        });
                    }

                    // Sort by window, then by tab group
                    let groups: {
                        windowId: number;
                        groupId: number;
                        incognito: boolean;
                    }[] = [];
                    let uniqWindows: number[] = [];
                    allTabs.map((tab) => {
                        groups.push({
                            windowId: tab.windowId,
                            groupId: tab.groupId,
                            incognito: tab.incognito,
                        });
                        uniqWindows.push(tab.windowId);
                    });

                    // Sort by IDs for neatness
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
                    groups = _uniqWith(groups, _isEqual);
                    uniqWindows = _uniq(uniqWindows.sort((a, b) => a - b));

                    // Finally, construct the option groups
                    groups.map((group) => {
                        // Find the group in the listing so we can pull info
                        let groupLabel: string;
                        let color: string | undefined;
                        const winIndex = uniqWindows.indexOf(group.windowId);
                        if (group.groupId === -1) {
                            groupLabel = t("selWindowUnsortedTabs", {
                                winIndex: winIndex + 1,
                                context: group.incognito
                                    ? "incognito"
                                    : undefined,
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
                                groupLabel = t(
                                    "selWindowNamedTabGroup",
                                    {
                                        winIndex: winIndex + 1,
                                        groupName: tabGroup.title,
                                        color: tabGroup.color,
                                        context: group.incognito
                                            ? "incognito"
                                            : undefined,
                                    },
                                );
                            } else {
                                groupLabel = t(
                                    "selWindowUnnamedTabGroup",
                                    {
                                        winIndex: winIndex + 1,
                                        color: tabGroup.color,
                                        context: group.incognito
                                            ? "incognito"
                                            : undefined,
                                    },
                                );
                            }
                        }

                        opts.push({
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

                opts.push({
                    label: t("selOtherGroup"),
                    options: [
                        {
                            label: t("selManualEntry"),
                            value: "manual",
                        },
                    ],
                });

                const sel = Object.keys(opts[0]).includes("options")
                    ? ((opts[0] as SelGroup).options[0] as SelOption)
                    : (opts[0] as SelOption);

                setSelected(sel);
                setData(sel.value);
                setOptions(opts);
                setSelKey(md5(sel.value));
                setQrKey(md5(sel.value));

                break;
            }
        }
    };

    const selOnChange = (e: SelGroup | SelOption | null) => {
        if ((e as SelOption).value !== "manual") {
            setData((e as SelOption).value);
            setSelected(e);
            setQrKey(md5((e as SelOption).value));
        } else {
            setData("");
            setSelected(e);
            setQrKey(md5(""));
        }
    };

    const inputOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        setData((e.target as HTMLInputElement).value);
        setQrKey(md5((e.target as HTMLInputElement).value));
    };

    const copyOnClick = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => {
        // TODO: fix this
        const rendered: string = await qrRef.current!.renderQRCode();
        // The ClipboardItem interface doesn't appear to be in Chrome as of this writing
        const item = new clipboard.ClipboardItem({
            "image/png": await (await fetch(rendered)).blob(),
        });
        await clipboard.write([item]);

        setCopyBtn({
            color: "green",
            label: t("copyBtnSuccess"),
            icon: <IoCheckmark />,
            variant: "solid",
        });

        if (copyBtnTimeout !== undefined) {
            clearTimeout(copyBtnTimeout);
        }
        copyBtnTimeout = setTimeout(() => {
            setCopyBtn({
                color: "blue",
                label: t("copyBtn"),
                icon: <IoCopy />,
                variant: "outline",
            });

            copyBtnTimeout = undefined;
        }, 3000);
    };

    const saveOnClick = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => {
        const rendered: string = await qrRef.current!.renderQRCode();

        const link = document.createElement("a");
        link.href = rendered;
        link.download = "QR Code";
        link.click();
        link.remove();

        setSaveBtn({
            color: "green",
            label: t("saveBtnSuccess"),
            icon: <IoCheckmark />,
            variant: "solid",
        });

        if (saveBtnTimeout !== undefined) {
            clearTimeout(saveBtnTimeout);
        }
        saveBtnTimeout = setTimeout(() => {
            setSaveBtn({
                color: "blue",
                label: t("saveBtn"),
                icon: <IoDownload />,
                variant: "outline",
            });

            saveBtnTimeout = undefined;
        }, 3000);
    };

    return (
        <Fragment>
            <Select
                options={options}
                key={selKey}
                styles={{
                    option: (styles, state) => {
                        return {
                            ...styles,
                            color: state.isSelected ? "#FFF" : "#111",
                            whiteSpace: "pre-wrap",
                            textAlign: "left",

                            "&:after":
                                state.data.value !== "manual"
                                    ? {
                                          content: `"${state.data.value.replace(
                                              /"/g,
                                              '"',
                                          )}"`,
                                          color: state.isSelected
                                              ? "#EEE"
                                              : "#666",
                                          fontSize: "85%",
                                          display: "block",
                                      }
                                    : undefined,
                        };
                    },
                }}
                defaultValue={
                    options.length > 0
                        ? Object.keys(options[0]).includes(
                              "options",
                          )
                            ? (options[0] as SelGroup).options[0]
                            : options[0]
                        : undefined
                }
                onChange={selOnChange}
            />

            <Box pt="4" pb="2" minHeight="var(--chakra-sizes-10)">
                {selected ? (
                    (selected as SelOption).value ===
                    "manual" ? (
                        <Input
                            placeholder={t(
                                "inputUrlPlaceholder",
                            )}
                            onChange={inputOnChange}
                        />
                    ) : undefined
                ) : undefined}
            </Box>
            {selected ? (
                <HStack
                    position="relative"
                    justifyContent="center"
                    alignItems="center"
                    height="275px"
                    pt="2"
                    spacing={8}
                >
                    <Suspense fallback={<Spinner />}>
                        <QRGenerate
                            data={data}
                            key={qrKey}
                            ref={qrRef}
                        />
                        <VStack
                            alignItems="center"
                            justifyContent="center"
                            spacing={4}
                        >
                            <Button
                                leftIcon={copyBtn.icon}
                                minWidth="120px"
                                colorScheme={copyBtn.color}
                                variant={copyBtn.variant}
                                disabled={data === ""}
                                onClick={copyOnClick}
                            >
                                {copyBtn.label}
                            </Button>
                            <Button
                                leftIcon={saveBtn.icon}
                                minWidth="120px"
                                colorScheme={saveBtn.color}
                                variant={saveBtn.variant}
                                disabled={data === ""}
                                onClick={saveOnClick}
                            >
                                {saveBtn.label}
                            </Button>
                        </VStack>
                    </Suspense>
                </HStack>
            ) : undefined}
        </Fragment>
    );
}

type SelOption = {
    label: string;
    value: any;
}

type SelGroup = {
    label: string;
    color?: string;
    options: SelOption[];
}

type ButtonDetails = {
    color: string;
    icon: React.ReactElement<
        any,
        string | React.JSXElementConstructor<any>
    >;
    label: string;
    variant: string;
};