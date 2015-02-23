var gulp = require('gulp');
var less = require('gulp-less');
var directiveReplace = require('gulp-directive-replace');
var removeCode = require('gulp-remove-code');
var replace = require('gulp-replace');
var path = require('path');

var git = require('gulp-git')
var bump = require('gulp-bump')
var filter = require('gulp-filter')
var tag_version = require('gulp-tag-version')

var spawn = require('child_process').spawn;
 

/**
 * Bumping version number and tagging the repository with it.
 * Please read http://semver.org/
 *
 * You can use the commands
 *
 *     gulp patch     # makes v0.1.0 → v0.1.1
 *     gulp feature   # makes v0.1.1 → v0.2.0
 *     gulp release   # makes v0.2.1 → v1.0.0
 *
 * To bump the version numbers accordingly after you did a patch,
 * introduced a feature or made a backwards-incompatible release.
 */

function inc(importance) {
    // get all the files to bump version in
    return gulp.src(['./package.json', './bower.json'])
        // bump the version number in those files
        .pipe(bump({type: importance}))
        // save it back to filesystem
        .pipe(gulp.dest('./'))
        // commit the changed version number
        .pipe(git.commit('[BOT] Bump package version'))
        // read only one file to get the version number
        .pipe(filter('package.json'))
        // **tag it in the repository**
        .pipe(tag_version());
}

gulp.task('patch', ['directives', 'less', 'demo', 'dist'], function() { return inc('patch'); })
gulp.task('feature', ['directives', 'less', 'demo', 'dist'], function() { return inc('minor'); })
gulp.task('release', ['directives', 'less', 'demo', 'dist'], function() { return inc('major'); })


gulp.task('dist', function(){
	return gulp.src('./dist/*')
		.pipe(git.add())
		.pipe(git.commit("[BOT] New distribution release"));
});


gulp.task('npm', function (done) {
  spawn('npm', ['publish'], { stdio: 'inherit' }).on('close', done);
});


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