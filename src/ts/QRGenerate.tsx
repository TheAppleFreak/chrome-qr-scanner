import React, { Component } from "react";
import { Image } from "@chakra-ui/react";
import QRCode from "qrcode";

import { Translation } from "react-i18next";

export default class QRGenerate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = { data: props.data, rendered: undefined };
    }

    componentDidMount() {
        QRCode.toDataURL(this.state.data)
            .then(uri => {
                this.setState({ rendered: uri });
            });
    }

    render() {
        return (
            <figure>
                <Image src={ this.state.rendered } />
                <figcaption>{this.props.data}</figcaption>
            </figure>
        )
    }
}

interface Props {
    data: string;
}

interface State {
    data: string;
    rendered?: string;
}