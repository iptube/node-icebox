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
    var self = this;
    function next() {
      var output = messages.shift();
      if (!output) {
        return callback();
      }
      self.push(output);
      process.nextTick(next);
    }
    next();
  });
}

describe('signaling', function() {
  describe('#register', function() {
    it('registers a user', function() {
      var conn = setupMock('200 OK');
      var signaler = signaling.createSignaling(conn);
      var p = signaler.register('bilbo.baggins@hobbiton.example');
      p = p.then(function() {
        assert.ok(true);
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
    });
  });
  describe('#invite', function() {
    it('invites a user', function() {
      var conn = setupMock([
        '100 Trying',
        [
          '200 OK',
          'From: frodo.baggins@hobbiton.example',
          'To: bilbo.baggins@hobbiton.example'
        ].join('\n')
      ]);
      var signaler = signaling.createSignaling(conn);
      // fake register
      signaler.user = 'bilbo.baggins@hobbiton.example';
      var p = signaler.invite('frodo.baggins@hobbiton.example');
      p = p.then(function(invitee) {
        assert.strictEqual(invitee, 'frodo.baggins@hobbiton.example');
      });
      return p;
    });
    it('fails to invite a user (not found)', function() {
      var conn = setupMock([
        '100 Trying',
        '404 Not found'
      ]);
      var signaler = signaling.createSignaling(conn);
      // fake register
      signaler.user = 'bilbo.baggins@hobbiton.example';
      var p = signaler.invite('frodo.baggins@hobbiton.example');
      p = p.then(function() {
        assert.ok(false, 'unexpected success');
      });
      p = p.catch(function(err) {
        assert.strictEqual(err.code, 404);
        assert.strictEqual(err.message, 'Not found');
      });
      return p;
    });
    it('fails to invite a user (not authorized)', function() {
      var conn = setupMock([
        '401 Not authorized'
      ]);
      var signaler = signaling.createSignaling(conn);
      // fake register
      signaler.user = 'bilbo.baggins@hobbiton.example';
      var p = signaler.invite('frodo.baggins@hobbiton.example');
      p = p.then(function() {
        assert.ok(false, 'unexpected success');
      });
      p = p.catch(function(err) {
        assert.strictEqual(err.code, 401);
        assert.strictEqual(err.message, 'Not authorized');
      });
      return p;
    });
  });
  describe('!invite', function() {
    it('receives an invite', function(done) {
      var conn = (function() {
        var invited = false;
        return through(function(data, encoding, callback) {
          if (!invited) {
            // pass data along in the next tick
            invited = true;
            callback(null, data);
          } else {
            // test results
            var expected = [
              '200 OK',
              'From: bilbo.baggins@hobbiton.example',
              'To: frodo.baggins@hobbiton.example'
            ].join('\n');
            assert.equal(data.toString('utf8'), expected);
            done();
          }
        });
      })();
      var signaler = signaling.createSignaling(conn);
      // fake register
      signaler.user = 'bilbo.baggins@hobbiton.example';
      signaler.on('invite', function(info) {
        var expected = {
          from: 'frodo.baggins@hobbiton.example',
          to: 'bilbo.baggins@hobbiton.example'
        };
        assert.deepEqual(info, expected);
      });
      var msg = [
        'INVITE bilbo.baggins@hobbiton.example',
        'To: bilbo.baggins@hobbiton.example',
        'From: frodo.baggins@hobbiton.example'
      ].join('\n');
      conn.write(new Buffer(msg, 'utf8'));
    });
  });
});
