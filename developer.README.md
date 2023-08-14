<p align="center">
  <img src="https://kenticoprod.azureedge.net/kenticoblob/crestron/media/crestron/generalsiteimages/crestron-logo.png">
</p>
 
# CH5 Theme Editor - Getting Started

## Themes directory
 - Themes are located in **./themes** directory
 - Color variables are defined in **./ch5-core/themes/**

Crestron provides three standard themes for CH5 components. 
* light theme - dark text on light backgrounds
* dark theme - light text on dark backgrounds
* high-contrast theme - to aid visually impaired, easily discernable colors with larger fonts

This project provides the source code to reproduce the Crestron provided themes and scripts to extend those themes as 'custom' themes for your projects. 

## Workstation setup 

### Node

install Node from https://nodejs.org

### Code Editor

Many choices of available to edit the SASS source code used to create themes. 

A fine choice is Visual Studio Code is https://code.visualstudio.com/ with built in support for .css and .scss file editing


## Theme building project install

### Create directory and expand project archive 

Use an unzipping tool to expand the content of the theme building project onto a directory on your workstation

### Load necessary libraries

using shell command 
```sh
npm install 
```


## Building all the themes 

using shell command
## Linking betweens themes
There are two types of theme linking:
- soft linking DEFAULT(an import statement is being to be added in the generated file i.e. ch5-core/themes/<new-theme>.scss)
- hard linking (the content of base theme will be copied in the new generated file i.e. ch5-core/themes/<new-theme>.scss)

**soft link between default theme and the new theme:**
```sh
npm run create-theme THEME_NAME --soft-link
```
or
```sh
npm run create-theme THEME_NAME
```
**hard link between default theme and the new theme:**
```sh
npm run create-theme THEME_NAME --hard-link 
```
**In order to change the default theme just add the default theme name before --soft-link or --hard-link:**
```sh
npm run create-theme THEME_NAME light --soft-link
```
## Bundling the themes
**bundling default theme**
```sh
npm run bundle-theme-all
```
**bundling default theme and watch**
```sh
npm run bundle-and-watch
```
**run scss app in order to view themes changes**
```sh
npm run start
```
**bundle and copy themes to another directory with webpack shell command**  
Note:-Install webpack globally before running webpack shell command.  
In order to  install webpack globally use command
```sh
npm install webpack -g
```
Then run below command   
```sh
webpack --config webpack.run.js --outputpath=RELATIVE_PATH_FOR_DESTINATION_DIRECTORY
ex:-
webpack --config webpack.run.js --outputpath='../showcase-app/dist/crestron-components-assets' && npm run cleanjs
```
**bundle and copy themes to another directory via env config**  
Create '.env' file under 'BlackbirdComponentLibrary/library/crestron-components-sass/' directory  
Add given below property and value to env file:-
```sh
DESTINATION_THEMES_FILE_PATH = RELATIVE_PATH_FOR_DESTINATION_DIRECTORY
ex:-
DESTINATION_THEMES_FILE_PATH = '../showcase-app/dist/crestron-components-assets'
and also update the --outputpath of "webpack shell command" in package.json.
copy fonts and webfonts:-
fonts, web fonts and theme directories should be at the same level.
DESTINATION_WEBFONTS_FILE_PATH = RELATIVE_PATH_FOR_WEBFONTS
EX:-
DESTINATION_WEBFONTS_FILE_PATH = '../showcase-app/dist/webfonts'
DESTINATION_FONTS_FILE_PATH = '../showcase-app/dist/fonts'
```
Then run shell command
```sh
npm run bundle-theme-all
```
## Creating custom themes

Custom themes can be thought of as overwrite of certain portions of an established theme.  The most prevalent use case will be a Crestron standard theme to be the established theme, but you can also create a new custom theme from a prior established theme. 

A script to create a custom theme is provided.  The general syntax is below

```sh
npm run create-theme NewCustomThemeName ExistingThemeName 
```
where NewCustomThemeName is the name of your custom theme
and ExistingThemeName is the name of the theme to be extended

example would be 
```sh
v run create-theme big-bucks-customer light 
```
will create the sources that when compiled will create a big-bucks-customer-theme.css file

A future change to the existing theme will be incorporated into the custom theme with a recompilation of the custom theme. 

## Structure of the project

### Theme specific directives and files 

The difference between the themes are introduced in directories and files of the 'themes' directory.  As example, changes to themes/big-bucks-customer/big-bucks-customer-theme.scss will only change the big-bucks-customer theme output. 

### Theme independent directives and files

The theme definition that is common across all themes, both Crestron standard themes and Custom themes are in directories and files with names of the CH5 components.  For instance the ch5-button (previously it was ch5-button) directory contains directives for ch5-buttons in all themes.

### Promoting theme independent directives to a Custom Theme. 

Should there be a directive that is currently common across themes that you wish to 'promote' to be changed specifically in your custom theme, to insure your custom theme can properly be upgraded with changes to the Crestron standard and common across other theme attributes, copy and paste the directive from the common location to the custom theme location and make the change in the custom theme location.   The compilation process will respect the specific theme directives and override the theme independent directives. 

### Documentation

Please note that /// (three slashes) are required to add documentation to each of the SASS attributes. This is a Crestron specific comment to 
ensure that the sass-schema.json file is created correctly.

Also, please ensure to add a comment with three slashes in each file. If not, the generate sass wil fail with error.

## How to create component level scss

1. Use variables when the expectation is that CCIDE should have the opportunity to override it. This will be reflected in sass based json files.
