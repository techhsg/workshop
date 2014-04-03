var five = require("johnny-five");
var board = new five.Board();
var Stream = require('stream-readable');
var flow_stream = new Stream();

var plotly = require('plotly')('username','api_key');

var data = [{
  x : [],
  y : [],
  stream : {
    token : 'streamtoken',
    maxpoints : 5000
  }
}];

var layout = { fileopt : "overwrite", filename : "Water Flow" };

var pulses = 0;
var lastFlowRateTimer = 0;

function flowSignal (value) {
    if (value === 0) {
      lastFlowRateTimer ++;
      return;
    }
    if (value === 1) {
      pulses ++;
    }
    lastFlowPinState = value;
    flowrate = 1000.0;
    flowrate /= lastFlowRateTimer;
    lastFlowRateTimer = 0;
}

board.on("ready", function() {
  this.pinMode(2, five.Pin.INPUT);
  lastFlowPinState = 0;

  // Check Digital Pin to see if theres a change
  var x = this.digitalRead(2, function(value) {
    flowSignal(value);
    console.log(value);
  });

  // Set how often to Emit data to Plotly
  setInterval(function() {
    var time = new Date();
    var date = new Date(time - 14400000).toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var litres = pulses;
    litres /= 7.5;
    litres /= 60;
    var data = {x:date, y:litres};
    flow_stream.emit('data', JSON.stringify(data)+'\n');
  }, 500);

  // Set up Graph + Initialize stream + Pipe to stream
  plotly.plot(data,layout,function (err, msg) {
    console.log(msg);
    var stream = plotly.stream('streamtoken', function (res) {
      console.log(res);
    });
    flow_stream.pipe(stream);
  });


});