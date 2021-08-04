import uniq from "lodash/uniq";

import { Message, Settings } from "@common/validators";
import type { TMessage, ISettings, TSetSettings } from "@common/interfaces";

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
                    });
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
            });

            break;
        }
        case "getSettings": {
            const settings = await getSettings(payload.data);

            chrome.runtime.sendMessage({
                msgType: "settings",
                data: {
                    settings,
                },
            });

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
            });

            break;
        }
        default:
            throw new Error(`Unknown message type ${payload.msgType}`);
    }
});

async function getSettings(keys?: string[]): Promise<{ [key: string]: any }> {
    let resolve: (value: ISettings) => void;
    const lock = new Promise<ISettings>((res) => {
        resolve = res;
    });
    chrome.storage.sync.get(["settings"], async ({ settings }) => {
        resolve(settings);
    });
    const settings = await Settings.parseAsync(await lock);

    if (keys) {
        let response: { [key: string]: any } = {};
        const settingsKeys = Object.keys(settings);
        uniq(keys).map((key) => {
            if (settingsKeys.includes(key)) {
                // @ts-ignore (I don't know how else to do this)
                response[key] = settings[key];
            } else {
                response[key] = undefined;
            }
        });

        return response;
    } else {
        return settings;
    }
}

async function setSettings(data: TSetSettings): Promise<void> {
    const settings = Object.assign({}, await getSettings(), data);

    chrome.storage.sync.set({ settings });
}

async function getTabs(
    activeOnly: boolean = false,
): Promise<chrome.tabs.Tab[]> {
    // Get tabs before we open the scanner window
    // Since this API isn't promisified yet, though, we need to use a lock
    let resolve: (value: boolean) => void;
    const lock: Promise<boolean> = new Promise((res) => {
        resolve = res;
    });
    chrome.permissions.contains({ permissions: ["tabs"] }, (result) => {
        resolve(result);
    });

    const hasTabsPerms = await lock;

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
    // This API isn't promisified yet, so we need to use a lock
    let resolve: (value: boolean) => void;
    const lock: Promise<boolean> = new Promise((res) => {
        resolve = res;
    });
    chrome.permissions.contains({ permissions: ["tabGroups"] }, (result) => {
        resolve(result);
    });
    const hasPermissions = await lock;

    if (!hasPermissions && throwErr) {
        throw new Error(
            "Extension does not have the tabGroups permission currently.",
        );
    } else if (!hasPermissions && !throwErr) {
        return [];
    } else {
        return await chrome.tabGroups.query({});
    }
}

async function checkPermissionsConflict(): Promise<boolean> {
    let resolve: (value: boolean) => void;
    const lock: Promise<boolean> = new Promise((res) => {
        resolve = res;
    });
    chrome.permissions.contains(
        { permissions: ["tabs", "tabGroups"] },
        (result) => {
            resolve(result);
        },
    );

    const [hasPerms, settings] = await Promise.all([
        lock,
        getSettings(["authorizedTabsScopes"]) as Promise<{
            authorizedTabsScopes: boolean;
        }>,
    ]);

    if (hasPerms) {
        return false;
    } else {
        return hasPerms === settings.authorizedTabsScopes;
    }
}
