# mqtt-dmx-sequencer

[![NPM version](https://badge.fury.io/js/mqtt-dmx-sequencer.svg)](http://badge.fury.io/js/mqtt-dmx-sequencer)
[![Dependency Status](https://img.shields.io/gemnasium/hobbyquaker/mqtt-dmx-sequencer.svg?maxAge=2592000)](https://gemnasium.com/github.com/hobbyquaker/mqtt-dmx-sequencer)
[![Build Status](https://travis-ci.org/hobbyquaker/mqtt-dmx-sequencer.svg?branch=master)](https://travis-ci.org/hobbyquaker/mqtt-dmx-sequencer)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![License][mit-badge]][mit-url]

> Control DMX devices via Art-Net by MQTT.

Contains a sequencer. Multiple scene-transitions and sequences can run simultaneously.

## Installation

Node.js/npm needed.

```
sudo npm install -g mqtt-dmx-sequencer
mqtt-dmx-sequencer --help
```

## MQTT Topics

Topic structure follows [mqtt-smarthome](https://github.com/mqtt-smarthome/mqtt-smarthome) [architecture](https://github.com/mqtt-smarthome/mqtt-smarthome/blob/master/Architecture.md).

#### dmx/set/channel/&lt;channel&gt;

set a channels value

**payload**: integer number. channel value, min 0, max 255

#### dmx/set/scene/&lt;scene&gt;

call a scene

**payload** (optional): float number. transition time in seconds.

#### dmx/set/sequence/&lt;sequence&gt;

start a sequence or change options of a running sequence

**payload** (optional): json object with following attributes:

* repeat (boolean)
* shuffle (boolean)
* speed (float number)

#### dmx/set/sequence/&lt;sequence&gt;/stop

stop a running sequence


#### dmx/set/sequence/all/stop

stop all running sequences

## License

MIT © [Sebastian Raff](https://github.com/hobbyquaker)

[mit-badge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat
[mit-url]: LICENSE
