import React, { Component, Suspense } from "react";
import {
    Container,
    Center,
    TabPanels,
    Tabs,
    Tab,
    TabPanel,
    TabList,
    Spinner,
} from "@chakra-ui/react";
import { Translation } from "react-i18next";

const QRScan = React.lazy(() => import("../popup/QRScan"));

export default class App extends Component<{}, State> {
    constructor(props: {}) {
        super(props);

        this.state = { data: "", isReady: false };
    }

    componentDidMount() {}

    render() {
        return (
            <Container>
                <Suspense fallback={<Spinner />}>
                    <QRScan scanFramerate={20} />
                </Suspense>
            </Container>
        );
    }
}

interface State {
    data: string;
    isReady: boolean;
}
