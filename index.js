#!/usr/bin/env node

const log = require('yalm');
const Mqtt = require('mqtt');
const Artnet = require('artnet');
const config = require('./config.js');
const pkg = require('./package.json');

const artnet = new Artnet({
    host: config.address,
    port: config.port
});

log.setLevel(config.verbosity);
log.info(pkg.name, pkg.version, 'starting');

const scenes = require(config.scenes);
log.info('scenes loaded from', config.scenes);
const sequences = require(config.sequences);
log.info('sequences loaded from', config.sequences);

artnet.data[0] = [];

// eslint-disable-next-line import/order
const sequencer = require('scene-sequencer')({
    setter: artnet.set,
    data: artnet.data[0],
    scenes,
    sequences
});

sequencer.on('transition-conflict', ch => {
    log.debug('transition conflict channel', ch);
});

let mqttConnected;

log.info('mqtt trying to connect', config.url);
const mqtt = Mqtt.connect(config.url, {will: {topic: config.name + '/connected', payload: '0'}});

mqtt.on('connect', () => {
    mqttConnected = true;
    log.info('mqtt connected ' + config.url);
    mqtt.publish(config.name + '/connected', '2');
    log.info('mqtt subscribe', config.name + '/set/#');
    mqtt.subscribe(config.name + '/set/#');
});

mqtt.on('close', () => {
    if (mqttConnected) {
        mqttConnected = false;
        log.info('mqtt closed ' + config.url);
    }
});

mqtt.on('error', () => {
    log.error('mqtt error ' + config.url);
});

process.on('SIGINT', () => {
    log.info('got SIGINT. exiting.');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log.info('got SIGTERM. exiting.');
    process.exit(0);
});

const runningSequences = {};

mqtt.on('message', (topic, payload) => {
    payload = payload.toString();
    log.debug('mqtt <', topic, payload);
    const tpArr = topic.split('/');
    let channel;
    let scene;
    let sequence;
    let transition;
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
                Object.keys(runningSequences).forEach(s => {
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
        let repeat = false;
        let shuffle = false;
        let speed = 1;

        if (payload.indexOf('{') !== -1) {
            try {
                const tmp = JSON.parse(payload);
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
        runningSequences[sequence] = sequencer.newSequence(sequence, repeat, shuffle, speed, () => {
            log.debug('sequence end', sequence);
            log.debug('mqtt >', config.name + '/status/sequence/' + sequence, '0');
            mqtt.publish(config.name + '/status/sequence/' + sequence, '0');
            delete runningSequences[sequence];
        });
    }
});
