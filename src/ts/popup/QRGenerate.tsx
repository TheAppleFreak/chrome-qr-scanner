import React, { Component } from "react";
import { Image, Spinner } from "@chakra-ui/react";
import QRCode from "qrcode";

export default class QRGenerate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = { data: props.data, rendered: undefined };
    }

    componentDidMount() {
        QRCode.toDataURL(this.state.data).then((uri) => {
            this.setState({ rendered: uri });
        });
    }

    render() {
        return this.state.rendered !== undefined ? (
            <Image src={this.state.rendered} />
        ) : (
            <Spinner />
        );
    }
}

interface Props {
    data: string;
}

interface State {
    data: string;
    rendered?: string;
}
