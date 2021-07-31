const { merge } = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");

const common = require("./webpack.common");

module.exports = merge(common, {
    mode: "production",
    devtool: false,
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
        splitChunks: {
            chunks(chunk){ return chunk.name !== "background" && chunk.name !== "options" },
            minSize: 0,
            maxInitialRequests: 20,
            maxAsyncRequests: 20,
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name(module, chunks, cacheGroupKey) {
                        const packageName = module.context.match(
                            /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                        )[1];
                        return `${cacheGroupKey}.${packageName.replace("@", "")}`;
                    }
                },
                common: {
                    minChunks: 2,
                    priority: -10
                }
            }
        }
    }
});