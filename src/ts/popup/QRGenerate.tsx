import React, { Component } from "react";
import { Image, Spinner, useColorMode } from "@chakra-ui/react";
import QRCode from "qrcode";

// I think I have to do it this way because it might be annoying to get props on the main component otherwise
const ImageFilter = ({ data }: { data: string }) => {
    const { colorMode } = useColorMode();

    return (
        <Image
            src={data}
            filter={colorMode === "dark" ? "invert(1)" : undefined}
            objectFit="contain"
            height="100%"
            width="auto"
        />
    );
};

export default class QRGenerate extends Component<IProps, IState> {
    static defaultProps = {
        data: "",
    };

    constructor(props: IProps) {
        super(props);

        this.state = { data: props.data, rendered: undefined };
    }

    componentDidMount() {
        if (this.props.data !== "") {
            QRCode.toDataURL(this.state.data, {
                margin: 0,
                scale: 12,
                color: { dark: "#000000FF", light: "#FFFFFF00" },
            }).then((uri) => {
                this.setState({ rendered: uri });
            });
        }
    }

    render() {
        return this.state.rendered !== undefined ? (
            <ImageFilter data={this.state.rendered} />
        ) : (
            <Spinner />
        );
    }
}

type IProps = typeof QRGenerate.defaultProps & {
    data: string;
};

type IState = {
    data: string;
    rendered?: string;
};
