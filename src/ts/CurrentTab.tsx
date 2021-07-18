import React, { Component, Suspense } from "react";

import QRDisplay from "./QRDisplay";

export default class CurrentUrl extends Component<{}, CurrentUrlState> {
    constructor(props: {}) {
        super(props);

        this.state = [];
    }

    componentDidMount() {
        chrome.tabs.query({active: true, currentWindow: true})
            .then(([tab]) => {
                this.setState(this.state.concat(tab.url!));
            })
    }

    render() {
        if (this.state.length > 0) {
            return <QRDisplay srcData={this.state[0]} />
        }

        return <h1>Loading</h1>
    }
}

type CurrentUrlState = string[];