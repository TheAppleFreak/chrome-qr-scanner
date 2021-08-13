import React, { useImperativeHandle } from "react";

const QRGenerate = React.forwardRef<any>((props, ref) => {
    useImperativeHandle(ref, () => ({
        test: () => {
            
        }
    }));

    return (
        <div ref={ref}></div>
    )
})