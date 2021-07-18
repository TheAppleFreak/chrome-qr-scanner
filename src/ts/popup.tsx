import React from "react";
import ReactDOM from "react-dom";

import CurrentUrl from "./CurrentTab";

class App extends React.Component {
    render () {
        return (
            <div>
                <CurrentUrl />
            </div>
        )
    }
}

ReactDOM.render(<App />, document.querySelector("#root"));