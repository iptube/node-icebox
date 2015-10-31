'use strict';

var net = require('net'),
    through = require('through2');

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
    var conn = setupMock("200 OK");
    var signaler = signaling.createSignaling(conn);
    var p = signaler.register('bilbo.baggins@hobbiton.example');
    p = p.then(function() {
      console.log('user registered!');
    });
    return p;
  });
});
