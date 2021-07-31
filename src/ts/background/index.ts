import { Message, Settings } from "../types";
import uniq from "lodash/uniq";

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

chrome.runtime.onMessage.addListener(async ({ msgType, data }: Message) => {
    switch (msgType) {
        case "getInitialTabs": {
            chrome.storage.local.get(
                ["initialTab", "allTabs", "initialTabGroups"],
                ({ initialTab, allTabs, initialTabGroups }) => {
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
            const settings = await getSettings();
            console.log(settings);
            chrome.runtime.sendMessage({
                msgType: "settings",
                data: {
                    settings,
                },
            });

            break;
        }
        case "setSettings": {
            await setSettings(data);

            break;
        }
        default:
            throw new Error(`Unknown message type ${msgType}`);
    }
});

async function getSettings(keys?: string[]): Promise<{ [key: string]: any }> {
    let resolve: (value: Settings) => void;
    const lock = new Promise<Settings>((res) => {
        resolve = res;
    });
    chrome.storage.sync.get(["settings"], ({ settings }) => {
        resolve(settings);
    });
    const settings: Settings = Object.assign({}, await lock);

    if (keys) {
        let response: { [key: string]: any } = {};
        const settingsKeys = Object.keys(settings);
        uniq(keys).map((key) => {
            if (settingsKeys.includes(key)) {
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

async function setSettings(data: { [key: string]: any }): Promise<void> {
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

async function activateAuthorizedPermissions(): Promise<void> {
    const auth = await getSettings(["authorizedTabsScopes"]);

    const scopes: string[] = [];
    if (auth.authorizedTabsScopes) {
        scopes.push("tabs", "tabGroups");
    }

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

    await lock;
}
