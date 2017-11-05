'use strict';

var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var pbjs = require("protobufjs/cli/pbjs");
var replaceExt = require('replace-ext');

var replaceExtension = function (fp, ex) {
	return path.extname(fp) ? replaceExt(fp, ex) : fp;
}

var js = function generateJs() {

	return through.obj(function (file, enc, cb) {

		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-pb', 'Streaming not supported'));
			return;
		}

		var self = this;

		try {
			pbjs.main([
				'--target', 'static-module',
				'-w', 'commonjs',
				file.path,
			], function (err, output) {
				if (err)
					throw err;

				self.push(new gutil.File(Object.assign({}, file, {
					path: replaceExtension(file.path, '.js'),
					contents: Buffer.from(output),
				})));

				cb();
			});
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-pb', err, {
				fileName: file.path,
				showProperties: false
			}));
			cb(err);
		}
	})
}

Object.assign(module.exports, {
	js: js,
})
