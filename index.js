#!/usr/bin/env node

var pkg =       require('./package.json');
var log =       require('yalm');
var Mqtt =      require('mqtt');
var config =    require('./config.js');

var artnet = require('artnet')({
    host: config.address,
    port: config.port
});

log.loglevel = config.verbosity;
log.info(pkg.name, pkg.version, 'starting');


var scenes =    require(config.scenes);
log.info('scenes loaded from', config.scenes);
var sequences = require(config.sequences);
log.info('sequences loaded from', config.sequences);

artnet.data[0] = [];
var sequencer = require('./lib/sequencer.js')({
    setter: artnet.set,
    data: artnet.data[0],
    scenes: scenes,
    sequences: sequences
});


var mqttConnected;

log.info('mqtt trying to connect', config.url);
var mqtt = Mqtt.connect(config.url, {will: {topic: config.name + '/connected', payload: '0'}});


mqtt.on('connect', function () {
    mqttConnected = true;
    log.info('mqtt connected ' + config.url);
    mqtt.publish(config.name + '/connected', '2');
    log.info('mqtt subscribe', config.name + '/set/#');
    mqtt.subscribe(config.name + '/set/#');
});

mqtt.on('close', function () {
    if (mqttConnected) {
        mqttConnected = false;
        log.info('mqtt closed ' + config.url);
    }
});

mqtt.on('error', function () {
    log.error('mqtt error ' + config.url);
});

process.on('SIGINT', function () {
    log.info('got SIGINT. exiting.');
    process.exit(0);
});

process.on('SIGTERM', function () {
    log.info('got SIGTERM. exiting.');
    process.exit(0);
});

var runningSequences = {};

mqtt.on('message', function (topic, payload, msgObj) {
    var tpArr = topic.split('/');
    var channel;
    var scene;
    var sequence;
    var transition;
    switch (tpArr[2]) {
        case 'channel':
            channel = parseInt(tpArr[3], 10);
            if (channel < 1 || channel > 512) {
                log.error('invalid channel', tpArr[3]);
            } else {
                artnet.set(channel, parseInt(payload, 10));
            }
            break;
        case 'scene':
            scene = tpArr[3];
            if (!scenes[scene]) {
                log.error('unknown scene', scene);
            } else {
                log.debug('setScene', scene);
                transition = parseFloat(payload) || 0;
                sequencer.setScene([scene, transition], function () {
                    
                });
            }
            break;
        case 'sequence':
            sequence = tpArr[3];
            if (tpArr[4] === 'stop' && runningSequences[sequence]) {
                runningSequences[sequence].stop();
            }

            if (!sequences[sequence]) {
                log.error('unknown sequence', sequence);
            } else {
                log.debug('newSequence', sequence);
                newSequence(sequence, payload)
            }
            break;

    }

    function newSequence(sequence, payload) {

        var repeat = false;
        var shuffle = false;
        var speed = 1;

        try {
            var tmp = JSON.parse(payload);
            repeat = tmp.repeat;
            shuffle = tmp.shuffle;
            speed = tmp.speed;
        } catch (e) {

        }

        if (runningSequences[sequence]) {
            runningSequences[sequence].speed(speed);
            runningSequences[sequence].shuffle(shuffle);
            runningSequences[sequence].repeat(repeat);
            return;
        }

        log.debug('newSequence', repeat, shuffle, speed);
        mqtt.publish(config.name + '/status/sequence/' + sequence, '1');
        runningSequences[sequence] = sequencer.newSequence(sequence, repeat, shuffle, speed, function () {
            log.debug('sequence end', sequence);
            mqtt.publish(config.name + '/status/sequence/' + sequence, '0');
            delete runningSequences[sequence];
        });

    }

});



