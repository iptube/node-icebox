/**
 * Parse the arguments for the "icebox" binary, and act on them
 *
 * @param  {Array} argv Arguments, or process.argv if not specified
 */
exports.parse = function(argv) {
  if (!argv) {
    argv = process.argv.slice(2);
  }
  var args = require('yargs')(argv)
    .usage('$0 <hostname> <user> <remoteuser>')
    .demand(3, 'hostname, user, and remoteuser required')
    .argv;

  var hostname   = args._[0];
  var user       = args._[1];
  var remoteuser = args._[2];

  console.log(hostname, user, remoteuser);
}
