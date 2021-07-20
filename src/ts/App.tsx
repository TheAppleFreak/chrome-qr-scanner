import React, { Component, Suspense } from "react";
import { Container, Center, TabPanels, Tabs, Tab, TabPanel, TabList, Spinner } from "@chakra-ui/react";
import { Translation } from "react-i18next";

const QRGenerate = React.lazy(() => import("./QRGenerate"));
const QRScan = React.lazy(() => import("./QRScan"));

class App extends Component<{}, State> {
    constructor(props: {}) {
        super(props);

        this.state = {data: "", isReady: false};
    }

    componentDidMount() {
        chrome.tabs.query({currentWindow: true, active: true}).then(([tab]) => {
            this.setState({
                data: tab.url!,
                isReady: true
            });
        });
    }

    render() {
        return (
            <Container>
                <Tabs>
                    <TabList>
                        <Tab>
                            <Translation>
                                { (t, { i18n }) => t("generateTab") }
                            </Translation>
                        </Tab>
                        <Tab>
                            {/* <Translation>
                                { (t, { i18n }) => t("scanTab") }
                            </Translation> */}
                            Scan
                        </Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <Center w="300px">
                                <Suspense fallback={<Spinner />}>
                                    <QRGenerate data={this.state.data} />
                                </Suspense>
                            </Center>
                        </TabPanel>
                        <TabPanel>
                            <Center w="300px">
                                <Suspense fallback={<Spinner />}>
                                    <QRScan />
                                </Suspense>
                            </Center>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Container>
        )
    }
}

export default App;

interface State {
    data: string;
    isReady: boolean;
}