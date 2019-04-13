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



/**
 * Takes input file path, minify it, write to output dir, and returns AnalyzeData
 * @param {string} input - file path
 * @param {string} output - dir path
 * @param {Array<Function>} plugins - list of imagemin plugins
 * @return {Promise<AnalyzeData>}
 */
function handleFile(input, output, plugins) {
    // saved data between fulfill
    let data = {};

    return fsP.readFile(input)
        // get file content
        .then((originalContent) => {
            if (plugins && !Array.isArray(plugins)) {
                throw new TypeError('The plugins option should be an `Array`');
            }
            // optimize content through list of plugins
            let pipe = plugins.length > 0 ? pPipe(...plugins)(originalContent) : Promise.resolve(originalContent);
            data.originalContent = originalContent;

            return pipe;
        })
        .then((optimizedContent) => {
            const originalContent = data.originalContent;
            // if optimized bigger than original => take original
            optimizedContent = optimizedContent.length < originalContent.length ? optimizedContent : originalContent;
            data.optimizedContent = optimizedContent;

            return analyze(originalContent, optimizedContent);
        })
        .then((analyzeData) => {
            const optimizedContent = data.optimizedContent;
            // destination of optimized file to write
            let dest = path.join(output, path.basename(input));
            dest = (fileType(optimizedContent) && fileType(optimizedContent).ext === 'webp') ? replaceExt(dest, '.webp') : dest;
            analyzeData.dest = dest;
            console.log(path.basename(dest) + ' ' + (analyzeData.saved > 0 ? `${prettyBytes(analyzeData.optimizedSize)}, saved ${analyzeData.percent.toFixed(1).replace(/\.0$/, '')}%, ssim ${analyzeData.ssim.toFixed(3)}` : 'already optimized'));

            return makeDir(path.dirname(dest))
                .then(() => fsP.writeFile(dest, optimizedContent))
                .then(() => analyzeData);
        })
        .catch((err) => {
            err.message = `Error in file: ${input}\n\n${err.message}`;
            throw err;
        });
}

/**
 * Takes globs, minify each image, and return array of AnalyzeData
 * @param {Array<string>} input - array of globs
 * @param {string} output - dir path
 * @param {Array<Function>} plugins - list of imagemin plugins
 * @return {Promise<Array<AnalyzeData>>}
 */
function minify(input, output, plugins) {
    if (!Array.isArray(input)) {
        return Promise.reject(new TypeError(`Expected an \`Array\`, got \`${typeof input}\``));
    }

    return globby(input, {onlyFiles: true})
        .then((paths) => {
            const promiseList = paths.map((path) => handleFile(path, output, plugins));
            return Promise.all(promiseList);
        });
}

module.exports = minify;
