const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WebpackExtensionManifestPlugin = require("webpack-extension-manifest-plugin");

// const baseManifest = require("./src/manifest.json");

module.exports = {
    entry: {
        popup: path.join(__dirname, "src", "ts", "popup.tsx"),
        // worker: path.join(__dirname, "src", "ts", "worker", "worker.ts")
    },
    output: {
        path: path.join(__dirname, "build"),
        filename: "[name].js",
        assetModuleFilename: "[name][ext]"
    },
    module: {
        rules: [
            // Source code
            {
                test: /\.[jt]sx?$/i,
                include: path.resolve(__dirname, "src/ts"),
                exclude: /node_modules/i,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            cacheDirectory: true,
                            cacheCompression: false
                        }
                    }, 
                    "ts-loader"
                ]
            },
            // Images
            {
                test: /\.(?:ico|gif|png|jpe?g|svg)$/i,
                include: path.resolve(__dirname, "src/images"),
                exclude: /node_modules/i,
                type: "asset/resource"
            },
            // Styles
            // {
            //     test: /\.(sa|sc|c)ss$/i,
            //     use: ["style-loader", {loader: MiniCssExtractPlugin.loader, options: {esModule: false}}, "css-loader", "sass-loader"]
            // }
        ]
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    plugins: [
        new NodePolyfillPlugin({
            excludeAliases: ["console"]
        }),
        // new MiniCssExtractPlugin(),
        // new CopyWebpackPlugin({
        //     patterns: [
        //         { from: path.join(__dirname, "src", "static"), to: "." }
        //     ]
        // }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "./src/html/popup.html"),
            filename: "popup.html",
            inject: "body",
            chunks: ["popup"],

            title: "QR Scanner",
            meta: {
                charset: "utf-8",
                viewport: "width=device-width, initial-scale=1, shrink-to-fit=no",
                "theme-color": "#000000"
            },
            manifest: "manifest.json"
        }),
        // new WebpackExtensionManifestPlugin({
        //     config: {
        //         base: baseManifest
        //     }
        // })
    ]
}