import _uniq from "lodash/uniq";
import _merge from "lodash/merge";
import _get from "lodash/get";
import _set from "lodash/set";

import { Message, Settings, SettingsPartial } from "@common/validators";
import defaultSettings from "@common/store/defaultState";
import type {
    TMessage,
    ISettings,
    TSetSettings,
    ISettingsPartial,
} from "@common/interfaces";

chrome.action.onClicked.addListener(async (tab) => {
    // Get tabs and store them until the new window requests them
    const [tabs, tabGroups] = await Promise.all([
        getTabs(),
        getTabGroups(false),
    ]);
    chrome.storage.local.set({
        allTabs: tabs,
        initialTab: tab,
        initialTabGroups: tabGroups,
    });

    const popupUrl = chrome.runtime.getURL("popup.html");
    await chrome.windows.create({
        focused: true,
        type: "popup",
        width: 500,
        height: 500,
        url: popupUrl,
    });
});

chrome.runtime.onMessage.addListener(async (payload: TMessage) => {
    payload = await Message.parseAsync(payload);

    switch (payload.msgType) {
        case "getInitialTabs": {
            chrome.storage.local.get(
                ["initialTab", "allTabs", "initialTabGroups"],
                async ({ initialTab, allTabs, initialTabGroups }) => {
                    chrome.runtime.sendMessage({
                        msgType: "initialTabs",
                        data: {
                            initialTab,
                            allTabs,
                            initialTabGroups,
                        },
                    } as TMessage);
                },
            );

            break;
        }
        case "getCurrentTabs": {
            let resolve: (value: chrome.tabs.Tab) => void;
            const lock = new Promise<chrome.tabs.Tab>((res) => {
                resolve = res;
            });
            chrome.storage.local.get(["initialTab"], ({ initialTab }) => {
                resolve(initialTab);
            });

            const [initialTab, allTabs, tabGroups] = await Promise.all([
                lock,
                getTabs(false),
                getTabGroups(false),
            ]);

            chrome.runtime.sendMessage({
                msgType: "currentTabs",
                data: {
                    initialTab,
                    allTabs,
                    tabGroups,
                },
            } as TMessage);

            break;
        }
        case "getSettings": {
            const settings = await getSettings(payload.data);

            chrome.runtime.sendMessage({
                msgType: "settings",
                data: {
                    settings,
                },
            } as TMessage);

            break;
        }
        case "setSettings": {
            await setSettings(payload.data);

            break;
        }
        case "checkPermissionsConflict": {
            const status = await checkPermissionsConflict();

            chrome.runtime.sendMessage({
                msgType: "permissionsConflict",
                data: status,
            } as TMessage);

            break;
        }
        default:
            throw new Error(`Unknown message type ${payload.msgType}.
            Dev note: if you're getting this but are sure the message type is correct, double check that you have a \`break\` at the end of the switch.`);
    }
});

async function getSettings(
    keys?: string | string[],
): Promise<ISettingsPartial> {
    if (keys && !Array.isArray(keys)) keys = [keys];

    let resolve: (value: ISettings) => void;
    const lock = new Promise<ISettings>((res) => {
        resolve = res;
    });
    chrome.storage.sync.get(["settings"], async ({ settings }) => {
        resolve(settings);
    });
    const settings = await Settings.parseAsync(
        _merge(defaultSettings, { ...(await lock) }),
    );

    if (keys) {
        let response: { [key: string]: any } = {};
        _uniq(keys).map((key) => {
            _set(response, key, _get(settings, key));
        });

        return response;
    } else {
        return settings;
    }
}

async function setSettings(data: TSetSettings): Promise<void> {
    const [oldSettings, incoming] = await Promise.all([
        getSettings(),
        SettingsPartial.parseAsync(data),
    ]);
    const settings = _merge({ ...oldSettings }, incoming);

    chrome.storage.sync.set({ settings });
}

function hasPermissions(permissions: string | string[]): Promise<boolean> {
    if (!Array.isArray(permissions)) {
        permissions = [permissions];
    }

    let resolve: (value: boolean) => void;
    const lock: Promise<boolean> = new Promise((res) => {
        resolve = res;
    });
    chrome.permissions.contains({ permissions }, (result) => {
        resolve(result);
    });

    return lock;
}

async function getTabs(
    activeOnly: boolean = false,
): Promise<chrome.tabs.Tab[]> {
    const hasTabsPerms = await hasPermissions("tabs");

    let options = {};
    if (activeOnly || !hasTabsPerms) {
        // Limit tab query to only active tab
        options = { active: true, currentWindow: true };
    }
    return await chrome.tabs.query(options);
}

async function getTabGroups(
    throwErr: boolean = true,
): Promise<chrome.tabGroups.TabGroup[]> {
    const hasPerms = await hasPermissions(["tabGroups"]);

    if (!hasPerms && throwErr) {
        throw new Error(
            "Extension does not have the tabGroups permission currently.",
        );
    } else if (!hasPerms && !throwErr) {
        return [];
    } else {
        return await chrome.tabGroups.query({});
    }
}

async function getWindows(
    throwErr: boolean = true,
): Promise<chrome.windows.Window[]> {
    const hasPerms = await hasPermissions("tabs");

    if (!hasPerms && throwErr) {
        throw new Error(
            "Extension does not have the tabs permission currently.",
        );
    } else if (!hasPerms && !throwErr) {
        return [];
    } else {
        return await chrome.windows.getAll();
    }
}

async function checkPermissionsConflict(): Promise<boolean> {
    const [hasPerms, settings] = await Promise.all([
        hasPermissions(["tabs", "tabGroups"]),
        getSettings("permissions.authorizedTabsScopes") as Promise<{
            permissions: {
                authorizedTabsScopes: boolean;
            };
        }>,
    ]);

    if (hasPerms) {
        return false;
    } else {
        return hasPerms !== settings.permissions.authorizedTabsScopes;
    }
}
