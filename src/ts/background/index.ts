import { Message } from "../types";

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

chrome.runtime.onMessage.addListener(async ({ msgType }: Message) => {
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
        }
        default:
            throw new Error(`Unknown message type ${msgType}`);
    }
});

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
