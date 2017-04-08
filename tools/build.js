require('babel-register');

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const rimraf = require('rimraf');
const HtmlWebpackPlugin = require('html-webpack-plugin');

rimraf.sync(path.resolve(__dirname, '../public/js'));

const config = {
	entry: [
		'babel-polyfill',
		'./src/index.js',
	],
	output: {
		path: path.resolve(__dirname, '../public/js'),
		filename: 'main.[hash].js',
	},
	module: {
		loaders: [
			{
				test: /\.js$/,
				loaders: [
					'babel-loader',
				],
				exclude: /node_modules/,
			},
			{
				test: /\.json$/,
				loader: 'json-loader',
			},
			{
				test: /\.(png|jpg|jpeg|gif|svg|eot|ttf|woff|woff2)$/,
				loader: 'url-loader',
				query: {
					name: '[path][name].[ext]?[hash]',
					limit: 10000,
				},
				include: 'public'
			},
		],
	},
	bail: true,
	plugins: [
		new webpack.optimize.UglifyJsPlugin({
			sourceMap: false,
		}),
		new HtmlWebpackPlugin({
			template: './src/index.ejs',
			filename: '../index.html',
		}),
	],
};

webpack(config, (err, stats) => {
	if (err) {
		console.log(err.message);
	}
});