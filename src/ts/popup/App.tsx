import React, { ChangeEventHandler, Component, Suspense } from "react";
import {
    Center,
    TabPanels,
    Tabs,
    Tab,
    TabPanel,
    TabList,
    Select,
    Spinner,
    VStack,
} from "@chakra-ui/react";
import { Translation } from "react-i18next";
import { Message } from "../types";

const QRGenerate = React.lazy(() => import("./QRGenerate"));
const QRScan = React.lazy(() => import("./QRScan"));

class App extends Component<{}, State> {
    private settings: any;

    private selElement: React.RefObject<HTMLSelectElement>;

    constructor(props: {}) {
        super(props);

        this.state = {
            current: undefined,
            tabs: {},
            isReady: false,
            generate: {
                data: "",
                key: 0,
            },
        };

        this.selElement = React.createRef();
    }

    componentDidMount() {
        // Set up message handlers, since this appears to be a big buggy in the constructor
        chrome.runtime.onMessage.addListener((msg) => this.onMessage(msg));

        // Add handler for program dismissal logic
        window.addEventListener("blur", () => this.onBlur());

        // Send request for settings
        // chrome.runtime.sendMessage({
        //     type: "reqSettings"
        // }, (settings) => {
        //     // Clean this up later
        //     this.settings = settings;
        // });

        // Send request for initial tabs
        chrome.runtime.sendMessage({ msgType: "getInitialTabs" });
    }

    onMessage({ msgType, data }: Message) {
        switch (msgType) {
            case "initialTabs": {
                let windows: {[key: string]: chrome.tabs.Tab[]} = {};
                data.initialTabs.map((tab: chrome.tabs.Tab) => {
                    if (!Object.keys(windows).includes(String(tab.windowId))) windows[String(tab.windowId)] = [];

                    windows[String(tab.windowId)].push(tab);
                });
                
                this.setState({
                    current: data.initialTab,
                    tabs: windows,
                    isReady: true,
                });
                break;
            }
            default:
                throw new Error(`Unknown message type ${msgType}`);
        }
    }

    async onBlur() {}

    selOnChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
        this.setState({
            generate: {
                data: (e.target! as HTMLSelectElement).value,
                key: e.timeStamp,
            },
        });
    };

    render() {
        return (
            <Tabs isLazy>
                <TabList>
                    <Tab>
                        <Translation>
                            {(t, { i18n }) => t("generateTab")}
                        </Translation>
                    </Tab>
                    <Tab>
                        <Translation>
                            {(t, { i18n }) => t("scanTab")}
                        </Translation>
                    </Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <VStack>
                            <Suspense fallback={<Spinner />}>
                                <QRGenerate
                                    data={this.state.generate.data}
                                    key={this.state.generate.key}
                                />
                            </Suspense>
                            <Select
                                ref={this.selElement}
                                onChange={this.selOnChange}
                            >
                                {this.state.isReady ? <option key={"current"} value={this.state.current!.url}>{this.state.current!.title}</option> : undefined }
                                {this.state.isReady
                                    ? Object.keys(this.state.tabs).map(
                                          (group, index) => {
                                              return (
                                                  <optgroup key={`win${index}`} label={`Window ${index + 1} (${this.state.tabs[group].length} tab${this.state.tabs[group].length !== 1 ? "s": ""})`}>
                                                      {this.state.tabs[
                                                          group
                                                      ].map((tab) => {
                                                          return (
                                                              <option
                                                                  key={tab.id}
                                                                  value={
                                                                      tab.url
                                                                  }
                                                              >
                                                                  {tab.title}
                                                              </option>
                                                          );
                                                      })}
                                                  </optgroup>
                                              );
                                          },
                                      )
                                    : undefined}
                                <option key="disabled" disabled>
                                    ──────────
                                </option>
                                <option key="manual" value="manual">
                                    Enter custom data
                                </option>
                            </Select>
                        </VStack>
                    </TabPanel>
                    <TabPanel>
                        <Suspense fallback={<Spinner />}>
                            <Center>
                                <QRScan />
                            </Center>
                        </Suspense>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        );
    }
}

export default App;

interface State {
    current?: chrome.tabs.Tab;
    tabs: { [key: string]: chrome.tabs.Tab[] };
    isReady: boolean;
    generate: {
        data: string;
        key: string | number;
    };
}
