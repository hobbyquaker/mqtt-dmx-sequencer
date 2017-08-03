const path = require('path');
module.exports = require('yargs')
    .usage('Usage: $0 [options]')

    .describe('v', 'possible values: "error", "warn", "info", "debug"')
    .describe('a', 'artnet host address')
    .describe('p', 'artnet host port')
    .describe('n', 'instance name. used as mqtt client id and as prefix for connected topic')
    .describe('j', 'json file containing scene definitions')
    .describe('s', 'json file containing sequence definitions')
    .describe('u', 'mqtt broker url. See https://github.com/mqttjs/MQTT.js#connect-using-a-url')
    .describe('h', 'show help')

    .alias({
        h: 'help',
        n: 'name',
        u: 'url',
        a: 'address',
        p: 'port',
        v: 'verbosity',
        j: 'scenes',
        s: 'sequences'
    })

    .default({
        u: 'mqtt://127.0.0.1',
        n: 'dmx',
        a: '255.255.255.255',
        p: 6454,
        v: 'info',
        j: path.join(__dirname, '/example-scenes.json'),
        s: path.join(__dirname, '/example-sequences.json')
    })
    .version()
    .help('help')
    .argv;
