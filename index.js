'use strict';

var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var pbjs = require("protobufjs/cli/pbjs");
var cp = require('child_process');
var replaceExt = require('replace-ext');

var replaceExtension = function (fp, ex) {
	return path.extname(fp) ? replaceExt(fp, ex) : fp;
}

var json = function generateJson() {

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
				'--target', 'json',
				file.path,
			], function (err, output) {
				if (err)
					throw err;

				self.push(new gutil.File(Object.assign({}, file, {
					path: replaceExtension(file.path, '.json'),
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

var ts = function generateTs() {

	return through.obj(function (file, enc, cb) {

		if (!file.isBuffer()) {
			cb(new gutil.PluginError('gulp-pb', 'pbts requires buffer file'));
			return;
		}

		var pbts = cp.fork(require.resolve("protobufjs/bin/pbts"), ['-'], {
			stdio: ['pipe', 'pipe', 'inherit', 'ipc'],
		});

		var dts = [];
		var self = this;

		pbts.stdin.write(file.contents);
		pbts.stdin.end();
		pbts.stdout.on('data', dts.push.bind(dts));

		pbts.on('close', function () {

			self.push(new gutil.File(Object.assign({}, file, {
				path: replaceExtension(file.path, '.d.ts'),
				contents: Buffer.concat(dts),
			})));

			cb();
		});

		pbts.on('error', cb);
	})
}

Object.assign(module.exports, {
	json: json,
	js: js,
	ts: ts,
})
