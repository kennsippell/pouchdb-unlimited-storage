const gulp = require('gulp');
const { bundle } = require('./../../gulpfile');

gulp.task('client-scripts', () => bundle('client.js', 'client'));

gulp.task('default', ['client-scripts']);

// Run continuously
gulp.task('dev', ['client-scripts'], () => {
  gulp.watch(['../../src/client/**/*', '*.*'], ['client-scripts']);
});
