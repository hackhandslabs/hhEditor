var gulp = require('gulp');
var less = require('gulp-less');
var directiveReplace = require('gulp-directive-replace');
var removeCode = require('gulp-remove-code');
var replace = require('gulp-replace');

var path = require('path');

gulp.task('directives', function(){
	return gulp.src('./src/*.js')
		.pipe(directiveReplace({root: 'src'}))
		.pipe(gulp.dest('./dist/'));
});

gulp.task('less', function () {
	gulp.src('./src/*.less')
		.pipe(less())
		.pipe(gulp.dest('./dist/'));
});

gulp.task('demo', function () {
	gulp.src('./src/*.html')
		.pipe(removeCode({ production: true }))
		.pipe(replace("hhEditor.less", 'hhEditor.css'))
		.pipe(replace("stylesheet/less", 'stylesheet'))
		.pipe(gulp.dest('./dist/'))
});

gulp.task('default', ['directives', 'less', 'demo'], function() {
  // Do stuff
});