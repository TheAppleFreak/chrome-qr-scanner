import React, { Component, Suspense } from "react";
import QRCode from "qrcode";
import Holder from "holderjs";

export default class QRDisplay extends Component<QRDisplayProps, QRDisplayState> {
    private imgRef: React.RefObject<HTMLImageElement>;

    constructor(props: QRDisplayProps) {
        super(props);

        console.log(props);

        this.state = {
            data: props.srcData,
            imageUri: undefined
        };

        console.log(this.state);

        this.imgRef = React.createRef();
    }

    private async renderQRCode(data: string): Promise<void> {
        await new Promise((res, rej) => setTimeout(() => res(null), 2000));

        const imageUri = await QRCode.toDataURL(data);

        this.setState({ imageUri });
    }

    componentDidMount() {
        // Holder.run({
        //     images: this.imgRef.current
        // });

        this.renderQRCode(this.state.data);
    }

    render() {
        return (
            <Suspense fallback={<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWBAMAAADOL2zRAAAAG1BMVEXMzMyWlpaqqqq3t7fFxcW+vr6xsbGjo6OcnJyLKnDGAAAACXBIWXMAAA7EAAAOxAGVKw4bAAABAElEQVRoge3SMW+DMBiE4YsxJqMJtHOTITPeOsLQnaodGImEUMZEkZhRUqn92f0MaTubtfeMh/QGHANEREREREREREREtIJJ0xbH299kp8l8FaGtLdTQ19HjofxZlJ0m1+eBKZcikd9PWtXC5DoDotRO04B9YOvFIXmXLy2jEbiqE6Df7DTleA5socLqvEFVxtJyrpZFWz/pHM2CVte0lS8g2eDe6prOyqPglhzROL+Xye4tmT4WvRcQ2/m81p+/rdguOi8Hc5L/8Qk4vhZzy08DduGt9eVQyP2qoTM1zi0/uf4hvBWf5c77e69Gf798y08L7j0RERERERERERH9P99ZpSVRivB/rgAAAABJRU5ErkJggg==" />}>
                <figure>
                    <img ref={this.imgRef} src={this.state.imageUri} style={{
                        width: "150px",
                        height: "150px"
                    }}/>
                    <figcaption>{this.state.data}</figcaption>
                </figure>
            </Suspense>
        )
    }
}

type QRDisplayProps = {
    srcData: string;
};

type QRDisplayState = {
    data: string;
    imageUri?: string;
};