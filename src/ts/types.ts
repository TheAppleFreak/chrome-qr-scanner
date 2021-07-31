export interface Message {
    msgType: string;
    data?: any;
}

export interface Settings {
    // TODO: Refine this
    [key: string]: any;

    // Permissions authorizations
    authorizedTabsScope?: boolean;

    // Popup settings
    closeOnBlur?: boolean;
}
