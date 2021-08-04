import React, { Component } from "react";
import {
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Box,
    Button,
} from "@chakra-ui/react";
import { withTranslation, WithTranslation } from "react-i18next";

class PermissionsAlert extends Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            status: "error",
        };
    }

    componentDidMount() {
        if (this.props.resolved) {
            this.setState({
                status: "success",
            });
        }
    }

    render() {
        return (
            <Alert
                status={this.state.status}
                variant="left-accent"
                position="fixed"
                bottom={0}
                left={0}
                right={0}
            >
                <AlertIcon />
                <Box flex={1}>
                    <AlertTitle>
                        {this.props.resolved
                            ? this.props.t("permissionsGrantedTitle")
                            : this.props.t("permissionsNeededTitle")}
                    </AlertTitle>
                    <AlertDescription display="block">
                        {this.props.resolved
                            ? this.props.t("permissionsGrantedDesc")
                            : this.props.t("permissionsNeededDesc")}
                    </AlertDescription>
                </Box>
                {!this.props.resolved ? (
                    <Button onClick={this.props.onGrantPermsClick}>
                        {this.props.t("permissionsNeededBtn")}
                    </Button>
                ) : undefined}
            </Alert>
        );
    }
}

export default withTranslation(["app"])(PermissionsAlert);

type IProps = WithTranslation & {
    onGrantPermsClick: (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => void;
    resolved: boolean;
};

interface IState {
    status: "error" | "info" | "warning" | "success" | undefined;
}
