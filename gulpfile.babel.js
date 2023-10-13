"use strict";

// Плагины
import gulp from "gulp";
import sourceMaps from "gulp-sourcemaps";
import uglify from "gulp-uglify";
import terser from "gulp-terser";
import babel from "gulp-babel";
import plumber from "gulp-plumber";
import pug from "gulp-pug";

import *as dartSass from "sass";
import gulpSass from "gulp-sass";
import autoPrefixer from "gulp-autoprefixer";
import cssNano from "gulp-csso";
import cssComb from "gulp-csscomb";
import concat from "gulp-concat";

import imgMin from "gulp-imagemin";

import size from "gulp-size";
import rename from "gulp-rename";
import zip from "gulp-zip";
import {deleteAsync}  from "del";

import browserSyncs from "browser-sync";

const sass = gulpSass(dartSass);

const path = {
    root: "./",
    maninDest: "./build",
    app: {
        html: "./src/pug/pages/*.pug",
        css: "./src/sass/**/main.scss",
        js: "./src/js/common.js",
        img: "./src/img/*.+(jpg|jpeg|png|gif|ico|svg)",
        svg: "./src/img/svg/*.svg",
        fonts: "./src/fonts/**/*.+(ttf|eot|woff|svg)"
    },
    libs: {
        css: [
            "./src/libs/fancybox/dist/jquery.fancybox.min.css",
            "./src/libs/swiper/dist/css/swiper.min.css"
        ],
        js: [
            "./src/libs/jquery/dist/jquery.min.js",
            "./src/libs/fancybox/dist/jquery.fancybox.min.js",
            "./src/libs/swiper/dist/js/swiper.min.js",
        ]
    },
    dest: {
        html: "./build/",
        css: "./build/css/",
        js: "./build/js/",
        img: "./build/img/",
        fonts: "./build/fonts/"
    },
    watch: {
        html: "./src/pug/**/**/*.pug",
        css: "./src/sass/**/main.scss",
        js: "src/js/common.js",
        img: "src/img/**/*.+(jpg|jpeg|png|gif|ico)",
        fonts: "./src/fonts/**/*"
    },
    zip: {
        src: "./build/**/**",
        archive: "archive.zip",
        dest: "./"
    }

}

// Удаление директории
export const reset = () => {
    return deleteAsync(path.maninDest);
}

// js файлы
let jsFile = () => {
    return gulp.src(path.app.js)
    .pipe(sourceMaps.init())
    .pipe(uglify())
    .pipe(terser())
    .pipe(babel({
        presets: ["@babel/preset-env"]
    }))
    .pipe(rename({
        basename: "main",
        suffix: ".min"
    }))
    .pipe(size({ title: "main.min.js" }))
    .pipe(sourceMaps.write("./maps/", {
        mapFile: function(mapFilePath) {
          // source map files are named *.map instead of *.js.map
        return mapFilePath.replace('.js.map', '.map');
        }
    }))
    .pipe(gulp.dest(path.dest.js))
}

// Обработка PUG
let pugFile = () => {
    return gulp.src(path.app.html)
        .pipe(plumber())
        .pipe(pug())
        .pipe(gulp.dest(path.dest.html))
        .pipe(browserSyncs.stream());
}

// Обработка SCSS
let sassMain = () => {
    return gulp.src(path.app.css)
    .pipe(sass())
    .pipe(autoPrefixer())
    .pipe(plumber())
    .pipe(cssComb())
    .pipe(cssNano())
    .pipe(rename({ suffix: ".min" }))
    .pipe(size({ title: "main.min.css" }))
    .pipe(gulp.dest(path.dest.css))
    .pipe(browserSyncs.stream())
}

let vendorCss = () => {
    return gulp.src(path.libs.css)
    .pipe(autoPrefixer())
    .pipe(plumber())
    .pipe(concat("vendor.css"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(cssComb())
    .pipe(cssNano())
    .pipe(size({ title: "vendor.min.css" }))
    .pipe(gulp.dest(path.dest.css))
}

// Обработка JavaScript
let vendorJs = () => {
    return gulp.src(path.libs.js)
        .pipe(plumber())
        .pipe(size({ title: "vendor.js" }))
        .pipe(concat("vendor.js"))
        .pipe(babel())
        .pipe(rename({
            basename: 'vendor',
            suffix: '.min'
        }))
        .pipe(size({ title: "vendor.min.js" }))
        .pipe(terser())
        .pipe(gulp.dest(path.dest.js));
}

let imageFile = () => {
    return gulp.src(path.app.img)
        .pipe(plumber())
        .pipe(imgMin())
        .pipe(gulp.dest(path.dest.img));
}

// Создание
let zipFile = () => (
	gulp.src(path.zip.src)
		.pipe(zip(path.zip.archive))
		.pipe(gulp.dest(path.zip.dest))
);

// Сервер
const server = () => {
    browserSyncs.init({
        server: {
            baseDir: path.maninDest
        },
        port:4000,
        notify:false
    })
    gulp.watch("src/sass/**/*.scss", gulp.series(sassMain))
    gulp.watch("src/js/*.js", gulp.series(jsFile))
    gulp.watch("src/pug/**/*.pug", gulp.series(pugFile))
    gulp.watch("src/img/**/*.+(jpg|jpeg|png|gif|ico)", gulp.series(imageFile))
}

// Задачи
// export { pugFile, sassMain, jsFile, vendorJs, vendorCss, imageFile, zipFile };
;

const build = gulp.series(gulp.parallel(
    server,
    pugFile, 
    imageFile,
    sassMain, 
    jsFile, 
    vendorJs, 
    vendorCss, 
    zipFile 
));


export default build;