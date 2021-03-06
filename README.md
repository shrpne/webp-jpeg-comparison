## webp-jpeg-comparison

[🇷🇺 Читать на русском](https://github.com/shrpne/webp-jpeg-comparsion/blob/master/README.ru.md)

Here I try to find out if it is really worth to convert images to [webp](https://developers.google.com/speed/webp/) instead of serve them as minified jpeg.

To minify jpeg I use [mozjpeg](https://github.com/mozilla/mozjpeg) lossy compression first ~~and [jpegtran](https://github.com/imagemin/imagemin-jpegtran) lossless compression after. For 70% of images jpegtran do nothing, but for the rest it helps to save 10-40% more~~ Looks like mozjpeg works fine without jpegtran since 3.2 version.

It compares saved size and loss in quality by [SSIM](https://github.com/darosh/image-ssim-js)


### Usage

clone repo, then run:
```
npm i
npm start
```

You can put your own images into `./src`

I suggest you empirically find out `quality` settings for `imagemin-webp` and `imagemin-mozjpeg` which will return equal SSIM for compressed images. And then check what compression method will save more bytes.


### Results
![Logo](result.png)

For imageset from this repo quality settings to have equal SSIM will be: webp - 80, mozjpeg - 84. And webp will win with 28% more savings. 

For different imagesets which I have tested with imagemin settings which returns equal SSIM, webp always win with savings varying from 20% to 30%.


 
