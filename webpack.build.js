
const glob = require('glob');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('css-minimizer-webpack-plugin');
const distDir = 'output';
const basePath = path.resolve(__dirname);
const fileList = glob.sync('themes/**/*.scss');
// const sgThemes = glob.sync('sg-icons/scss/*.scss');
const nodeModules = `./node_modules/`;
const fontAwesomeCssBasePath = `${nodeModules}@fortawesome/fontawesome-free/css`;
const materialIconsFilePath = `${nodeModules}@material-icons/font/css`;
const sgIconsPath = "./sg-icons/css";

let createEntryList = function () {
	let filesObj = {};
	fileList.map((item) => {
		let itemArr = item.split("/");
		let fileName = itemArr[itemArr.length - 1].split('.')[0];
		let keyName = `${fileName}`;
		filesObj[keyName] = path.resolve(basePath, item);
	});
	return filesObj;
};

let entryList = createEntryList();
entryList['external'] = [
	path.resolve(basePath, `${fontAwesomeCssBasePath}/all.css`),
	path.resolve(basePath, `${materialIconsFilePath}/all.css`),
	path.resolve(basePath, `${sgIconsPath}/all.css`)
];

module.exports = {
	entry: entryList,
	output: {
		filename: "[name].js",
		path: path.resolve(basePath, distDir)
	},
	resolve: {
		extensions: ['.scss', '.css']
	},
	optimization: {
		// css minify only production mode
		minimizer: [new OptimizeCSSAssetsPlugin()]
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
					},
					'css-loader?url=false']
			},
			{
				test: /\.(png|jpg|svg|woff|woff2|eot|ttf)$/,
				loader: 'url-loader',
				options: {
					limit: 3000000,
					name: 'images/[name].[ext]'
				}
			},
			{
				test: /\.scss$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
					},
					'css-loader',
					'sass-loader',
				]
			}
		],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: "[name].css"
		})
	]
};
