import type { ISettings } from "@common/interfaces";

const defaultState: ISettings = {
    permissions: {
        authorizedTabsScopes: false,
    },
    popup: {
        closeOnBlur: true,
        defaultTab: "generate",
        theme: "system",
    },
    generate: {
        engine: "awesome-qr",
    },
    scan: {
        startWebcamImmediately: true,
        maxDetectionFrequency: 5,
    },
};

export default defaultState;
