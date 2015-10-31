
'use strict';

var assign = require('lodash.assign'),
    EventEmitter = require('events').EventEmitter,
    headerParser = require('header-parse');

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
  function parseProps(data) {
    data = headerParser.extractHeaderBlock(data);
    if (!data.headers) {
      data.headers = headerParser.parseHeaders(data.body);
      delete data.body;
    }
    // fixup header names to be lower case
    Object.keys(data.headers).forEach(function(n) {
      var v = data.headers[n];
      delete data.headers[n];
      data.headers[n.toLowerCase()] = v;
    });
    return data;
  }

  var result,
      extra;
  // look for response ({code} {msg})
  result = /^(\d+)\s+(.+)/.exec(data);
  if (result) {
    result = {
      code: parseInt(result[1]),
      message: result[2]
    };
    extra = parseProps(data);
    result = assign(result, extra.headers);
    this.emit('response', result, extra.body);
    return;
  }
  
  // look for invite (INVITE {to}\nTo: {to}\nFrom: {from})
  result = /^INVITE\s+(.+)/.exec(data);
  if (result) {
    extra = parseProps(data);
    // TODO: allow for accepting/rejecting an invite?
    this.emit('invite', extra.headers, extra.body);
    // respond in kind
    var output = [
      '200 OK',
      'From: ' + extra.headers.to,
      'To: ' + extra.headers.from
    ].join('\n');
    this._socket.write(new Buffer(output, 'utf8'));
    return;
  }
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
