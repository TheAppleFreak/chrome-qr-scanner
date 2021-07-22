import { Message } from "../types";

chrome.action.onClicked.addListener(async (tab) => {
    // Get tabs and store them until the new window requests them
    const tabs = await getTabs();
    chrome.storage.local.set({
        initialTab: tab,
        allTabs: tabs,
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
        case "getInitialTabs":
            chrome.storage.local.get(
                ["initialTab", "allTabs"],
                ({ initialTab, allTabs }) => {
                    chrome.runtime.sendMessage({
                        msgType: "initialTabs",
                        data: {
                            initialTab,
                            allTabs,
                        },
                    });
                },
            );
            break;
        default:
            throw new Error(`Unknown message type ${msgType}`);
    }
});

async function getTabs(
    activeOnly: boolean = false,
): Promise<chrome.tabs.Tab[]> {
    // Get tabs before we open the scanner window
    let options = {};
    let resolve: (value: boolean) => void;
    let semaphore: Promise<boolean> = new Promise((res) => {
        resolve = res;
    });
    chrome.permissions.contains({ permissions: ["tabs"] }, (result) => {
        resolve(result);
    });

    const hasTabsPerms = await semaphore;

    if (activeOnly || !hasTabsPerms) {
        // Limit tab query to only active tab
        options = { active: true, currentWindow: true };
    }
    return await chrome.tabs.query(options);
}
