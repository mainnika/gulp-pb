'use strict';

var path = require('path');
var assert = require('assert');
var gulp = require('gulp');
var getStream = require('get-stream');

var pb = require('.');

describe('Plugin', function () {

	it('should generate js file', function (cb) {

		var stream = gulp.src('fixture/src/**/*.proto')
			.pipe(pb.js());

		getStream.array(stream).then(function (files) {
			assert.equal(files.length, 1);
			assert.equal(path.basename(files[0].path), 'def.js');
			cb();
		});
	})
})
