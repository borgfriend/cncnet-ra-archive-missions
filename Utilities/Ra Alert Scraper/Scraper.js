var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var urlPkg = require("url");
var path = require("path");
var app = express();
var http = require('http');

const next = [

    {
        name: 'Map Packs',
        link: 'http://ra.afraid.org/html/downloads/mappacks.html'
    },
    {
        name: 'Documentation',
        link: 'http://ra.afraid.org/html/downloads/docs.html'
    },
    {
        name: 'New Units',
        link: 'http://ra.afraid.org/html/downloads/units.html'
    },
    {
        name: 'New Structures',
        link: 'http://ra.afraid.org/html/downloads/structures.html'
    },

    {
        name: 'Saved Games',
        link: 'http://ra.afraid.org/html/downloads/savedgames.html'
    },
    {
        name: 'Utilities',
        link: 'http://ra.afraid.org/html/downloads/utilities.html'
    },
    {
        name: 'INI Files',
        link: 'http://ra.afraid.org/html/downloads/ini.html'
    },
    {
        name: 'Desktop Themes',
        link: 'http://ra.afraid.org/html/downloads/dthemes.html'
    },
    {
        name: 'Patches',
        link: 'http://ra.afraid.org/html/downloads/patches.html'
    },
    {
        name: 'Fixes',
        link: 'http://ra.afraid.org/html/downloads/fixes.html'
    },
    {
        name: 'Trainers',
        link: 'http://ra.afraid.org/html/downloads/trainers.html'
    },
    {
        name: 'Music Tracks',
        link: 'http://ra.afraid.org/html/downloads/music.html'
    },
    {
        name: 'Video Files',
        link: 'http://ra.afraid.org/html/downloads/videofiles.html'
    },
    {
        name: 'Misc. Files',
        link: 'http://ra.afraid.org/html/downloads/misc.html'
    },

]

const completed = [

    {
            name: 'Mods',
            link: 'http://ra.afraid.org/html/downloads/mods.html'
        }, {
            name: 'Campaigns',
            link: 'http://ra.afraid.org/html/downloads/campaigns.html'
        },

]

const sources =
    [
        
        {
            name: 'Missions',
            link: 'http://ra.afraid.org/html/downloads/missions.html'
        }

    ];



const root = "http://ra.afraid.org";

var downloadLinks = [];

function parseSidebar(url) {
    return new Promise((fulfill, reject) => {
        request(url, (error, resp, html) => {
            if (error) {
                reject(error);
            } else {
                let $ = cheerio.load(html);
                let data = [];
                $('#sidebar ul:nth-child(5)').children("li").not(".head").each((i, elem) => {
                    data.push({
                        name: $(elem).children("a").text(),
                        link: root + $(elem).children("a").attr("href")
                    });
                });
                fulfill(data);
            }
        });
    });
}


function parsePages(url) {
    return new Promise((fulfill, reject) => {
        request(url, (error, resp, html) => {
            if (error) {
                reject(error);
            } else {
                let $ = cheerio.load(html);
                let data = [];
                $('#page_navigation a').each((i, elem) => {
                    data.push(root + $(elem).attr("href"));
                });
                fulfill(data);
            }
        });
    });
}

function parseInfo(url) {
    return new Promise((fulfill, reject) => {
        request(url, (error, resp, html) => {
            if (error) {
                reject(error);
            }
            else {
                let $ = cheerio.load(html);
                let data = [];
                $('.ItemBlock').each((i, elem) => {
                    let name, info, description, downloadLink;

                    name = $(elem).children('.header').children('.name').text();
                    info = $(elem).children('.info').html();
                    downloadLink = root + $(elem).children('.download_link').children("a").attr("href");
                    description = $(elem).children('.description').html();

                    let json = {
                        name: name,
                        info: info,
                        description: description,
                        downloadLink: downloadLink
                    };
                    data.push(json);
                });
                fulfill(data);
            }
        });
    });
}

function runAll(list) {
    var promise = new Promise((fullfill, reject)=>{
            while(list.length > 0){
                let cat = list.pop();

                let dir = "download/" + cat.name;
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
                let urls = [cat.link]
                parsePages(cat.link).then((pages) => {
                    let links = urls.concat(pages);
                    var x = 0;

                    function go() {
                        let link = links[x];
                        console.log("Current Page: " + link);
                        processInfo(link, cat.name);
                        if (x++ < links.length - 1) {
                            setTimeout(go, 5000);
                        } 
                    }
                    go();
                }, (reason) => {
                    console.log("Pagination Error");
                });
            }
            if (list.length === 0){
                fullfill()
            }
    });

    promise.then(()=>{
        processDownloads();
    })
    



}

if (!fs.existsSync("download")) {
    fs.mkdirSync("download");
}

function processInfo(url, category) {
    parseInfo(url).then((json) => {

        for (let info of json) {
            let downloadDir = path.join("download", category, info.name.replace(":", "_"));
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir);
            }

            let out = "#" + info.name + "\n"
            out += info.info.replace(/<b>/g, "**").replace(/<\/b>/g, "**").replace(/<br>/g, "\n") + "\n" + "\n"
            out += info.description.replace(/<b>/g, "**").replace(/<\/b>/g, "**").replace(/<br>/g, "\n") + "\n" + "\n"
            out += "Original Link:" + info.downloadLink + "\n"
            fs.writeFile(downloadDir + "/README.md", out, (err) => {
                //console.log(err);
            });

            
            var parsed = urlPkg.parse(info.downloadLink);
            let filename = downloadDir + "/" + path.basename(parsed.pathname);

            fs.appendFile("links", JSON.stringify({
                link: info.downloadLink,
                filename: filename
            }) + "," );
//            downloadLinks.push()
        }

    }, (error) => {
        console.log("Info parsing failed" + error);
    })
}

//var download = require('download-file');

var download = function (url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var request = http.get(url, function (response) {
        response.pipe(file);
        file.on('finish', function () {
            file.close(cb);  // close() is async, call cb after close completes. 
            setTimeout(processDownloads, 5000);
        });
    }).on('error', function (err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        if (cb) cb(err.message);
    });
};

function processDownloads() {
    console.log("Remaining:" + downloadLinks.length)
    if (downloadLinks.length !== 0) {
        let current = downloadLinks.pop();
        console.log(current);
        download(current.link, current.filename, (err) => {
            console.log("err");
        });
    }

}

    runAll(sources);