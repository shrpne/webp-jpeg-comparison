"use strict";

/**
 * Based on https://github.com/imagemin/imagemin code
 */

const fs = require('fs');
const path = require('path');
const fileType = require('file-type');
const globby = require('globby');
const makeDir = require('make-dir');
const pify = require('pify');
const pPipe = require('p-pipe');
const replaceExt = require('replace-ext');
const prettyBytes = require('pretty-bytes');
const fsP = pify(fs);
const analyze = require('./analyze');



function handleFile(input, output, plugins) {
    return fsP.readFile(input).then(originalContent => {
        if (plugins && !Array.isArray(plugins)) {
            throw new TypeError('The plugins option should be an `Array`');
        }
        let pipe = plugins.length > 0 ? pPipe(plugins)(originalContent) : Promise.resolve(originalContent);

        return pipe
            .then(optimizedContent => {
                optimizedContent = optimizedContent.length < originalContent.length ? optimizedContent : originalContent;
                let dest = path.join(output, path.basename(input));
                dest = (fileType(optimizedContent) && fileType(optimizedContent).ext === 'webp') ? replaceExt(dest, '.webp') : dest;

                return analyze(originalContent, optimizedContent).then((analyzeData) => {
                    analyzeData.dest = dest;
                    let msg = path.basename(dest) + ' ' + (analyzeData.saved > 0 ? `saved ${prettyBytes(analyzeData.saved)} - ${analyzeData.percent.toFixed(1).replace(/\.0$/, '')}% - ${analyzeData.ssim.toFixed(3)}` : 'already optimized');
                    console.log(msg);

                    return makeDir(path.dirname(dest))
                        .then(() => fsP.writeFile(dest, optimizedContent))
                        .then(() => analyzeData);
                });
            })
            .catch(err => {
                err.message = `Error in file: ${input}\n\n${err.message}`;
                throw err;
            });
    });
}

function minify(input, output, plugins) {
    if (!Array.isArray(input)) {
        return Promise.reject(new TypeError(`Expected an \`Array\`, got \`${typeof input}\``));
    }

    return globby(input, {nodir: true}).then((paths) => {
        return Promise.all(paths.map((path) => {
            return handleFile(path, output, plugins);
        }));
    });
}

module.exports = minify;
