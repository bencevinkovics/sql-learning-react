const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    //1
    entry: path.resolve(__dirname, './src/index.jsx'),
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /.*\.wasm$/,
                type: 'asset/resource',
                generator: {
                    filename: 'static/wasm/[name].[contenthash][ext]',
                }
            },
            {
                test: /\.(csv|tbl)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'static/csv/[name].[contenthash][ext]',
                },
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: "css-loader",
                        options: {
                            modules: {
                                mode: "local",
                                auto: true,
                                exportGlobals: true,
                                localIdentContext: path.resolve(__dirname, "src"),
                            },
                        },
                    },
                ]
            },
        ]
    },
    experiments: {
        asyncWebAssembly: true,
    },
    resolve: {
        extensions: ['*', '.js', '.jsx', '.wasm'],
    },
    //2
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        filename: 'bundle.js',
        webassemblyModuleFilename: "static/wasm/[hash].wasm",
        assetModuleFilename: "static/assets/[name].[contenthash][ext]",
    },
    //3
    devServer: {
        static: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "./src/json", to: "static/json" },
            ],
        }),
    ],
};