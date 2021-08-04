const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WebpackExtensionManifestPlugin = require("webpack-extension-manifest-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const baseManifest = require("./src/manifest.json");
const package_ = require("./package.json");

module.exports = {
    entry: {
        background: path.join(__dirname, "src", "ts", "background", "index.ts"),
        options: path.join(__dirname, "src", "ts", "options", "index.tsx"),
        popup: path.join(__dirname, "src", "ts", "popup", "index.tsx")
    },
    output: {
        // Since compilation is many times faster on a Linux FS than on Windows, 
        // we build in a container then spit out to this directory, which is a FS
        // mount to Windows.
        path: "/qr-display-build",
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
            {
                test: /\.(sa|sc|c)ss$/i,
                include: path.resolve(__dirname, "src/styles"),
                exclude: /node_modules/i,
                use: ["style-loader", {loader: MiniCssExtractPlugin.loader, options: {esModule: false}}, "css-loader", "sass-loader"]
            },
            // QR Scanner Worker
            {
                test: require.resolve("qr-scanner/qr-scanner-worker.min.js"),
                type: "asset/resource"
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx", ".css", ".scss"],
        plugins: [
            new TsconfigPathsPlugin()
        ]
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new CleanWebpackPlugin({
            protectWebpackAssets: false
        }),
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "./src/html/popup.html"),
            filename: "popup.html",
            inject: "body",
            chunks: ["popup"],

            title: baseManifest.name,
            meta: {
                charset: "utf-8",
                viewport: "width=device-width, initial-scale=1, shrink-to-fit=no",
                "theme-color": "#000000"
            },
            manifest: "manifest.json"
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "./src/html/options.html"),
            filename: "options.html",
            inject: "body",
            chunks: ["options"],

            title: `${baseManifest.name} - Options`,
            meta: {
                charset: "utf-8",
                viewport: "width=device-width, initial-scale=1, shrink-to-fit=no",
                "theme-color": "#000000"
            },
            manifest: "manifest.json"
        }),
        new WebpackExtensionManifestPlugin({
            config: {
                base: baseManifest,
                extend: {
                    description: package_.description,
                    version: package_.version
                }
            }
        }),
        // new CopyWebpackPlugin({
        //     patterns: [
        //         { from: path.join(__dirname, "src", "static"), to: "." }
        //     ]
        // }),
    ]
}