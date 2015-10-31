'use strict';

var net = require('net'),
    through = require('through2'),
    chai = require('chai');

var assert = chai.assert;

var signaling = require('../lib/signaling');

function setupMock(messages) {
  if (!Array.isArray(messages)) {
    messages = [ messages ];
  }
  return through(function(data, encoding, callback) {
    // ignore data for now
    var output = messages.shift();
    callback(null, output);
  });
}

describe('signaling', function() {
  it('registers a user', function() {
    var conn = setupMock('200 OK');
    var signaler = signaling.createSignaling(conn);
    var p = signaler.register('bilbo.baggins@hobbiton.example');
    p = p.then(function() {
      assert.ok(true);
      console.log('user registered!');
    });
    return p;
  });
  it('fails to register', function() {
    var conn = setupMock('403 forbidden');
    var signaler = signaling.createSignaling(conn);
    var p = signaler.register('bilbo.baggins@hobbiton.example');
    p = p.then(function() {
      assert.ok(false, 'unexpected success');
    });
    p = p.catch(function(err) {
      assert.strictEqual(err.code, 403);
      assert.strictEqual(err.message, 'forbidden');
    });
    return p;
  })
});
