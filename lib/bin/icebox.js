/**
 * Parse the arguments for the "icebox" binary, and act on them
 *
 * @param  {Array} argv Arguments, or process.argv if not specified
 */
'use strict';

var net = require('net');
var signaling = require('../signaling');

exports.parse = function(argv) {
  if (!argv) {
    argv = process.argv.slice(2);
  }
  var args = require('yargs')(argv)
    .usage('$0 [options] <hostname> <user> <remoteuser>', {
      verbose: {
        alias: 'v',
        description: 'Verbose output',
        count: true
      },
      port: {
        alias: 'p',
        default: 5061,
        description: 'Port'
      }
    })
    .demand(3, 'hostname, user, and remoteuser required')
    .help('help')
    .alias('help', 'h')
    .version(function() {
      return require('../../package').version;
    })
    .alias('version', 'V')
    .argv;

  var hostname   = args._[0];
  var user       = args._[1];
  var remoteuser = args._[2];

  var conn = net.connect({
    host: hostname,
    port: args.port
  });
  var sig = signaling.createSignaling(conn);

  var invites = [];
  sig.on('invite', function(i) {
    invites.push(i);
    console.log('INVITED!!');
  });

  var p = sig.register(user);
  p.then(function() {
     console.log('Success!')
  });
}
