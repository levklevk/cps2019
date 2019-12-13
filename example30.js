/*********************************************************************        
University of Maribor ************************************************
Cybernetics & Decision Support Systems Laboratory ********************
Faculty of Organizational Sciences ***********************************
Andrej Škraba ********************************************************
*********************************************************************/

//The connection should be secure, i.e. https - don't forget to put [s] in the Chrome address i.e. https://172...
//Therefore, the certificate files should be generated in Linux terminal (in the cps-iot directory),
//you should execute the following three (3) lines in Linux terminal (bash:)
//sudo openssl genrsa -out privatekey.pem 1024
//sudo openssl req -new -key privatekey.pem -out certrequest.csr
//sudo openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
//This will generate two files, privatekey.pem and certificate.pem on the disc in the cps-iot directory. 

var firmata = require("firmata");

var board = new firmata.Board("/dev/ttyACM0", function() { // ACM Abstract Control Model for serial communication with Arduino (could be USB)
    console.log("Arduino connect");
    board.pinMode(2, board.MODES.OUTPUT); // direction of DC motor
    board.pinMode(3, board.MODES.PWM); // PWM of motor i.e. speed of rotation
    board.pinMode(4, board.MODES.OUTPUT); // direction DC motor
    board.digitalWrite(2,1); // initialization of digital pin 2 to rotate Left on start
    board.digitalWrite(4,0); // initialization of digital pin 2 to rotate Left on start
    board.pinMode(13, board.MODES.OUTPUT); // enable pin 13 for turning the LED on and off
    board.analogWrite(3,"100");                board.analogWrite(3,msg.pwm);
    console.log("pwm");


});


var fs  = require("fs");

var options = {
   key: fs.readFileSync('privatekey.pem'),
   cert: fs.readFileSync('certificate.pem')
};

var httpsServerForHTML = require("https").createServer(options, handler); // here the argument "handler" is needed, which is used latter on -> "function handler (req, res); in this line, we create the server! (https is object of our app)
var url = require("url");

// read ssl certificate
var privateKey = fs.readFileSync('privatekey.pem', 'utf8');
var certificate = fs.readFileSync('certificate.pem', 'utf8');

var credentials = { key: privateKey, cert: certificate };
var https = require('https');

//pass in your credentials to create an https server
var httpsServer = https.createServer(credentials);
httpsServer.listen(8888);

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
    server: httpsServer
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
    client.send(data);
      }
  });
};

var messageJSON;

function handler(req, res) {
    fs.readFile(__dirname + "/example30.html",
    function (err, data) {
        if (err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            return res.end("Error loading html page.");
        }
    res.writeHead(200);
    res.end(data);
    })
}

httpsServerForHTML.listen(8080);  // determine on which port we will listen | port 80 is usually used by LAMP | This could be determined on the router (http is our main object, i.e.e app)

console.log("Use (S) httpS! - System Start - Use (S) httpS!"); // we print into the console that in the Chrome browser, the httpS (S!=Secure) should be used i.e. https://...

board.on("ready", function() {

wss.on('connection', function connection(ws) { // start of wss code

    ws.on("message", function (msgString) { // message comes as string -> msgString
        var msg = JSON.parse(msgString); // string from ws which comes as a string is put to JSON
        switch(msg.type) {
            case "left":
                board.digitalWrite(13, board.HIGH); // if we hear the message "left" we write HIGH value on pin 13
            break;
            case "center":
                board.digitalWrite(13, board.LOW); // if we hear the message "center" we write LOW value on pin 13
            break;
            case "right":
                board.digitalWrite(13, board.HIGH); // if we hear the message "right" we write HIGH value on pin 13
            break;            
        } // end of switch(msg.type) code
    }); // end of wss.on(message) code 
}); // end of wss.on(connection) code
    
}); // end of board.on ready


