const fs = require("fs");
const glob = require("glob");
const path = require("path");

var count = 700;

var walkSync = function(dir, filelist) {
  var fs = fs || require('fs'),
      files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      filelist = walkSync(dir + '/' + file, filelist);
    }
    else {
      
      if (path.extname(file.toLowerCase()) === ".ini"){
        filelist.push(dir + '/' + file);
        var oldName = dir + '/' + file;
        var newName = dir + '/CMU' + count + "EA.ini"; 
        fs.renameSync(oldName, newName);
        count++;
      }
      
    }
  });
  return filelist;
};

console.log(walkSync("./Missions"));