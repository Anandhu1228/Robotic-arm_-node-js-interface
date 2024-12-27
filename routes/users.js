var express = require('express');
var router = express.Router();

// Import serialport with correct API for version 10+
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Set up serial port connection to Arduino (Windows COM port example)
const port = new SerialPort({
    path: 'COM3',  
    baudRate: 9600
});

// Add event listener for 'open' event to ensure the serial port opens successfully
port.on('open', () => {
    console.log('Serial Port opened successfully');
});

// Add error handling to catch any issues with the serial port
port.on('error', (err) => {
    console.error('Error opening port: ', err);
});  

// Set up parser to read incoming data from Arduino
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Listen to serial port data (for debugging)
parser.on('data', (data) => {
    //console.log('Arduino says: ', data);
});

router.get('/', function(req, res, next) {
    res.render("user/controller_key_page")
    return 
  });

const servoRanges = [220, 220, 220, 190, 190, 190];

// POST request for servo control
router.post('/servo/:id', function (req, res) {
    const servoIndex = parseInt(req.params.id) - 1; // Servo index (0-based)
    const position = req.body.position; // Slider position (0-100)

    // Validate input
    if (typeof position !== 'number' || position < 0 || position > 100 || servoIndex < 0 || servoIndex >= servoRanges.length) {
        console.error(`Invalid input: Servo ${servoIndex + 1}, Position ${position}`);
        return res.status(400).send('Invalid input. Position must be 0-100 and servo index valid.');
    }
  
    // Get the maximum range for the servo
    const maxRange = servoRanges[servoIndex];  

    // Map slider position (0-100) to the servo's range
    const angle = Math.round((position / 100) * maxRange);

    console.log(`Servo ${servoIndex + 1}: Slider position ${position}% mapped to angle ${angle}°`);

    // Send the servo control command to the Arduino
    port.write(`S${servoIndex + 1}:${angle}\n`, (err) => {
        if (err) {
            console.error('Error sending data to Arduino:', err);
            return res.status(500).send('Error sending data to Arduino');
        }

        port.once('data', (data) => {
            console.log(`Arduino response: ${data.toString()}`);
            res.send({ success: true, message: data.toString() });
        });
    });
});
 

module.exports = router;
 
