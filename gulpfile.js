'use strict';

var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    istanbul = require('gulp-istanbul');

var TESTS = ['./test/**/*.js'];

gulp.task('lint', function() {
  var eslint = require('gulp-eslint');

  return gulp.src([
    'lib/**/*.js',
    'test/**/*.js',
    'gulpfile.js'
  ])
  .pipe(eslint())
  .pipe(eslint.format());
});

gulp.task('test', function() {
  var mocha = require('gulp-mocha');
  return gulp.src(TESTS)
    .pipe(mocha());
});

gulp.task('pre-coverage', function() {
  return gulp.src([ 'lib/*.js' ])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
})

gulp.task('coverage', [ 'pre-coverage' ], function() {
  return gulp.src(TESTS)
  .pipe(mocha().on('error', function(er) {
    gutil.log(er.stack);
    t.end();
  }))
  .pipe(istanbul.writeReports({
    dir: './coverage/nodejs',
    reporters: ['html', 'text-summary']
  }));
})

gulp.task('default', ['coverage']);
