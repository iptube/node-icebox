'use strict';

var gulp = require('gulp'),
    gutil = require('gulp-util'),
    mocha = require('gulp-mocha'),
    istanbul = require('gulp-istanbul');

var TESTS = './test/**/*.js';
var SRC = './lib/**/*.js';

gulp.task('lint', function() {
  var eslint = require('gulp-eslint');

  return gulp.src([
    SRC,
    TESTS,
    'gulpfile.js'
  ])
  .pipe(eslint())
  .pipe(eslint.format());
});

gulp.task('test', function() {
  var mocha = require('gulp-mocha');
  return gulp.src([TESTS])
    .pipe(mocha());
});

gulp.task('pre-coverage', function() {
  return gulp.src([SRC])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task('coverage', [ 'pre-coverage' ], function() {
  var t = gulp.src([TESTS])
  .pipe(mocha().on('error', function(er) {
    gutil.log(er);
    t.end();
  }))
  .pipe(istanbul.writeReports({
    dir: './coverage/nodejs',
    reporters: ['html', 'text-summary']
  }));
  return t;
});

gulp.task('watch', ['coverage'], function() {
  return gulp.watch([SRC, TESTS], ['coverage']);
});

gulp.task('default', ['coverage']);
