# mqtt-dmx-sequencer

[![NPM version](https://badge.fury.io/js/mqtt-dmx-sequencer.svg)](http://badge.fury.io/js/mqtt-dmx-sequencer)
[![Dependency Status](https://img.shields.io/gemnasium/hobbyquaker/mqtt-dmx-sequencer.svg?maxAge=2592000)](https://gemnasium.com/github.com/hobbyquaker/mqtt-dmx-sequencer)
[![Build Status](https://travis-ci.org/hobbyquaker/mqtt-dmx-sequencer.svg?branch=master)](https://travis-ci.org/hobbyquaker/mqtt-dmx-sequencer)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![License][mit-badge]][mit-url]

> Control DMX devices via Art-Net by MQTT.

This is the headless counterpart to the [MQTT DMX Controller](https://github.com/hobbyquaker/mqtt-dmx-controller). Uses 
scenes and sequences created with - and exported from - the MQTT DMX Controller that can be controlled via MQTT. 


## Installation

Node.js >= 6 needed.

```
sudo npm install -g mqtt-dmx-sequencer
mqtt-dmx-sequencer --help
```

## Usage

``` 
Usage: mqtt-dmx-sequencer [options]

Options:
  -v, --verbosity  possible values: "error", "warn", "info", "debug"
                                                               [default: "info"]
  -a, --address    artnet host address              [default: "255.255.255.255"]
  -p, --port       artnet host port                              [default: 6454]
  -n, --name       instance name. used as mqtt client id and as prefix for
                   connected topic                              [default: "dmx"]
  -j, --scenes     json file containing scene definitions              [default:
         "/Users/basti/WebstormProjects/mqtt-dmx-sequencer/example-scenes.json"]
  -s, --sequences  json file containing sequence definitions           [default:
      "/Users/basti/WebstormProjects/mqtt-dmx-sequencer/example-sequences.json"]
  -u, --url        mqtt broker url. See
                   https://github.com/mqttjs/MQTT.js#connect-using-a-url
                                                   [default: "mqtt://127.0.0.1"]
  -h, --help       Show help                                           [boolean]
  --version        Show version number                                 [boolean]


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
