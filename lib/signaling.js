
'use strict';

var EventEmitter = require('events').EventEmitter;

/**
 *
 */
function Signaling(sock) {
  EventEmitter.call(this);

  this._socket = sock;
  this._received = [];
  this._socket.on('data', this._parseMessage.bind(this));
}
require('util').inherits(Signaling, EventEmitter);
Signaling.prototype._parseMessage = function(data) {
  data = data.toString('utf8');
  data = data.split(/\n|\:|\\/g);

  var self = this;
  data.forEach(function(m) {
    var result,
        code,
        message;
    // look for response ({code} {msg})
    result = /^(\d+)\s+(.+)$/.exec(m);
    if (result) {
      code = parseInt(result[1]);
      message = result[2];
      self.emit('response', {
        code: code,
        message: message
      });
      return;
    }
    // look for 'INVITE'
    result = /^INVITE\s(.)$/.exec(m);
    if (result) {
      self.emit('invite', result[1]);
    }
  });
}

Signaling.prototype.register = function(user) {
  var self = this,
      p;

  p = new Promise(function(resolve, reject) {
    self.user = user;
    self.once('response', function(status) {
      if (200 === status.code) {
        resolve();
      } else {
        var err = new Error(status.message);
        err.code = status.code;
        reject(err);
      }
    });

    var output = 'REGISTER ' + self.user;
    output = new Buffer(output, 'utf8');
    self._socket.write(output);
  });
  return p;
};
Signaling.prototype.invite = function(user) {
  var self = this,
      p;

  p = new Promise(function(resolve, reject) {
    function handleResponse(status) {
      var result,
          err,
          done;
      if (100 == status.code) {
        // still pending
      } else if (200 === status.code) {
        // completed!
        result = user;
        done = true;
      } else {
        err = new Error(status.message);
        err.code = status.code;
        done = true;
      }
      
      if (done) {
        self.removeListener('response', handleResponse);
        if (result) {
          resolve(result);
        } else {
          reject(err);
        }
      }
    };
    self.on('response', handleResponse);

    var output = [
      'INVITE ' + user,
      'To: ' + user,
      'From: ' + self.user
    ];
    output = output.join('\n');
    output = new Buffer(output, 'utf8');
    self._socket.write(output);
  });
  return p;
}

exports.createSignaling = function(sock) {
  return new Signaling(sock);
};
