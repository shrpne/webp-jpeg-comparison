"use strict";

const fileType = require('file-type');

/**
 *
 * @param input imageContent
 * @return {Promise}
 */
function decodeJpeg(input) {
    const jpegDecoder = require('jpeg-js');

    return new Promise((resolve) => {
        let rawImageData = jpegDecoder.decode(input, true);

        resolve({
            data: rawImageData.data,
            width: rawImageData.width,
            height: rawImageData.height,
            channels: 4,
        });
    });
}

/**
 *
 * @param input imageContent
 * @return {Promise}
 */
function decodeWebp(input) {
    const libwebp = require('./libwebp');
    let webpDecoder = new libwebp.WebPDecoder();
    let image = {width: {value: 0}, height: {value: 0}};

    return new Promise((resolve) => {
        let bitmap = webpDecoder.WebPDecodeRGBA(input, input.length, image.width, image.height);

        resolve({
            data: bitmap,
            width: image.width.value,
            height: image.height.value,
            channels: 4,
        });
    });
}

/**
 * Decode jpeg and webp content to bitmap
 * @param input imageContent
 * @return {Promise}
 */
function decode(input) {
    switch (fileType(input).ext) {
        case 'jpg':
            return decodeJpeg(input);
            break;
        case 'webp':
            return decodeWebp(input);
            break;
        default:
            throw new TypeError('image content should be encoded as jpg or webp');
    }
}


module.exports = decode;