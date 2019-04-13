"use strict";

const ssim = require('image-ssim');
const decode = require('./decode');

/**
 * @typedef {Object} AnalyzeData
 * @property {number} originalSize
 * @property {number} optimizedSize
 * @property {number} saved
 * @property {number} percent
 * @property {number} ssim
 */

/**
 * Compare two images
 * @param {Buffer} original
 * @param {Buffer} optimized
 * @return {Promise<AnalyzeData>}
 */
function analyze(original, optimized) {
    return Promise.all([decode(original), decode(optimized)])
        .then((images) => {
            let quality = ssim.compare(images[0], images[1]);
            let originalSize = original.length;
            let optimizedSize = optimized.length;
            let saved = originalSize - optimizedSize;
            let percent = originalSize > 0 ? (saved / originalSize) * 100 : 0;

            return {
                originalSize,
                optimizedSize,
                saved,
                percent,
                ssim: quality.ssim,
            }
        });
}

module.exports = analyze;
