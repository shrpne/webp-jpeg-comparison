"use strict";

const ssim = require('image-ssim');
const decode = require('./decode');

/**
 * Compare two images
 * @param original
 * @param optimized
 * @return Promise
 */
function analyze(original, optimized) {
    return new Promise((resolve) => {
        Promise.all([decode(original), decode(optimized)]).then((images) => {
            let quality = ssim.compare(images[0], images[1]);
            let originalSize = original.length;
            let optimizedSize = optimized.length;
            let saved = originalSize - optimizedSize;
            let percent = originalSize > 0 ? (saved / originalSize) * 100 : 0;

            resolve({
                originalSize,
                optimizedSize,
                saved,
                percent,
                ssim: quality.ssim,
            });
        });
    });

}

module.exports = analyze;