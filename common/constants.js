var currentDir = __dirname;
var path = require('path');

var dirOfProject = '';
if (currentDir.indexOf("\\common") > 0) {
    dirOfProject = currentDir.replace('\\common', '');
} else {
    dirOfProject = currentDir.replace('/common', '');
}
var currentDirNormalized = path.join(dirOfProject, '\data');


var config = {
    development: {
        connectionString: 'mongodb://localhost:8086/spaStore',
        secret: 'ilovescotchyscotch',
        mongoDbCommand: "mongod --dbpath " + currentDirNormalized + " --port 8086 --smallfiles"
    },
    production: {
        connectionString: 'mongodb://localhost:8086/spaStore',
        secret: 'ilovescotchyscotch',
        mongoDbCommand: "mongod --dbpath " + currentDirNormalized + " --port 8086 --smallfiles"
    },
    common: {
        host: 'localhost',
        port: 8080,
        baseDir: dirOfProject
    }
};

module.exports = config;
