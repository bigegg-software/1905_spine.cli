'use strict';

const walk = require('walk');
const tar = require('tar');
const fetch = require('node-fetch');

async function downloadAndUnzipZygote(url, targetDir) {
    let res = await fetch(url);
    return new Promise((resolve, reject) => {
        let extractor = tar.x({
            strip: 1,
            cwd: targetDir
        });
        extractor.on('close', resolve);
        res.body.pipe(extractor);
    });
}

async function renderAllTemplates(ctx, targetDir) {
    targetDir = path.resolve(targetDir);
    let instructionLine = '';
    return new Promise((resolve, reject) => {
        let toRemove = []
        let walker = walk.walk(targetDir)
        walker.on("file", function (root, fileStats, next) {
            let basename = fileStats.name;
            let fn = path.join(root, basename);
            if (basename == '_INSTRUCTIONS') {
                instructionLine = fs.readFileSync(fn).toString();
                toRemove.push(fn);
                return next();
            }

            if (!basename.startsWith('_') || !basename.endsWith('.gen.js')) {
                return next();
            }

            let content = require(fn)(ctx);

            let stem = basename.substring(1);
            stem = stem.substring(0, stem.length - '.gen.js'.length);
            let outFile = path.join(root, stem);

            fs.writeFileSync(outFile, content);

            toRemove.push(fn);

            next();
        });

        walker.on("errors", function (root, nodeStatsArray, next) {
            reject(`traverse ${targetDir} failed`);
        });

        walker.on("end", function () {
            resolve(toRemove);
        });
    }).then(toRemove => {
        toRemove.forEach(f => {
            fs.unlinkSync(f);
        });
        return instructionLine;
    });
}




module.exports = {
    downloadAndUnzipZygote,
    renderAllTemplates
}
