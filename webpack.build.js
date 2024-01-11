
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('css-minimizer-webpack-plugin');

const distDir = 'output';
const basePath = path.resolve(__dirname);
const fileList = glob.sync('themes/**/*.scss', {posix: true, dotRelative: true});
const nodeModules = `./node_modules/`;
const fontAwesomeCssBasePath = `${nodeModules}@fortawesome/fontawesome-free/css`;
const materialIconsFilePath = `${nodeModules}@material-icons/font/css`;
const sgIconsPath = "./sg-icons";

const processArgs = () => {
	const args = process.argv.slice(2);
	const output = {};
	let arrayKey = null;
	args.forEach((val) => {
		if (String(val).indexOf('--') === 0 || String(val).indexOf('-') === 0) {
			if (String(val).indexOf('--') === 0) {
				arrayKey = String(val).substring(2);
			} else {
				arrayKey = String(val).substring(1);
			}
		} else {
			if (arrayKey != null) {
				output[arrayKey] = val;
				arrayKey = null;
			}
		}
	});

	return output;
}

const inputArgs = processArgs();

const manifestSourceFilePath = "./app.manifest.json";
const themeList = {};
themeList.themeName = glob.sync(distDir + '/themes/*-theme.css');

const jsonData = JSON.stringify(themeList, null, 4);
fs.writeFileSync(manifestSourceFilePath, jsonData);

let fontAwesomeDestinationFilePath = "";
let materialIconsDestinationFilePath = "";
let sgIconsDestinationFilePath = "";

const outputPathVariable = 'output-path';

class Without {
	constructor(patterns) {
		this.patterns = patterns;
	}

	apply(compiler) {
		compiler.hooks.emit.tapAsync("MiniCssExtractPluginCleanup", (compilation, callback) => {
			Object.keys(compilation.assets)
				.filter(asset => {
					let match = false, i = this.patterns.length;
					while (i--) {
						if (this.patterns[i].test(asset)) {
							match = true;
						}
					}
					return match;
				}).forEach(asset => {
					delete compilation.assets[asset];
				});

			callback();
		});
	}
}

const createEntryList = function () {
	let filesObj = {};
	fileList.map((item) => {
		let itemArr = item.split("/");
		let fileName = itemArr[itemArr.length - 1].split('.')[0];
		let keyName = `${fileName}`;
		filesObj[keyName] = path.resolve(basePath, item);
	});
	return filesObj;
};

const entryList = createEntryList();
entryList['external'] = [
	path.resolve(basePath, `${fontAwesomeCssBasePath}/all.min.css`),
	path.resolve(basePath, `${materialIconsFilePath}/all.css`),
	path.resolve(basePath, `${sgIconsPath}/css/all.css`)
];

if (inputArgs[outputPathVariable] !== "") {
	destinationFilePath = inputArgs[outputPathVariable];
	fontAwesomeDestinationFilePath = inputArgs[outputPathVariable] + '/font-awesome/';
	materialIconsDestinationFilePath = inputArgs[outputPathVariable] + '/material-icons/';
	sgIconsDestinationFilePath = inputArgs[outputPathVariable];
} else {
	// Throw error
}

module.exports = {
	entry: entryList,
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
					'css-loader?url=false'
				]
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
	mode: (inputArgs["mode"] && inputArgs["mode"] !== "" && inputArgs["mode"] === "production") ? 'production' : 'development',
	performance: {
		maxEntrypointSize: 2048000000,
		maxAssetSize: 2048000000
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: "[name].css"
		}),
		new Without([/.js?$/]), // just give a list with regex patterns that should be excluded like /\.css\.js(\.map)?$
		new CopyPlugin({
			patterns: [
				{
					from: path.resolve(basePath, fontAwesomeCssBasePath + "/all.css"),
					to: path.resolve(fontAwesomeDestinationFilePath + "/css/all.css")
				},
				{
					from: path.resolve(basePath, materialIconsFilePath + "/all.css"),
					to: path.resolve(materialIconsDestinationFilePath + "/css/all.css")
				},
				{
					from: path.resolve(basePath, sgIconsPath + "/css/all.css"),
					to: path.resolve(sgIconsDestinationFilePath + "/sg-icons/css/all.css")
				},
				{
					from: path.resolve(basePath, sgIconsPath + "/svgs/icons/"),
					to: path.resolve(sgIconsDestinationFilePath + "/sg-icons/svgs/icons/")
				},
				{
					from: path.resolve(basePath, sgIconsPath + "/svgs/media-transports/"),
					to: path.resolve(sgIconsDestinationFilePath + "/sg-icons/svgs/media-transports/")
				}
			]
		})
	]
};