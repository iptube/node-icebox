'use strict';

var assert = require('chai').assert;
var spawn = require('child_process').spawn;

function badParams(params) {
  return new Promise(function(resolve, reject) {
    var resp = {
      out: '',
      err: '',
      exit: -1
    }
    var child = spawn('./icebox', params, {
      cwd: 'bin'
    });
    child.stdout.on('data', function(d) {
      resp.out += d.toString();
    });
    child.stderr.on('data', function(d) {
      resp.err += d.toString();
    });
    child.on('close', function(code) {
      resp.exit = code;
      resolve(resp);
    });
  });
}

describe('command line', function() {
  it('requires parameters', function() {
    return badParams([])
    .then(function(r) {
      assert.equal(r.exit, 1);
      return badParams(['localhost'])
    })
    .then(function(r) {
      assert.equal(r.exit, 1);
      return badParams(['localhost', 'user'])
    })
    .then(function(r) {
      assert.equal(r.exit, 1);
      return badParams(['-h'])
    })
    .then(function(r) {
      assert.equal(r.exit, 0);
      return badParams(['--version'])
    })
    .then(function(r) {
      var pkg = require('../package')
      assert.equal(r.out, pkg.version+'\n');
      assert.equal(r.exit, 0);
    });
  });
});
