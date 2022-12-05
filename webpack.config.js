const path = require('path');

module.exports = {
    //1
    entry: path.resolve(__dirname, 'src/index.jsx'),
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
                test: /\.css$/,
                use: ['style-loader', "css-loader"]
            },
        ]
    },
    resolve: {
        extensions: ['*', '.js', '.jsx', '.wasm'],
    },
    //2
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: path.resolve(__dirname, '/'),
        filename: 'bundle.js',
        webassemblyModuleFilename: "static/wasm/[hash].wasm",
        assetModuleFilename: "static/assets/[name].[contenthash][ext]",
    },
    //3
    devServer: {
        static: path.resolve(__dirname, 'dist'),
        allowedHosts: "all"
    }
};