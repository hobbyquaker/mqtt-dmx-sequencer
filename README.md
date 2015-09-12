# mqtt-dmx-sequencer

Control DMX devices via Art-Net by MQTT

Contains a simple sequencer. Multiple scene-transitions and sequences can run simultaneously, but on one channel there
can run only one transition at a time.

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


## License

MIT

Copyright (c) 2015 Sebastian 'hobbyquaker' Raff <hq@ccu.io>
