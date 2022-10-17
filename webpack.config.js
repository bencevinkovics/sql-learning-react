const path = require('path');

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
                    filename: 'dist/wasm/[name].[contenthash][ext]',
                }
            },
            {
                test: /\.(json)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'static/json/[name].[contenthash][ext]',
                },
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
        publicPath: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        webassemblyModuleFilename: "dist/wasm/[hash].wasm",
        assetModuleFilename: "dist/assets/[name].[contenthash][ext]",
    },
    //3
    devServer: {
        static: path.resolve(__dirname, './dist'),
    }
};