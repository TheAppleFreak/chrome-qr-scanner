import React, { Component } from "react";
import { Button, Center, Input } from "@chakra-ui/react";
import QRScanner from "qr-scanner";
import { Translation } from "react-i18next";

export default class QRScan extends Component<Props, State> {
    private scanner?: QRScanner;
    private videoElement: React.RefObject<HTMLVideoElement>;

    constructor(props: Props) {
        super(props);

        this.videoElement = React.createRef();

        this.state = {scanResult: undefined};
    }

    componentDidMount() {
        this.scanner = new QRScanner(this.videoElement.current!, res => {
            this.setState({scanResult: res.toString()});
        });

        this.scanner.start();
    }

    render() {
        return (
            <Center>
                <video ref={this.videoElement}></video>
                <Input placeholder="Scanning..." value={this.state.scanResult}></Input>
            </Center>
        )
    }
}

interface Props {

}

interface State {
    scanResult?: string;
}