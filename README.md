# National Green Tribunal Scraper
A simple CasperJS web scraper that dumps JSON into a text file

### Getting Started
To get started clone this project
```git clone https://github.com/drakaris/signzy
```
#### Installing Dependencies
This scraper requires a few external utilities to function.
CasperJS can be installed using [this guide](http://docs.casperjs.org/en/latest/installation.html). If you're a Mac user I strongly suggest installing via [Homebrew](http://brew.sh).
All other dependencies may be installed by running
```npm install
```
from within the project folder.

##### **Note:**
CasperJS needs to be installed as a global utility for ease of use.

#### Usage
The entire **National Green Tribunal** website can be scraped by running
```casperjs server.js
```
### How it works
[CasperJS](http://casperjs.org) is built on [PhantomJS](http://phantomjs.org), which is a headless WebKit with a JavaScript API.
CasperJS visits the National Green Tribunal website's search page and iterates through all available records amongst each year that is searchable. Every record with all available information pertaining to it, is written into a file, **dump.txt**, for further processing.
