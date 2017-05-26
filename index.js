#!/usr/bin/env node

var log = require('yalm');
var Mqtt = require('mqtt');
var Artnet = require('artnet');
var config = require('./config.js');
var pkg = require('./package.json');

var artnet = new Artnet({
    host: config.address,
    port: config.port
});

log.setLevel(config.verbosity);
log.info(pkg.name, pkg.version, 'starting');

var scenes = require(config.scenes);
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

sequencer.on('transition-conflict', function (ch) {
    log.debug('transition conflict channel', ch);
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

mqtt.on('message', function (topic, payload) {
    payload = payload.toString();
    log.debug('mqtt <', topic, payload);
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
            if (scenes[scene]) {
                log.debug('setScene', scene);
                transition = parseFloat(payload) || 0;
                sequencer.setScene([scene, transition]);
            } else {
                log.error('unknown scene', scene);
            }
            break;
        case 'sequence':
            sequence = tpArr[3];
            if (tpArr[4] === 'stop' && runningSequences[sequence]) {
                runningSequences[sequence].stop();
            } else if (tpArr[4] === 'stop' && sequence === 'all') {
                Object.keys(runningSequences).forEach(function (s) {
                    runningSequences[s].stop();
                });
            } else if (sequences[sequence]) {
                log.debug('newSequence', sequence);
                newSequence(sequence, payload);
            } else {
                log.error('unknown sequence', sequence);
            }
            break;
        default:
            log.error('unknown cmd', tpArr[2]);
    }

    function newSequence(sequence, payload) {
        var repeat = false;
        var shuffle = false;
        var speed = 1;

        if (payload.indexOf('{') !== -1) {
            try {
                var tmp = JSON.parse(payload);
                repeat = tmp.repeat;
                shuffle = tmp.shuffle;
                speed = tmp.speed;
            } catch (err) {
                log.error(err);
            }
        }

        if (runningSequences[sequence]) {
            runningSequences[sequence].speed(speed);
            runningSequences[sequence].shuffle(shuffle);
            runningSequences[sequence].repeat(repeat);
            return;
        }

        log.debug('newSequence', repeat, shuffle, speed);
        log.debug('mqtt >', config.name + '/status/sequence/' + sequence, '1');
        mqtt.publish(config.name + '/status/sequence/' + sequence, '1');
        runningSequences[sequence] = sequencer.newSequence(sequence, repeat, shuffle, speed, function () {
            log.debug('sequence end', sequence);
            log.debug('mqtt >', config.name + '/status/sequence/' + sequence, '0');
            mqtt.publish(config.name + '/status/sequence/' + sequence, '0');
            delete runningSequences[sequence];
        });
    }
});

