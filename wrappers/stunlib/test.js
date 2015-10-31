x = require('./build/Release/stunlib-wrapper');

var y = new x.TurnClient();
y.StartAllocateTransaction(50,
                           function() {
                               console.log("Info callback");
                           },
                           function() {
                               console.log("Send callback");
                           },
                           function() {
                               console.log("Cb callback");
                           }
                          );
