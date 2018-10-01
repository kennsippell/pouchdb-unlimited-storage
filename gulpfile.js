const browserify = require('browserify');
const gulp = require('gulp');
const source = require('vinyl-source-stream');
const log = require('gulplog');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify-es').default;
const rename = require('gulp-rename');
const gulpCopy = require('gulp-copy');

gulp.task('client-scripts', () => bundle('src/client/index.js', 'pouchdb-unlimited-storage'));
gulp.task('extension-scripts', () => bundle('src/extension/index.js', 'pouchdb-unlimited-storage-extension'));

gulp.task('minify-client-scripts', ['client-scripts'], () => minify('src/client/index.js', 'pouchdb-unlimited-storage'));
gulp.task('minify-extension-scripts', ['extension-scripts'], () => minify('src/extension/index.js', 'pouchdb-unlimited-storage-extension'));

gulp.task('copy-extension-to-sample', ['extension-scripts'], () => gulp
  .src('./dist/pouchdb-unlimited-storage-extension.js')
  .pipe(gulpCopy('./samples/extension')));

function bundle(src, filename) {
  return browserify({
    entries: [src],
    debug: true,
  })
    .on('log', log.info)
    .bundle()
    .pipe(source(src))
    .pipe(buffer())
    .pipe(rename((path) => {
      /* eslint no-param-reassign: 0 */
      path.dirname = '.';
      path.basename = filename;
    }))
    .pipe(gulp.dest('./dist/'));
}

function minify(src, filename) {
  return gulp.src(`dist/${filename}.js`)
    .on('log', log.info)
    .pipe(uglify().on('error', console.error))
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest('./dist/'));
}

gulp.task('default', ['minify-extension-scripts', 'minify-client-scripts']);

// Run continuously
gulp.task('dev', ['extension-scripts', 'client-scripts'], () => {
  gulp.watch('src/client/**/*', ['client-scripts']);
  gulp.watch('src/extension/**/*', ['extension-scripts', 'copy-extension-to-sample']);
});

module.exports = {
  bundle,
  minify,
};
