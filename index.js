"use strict";
const fs = require('fs');
const prettyBytes = require('pretty-bytes');
const mozjpeg = require('imagemin-mozjpeg');
const jpegtran = require('imagemin-jpegtran');
const webp = require('imagemin-webp');
const minify = require('./lib/minify');

const paths = {
    src: './src',
    dest: './dest',
};

let minifyJpeg = minify([paths.src + '/*.jpg'], paths.dest, [
    mozjpeg({quality: 85}),
    jpegtran({progressive: true}),
]);

let minifyWebp = minify([paths.src + '/*.jpg'], paths.dest, [
    webp({quality: 80}),
]);




Promise.all([minifyJpeg, minifyWebp]).then((result) => {
    let stats = {
        jpeg: getTotalStats(result[0]),
        webp: getTotalStats(result[1]),
    };

    fs.writeFileSync(paths.dest + '/result.json', JSON.stringify({
        total: stats,
        images: {
            jpeg: result[0],
            webp: result[1],
        }
    }));

    console.log('total:');
    console.log(`jpeg saved ${prettyBytes(stats.jpeg.saved)} - ${stats.jpeg.avgPercent.toFixed(1).replace(/\.0$/, '')}% - ${stats.jpeg.avgSsim.toFixed(3)}`);
    console.log(`webp saved ${prettyBytes(stats.webp.saved)} - ${stats.webp.avgPercent.toFixed(1).replace(/\.0$/, '')}% - ${stats.webp.avgSsim.toFixed(3)}`);

    let bestSize = stats.jpeg.saved >= stats.webp.saved ? 'jpeg' : 'webp';
    let worstSize = stats.jpeg.saved < stats.webp.saved ? 'jpeg' : 'webp';
    let diffSize = stats[worstSize].optimizedSize - stats[bestSize].optimizedSize;
    let diffSizePercent = ((1 - stats[bestSize].optimizedSize / stats[worstSize].optimizedSize) * 100).toFixed(1).replace(/\.0$/, '');
    console.log('size result:');
    console.log(`${bestSize} is better: ${prettyBytes(diffSize)} - ${diffSizePercent}% will be saved if ${bestSize} used over ${worstSize}`);

    let bestQuality = stats.jpeg.avgSsim >= stats.webp.avgSsim ? 'jpeg' : 'webp';
    let worstQuality = stats.jpeg.avgSsim < stats.webp.avgSsim ? 'jpeg' : 'webp';
    let diffQuality = stats[bestQuality].avgSsim - stats[worstQuality].avgSsim;
    let diffQualityPercent = ((1 - stats[worstQuality].avgSsim / stats[bestQuality].avgSsim) * 100).toFixed(1).replace(/\.0$/, '');
    console.log('quality result:');
    console.log(`${bestQuality} is better: ${diffQuality} - ${diffQualityPercent}% more quality will have ${bestQuality} over ${worstQuality}`);
});

function getTotalStats(images) {
    if (!images || !images.length) {
        return;
    }

    let totalOriginal = 0;
    let totalOptimized = 0;
    let totalSaved = 0;
    let totalSsim = 0;
    images.forEach((item) => {
        totalOriginal += item.originalSize;
        totalOptimized += item.optimizedSize;
        totalSaved += item.saved;
        totalSsim += item.ssim;
    });
    let avgPercent = totalOriginal > 0 ? (totalSaved / totalOriginal) * 100 : 0;
    let avgSsim = totalSsim / images.length;

    return {
        originalSize: totalOriginal,
        optimizedSize: totalOptimized,
        saved: totalSaved,
        avgPercent,
        avgSsim,
    }
}