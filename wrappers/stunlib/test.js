var dgram = require("dgram");
var stunlib = require('./build/Release/stunlib-wrapper');

var STUNPORT = 3478;

var hostname   = "52.17.176.44";
var user       = "bugoga";
var pass       = "bugoga"

var turnClient = new stunlib.TurnClient();

var msock = dgram.createSocket('udp4');
msock.bind(STUNPORT);
msock.on("message", function (msg, rinfo) {
    // console.log(msg);
    // console.log("server got: " + msg + " from " +
    //             rinfo.address + ":" + rinfo.port);

    isStun = stunlib.IsStunMsg(msg, msg.length);
    if (isStun) {
        turnClient.HandleIncResp(msg, msg.length);
    }
});

turnClient.StartAllocateTransaction(500,
                                    hostname, STUNPORT,
                                    function() {
                                        console.log("Info callback");
                                    },
                                    function(buffer, sendToHost, sendToport) {
                                        console.log("Send callback");
                                        msock.send(buffer, 0, buffer.length, sendToport, sendToHost);
                                        // console.log(sendToHost + ":" + sendToport);
                                        // console.log(buffer)
                                    },
                                    function(cbData) {
                                        console.log("Cb callback");
                                        console.log(cbData);
                                    }
                                   );

setInterval(function() {
    turnClient.HandleTick();
}, 500);
