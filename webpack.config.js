const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const Dotenv = require('dotenv-webpack')

module.exports = (env = {}) => {
  const isProd = env.production || process.env.NODE_ENV === 'production'

  const plugins = [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'index.html'),
    }),
    new Dotenv({ systemvars: true }),
  ]

  if (isProd) {
    plugins.push(
      new MiniCssExtractPlugin({
        filename: 'assets/[name].[contenthash].css',
      }),
    )
  }

  return {
    target: ['web', 'es2020'],
    entry: path.resolve(__dirname, 'src', 'main.tsx'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? 'assets/[name].[contenthash].js' : 'assets/[name].js',
      clean: true,
      publicPath: '/',
    },
    devtool: isProd ? 'source-map' : 'eval-source-map',
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [isProd ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader', 'postcss-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[hash][ext][query]',
          },
        },
      ],
    },
    plugins,
    devServer: {
      port: 5173,
      historyApiFallback: true,
      hot: true,
      open: false,
      static: {
        directory: path.resolve(__dirname, 'public'),
      },
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
      runtimeChunk: 'single',
    },
  }
}
