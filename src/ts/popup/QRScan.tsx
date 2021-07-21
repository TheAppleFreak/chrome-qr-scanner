import React, { Component } from "react";
import { Button, VStack, Input } from "@chakra-ui/react";
import { Translation } from "react-i18next";

import QRScanner from "qr-scanner";
// @ts-ignore
import QRScannerWorker from "qr-scanner/qr-scanner-worker.min.js";

export default class QRScan extends Component<Props, State> {
    private videoElement: React.RefObject<HTMLVideoElement>;

    private canvasElement: React.RefObject<HTMLCanvasElement>;
    private canvasCtx?: CanvasRenderingContext2D | null;

    private scanner?: Worker;
    private scanInterval?: NodeJS.Timer;

    constructor(props: Props) {
        super(props);

        this.videoElement = React.createRef();
        this.canvasElement = React.createRef();

        this.state = { scanResult: undefined };
    }

    async componentDidMount() {
        // @ts-ignore (typo in typings)
        this.scanner = (await QRScanner.createQrEngine(
            QRScannerWorker,
        )) as Worker;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: true,
            });
            this.videoElement.current!.srcObject = stream;
            this.videoElement.current!.onloadedmetadata = (e) =>
                this.videoElement.current!.play();

            this.canvasCtx = this.canvasElement.current!.getContext("2d");

            this.videoElement.current!.addEventListener("play", () => {
                this.canvasElement.current!.width =
                    this.videoElement.current!.videoWidth;
                this.canvasElement.current!.height =
                    this.videoElement.current!.videoHeight;

                // Since we can't run the QR detection using the regular QRScanner script, let's use a kinda hacky method to get around that
                this.scanInterval = setInterval(async () => {
                    this.canvasCtx!.drawImage(
                        this.videoElement.current!,
                        0,
                        0,
                        this.videoElement.current!.videoWidth,
                        this.videoElement.current!.videoHeight,
                    );

                    try {
                        const result = await QRScanner.scanImage(
                            this.canvasElement.current!,
                            undefined,
                            this.scanner,
                            this.canvasElement.current!,
                        );
                        if (this.state.scanResult !== result) {
                            this.setState({ scanResult: result });
                        }
                    } catch (e) {}
                }, 1000 / (this.props.scanFramerate || 5));
            });
        } catch (e) {
            console.error("Could not start video stream", e);
        }
    }

    componentWillUnmount() {
        clearInterval(this.scanInterval!);
    }

    render() {
        return (
            <VStack>
                <video ref={this.videoElement}></video>
                <canvas ref={this.canvasElement} style={{ display: "none" }} />
                <Input
                    placeholder="Scanning..."
                    readOnly={true}
                    value={this.state.scanResult}
                />
            </VStack>
        );
    }
}

interface Props {
    scanFramerate?: number;
}

interface State {
    scanResult?: string;
}
