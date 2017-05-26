var util = require('util');
var EventEmitter = require('events').EventEmitter;

var IntSequencer = function (config) {
    if (!(this instanceof IntSequencer)) {
        return new IntSequencer(config);
    }

    var that = this;

    var async = require('async');

    var ticksPerSecond = 25;

    var transitions = {};

    function transitionTick() {
        var data = [];
        var finished;
        var callbacks = [];

        Object.keys(transitions).forEach(function (channel) {
            transitions[channel].val += transitions[channel].step;

            if (transitions[channel].step > 0) {
                finished = transitions[channel].val >= transitions[channel].finish;
            } else {
                finished = transitions[channel].val <= transitions[channel].finish;
            }

            if (finished) {
                data[channel] = transitions[channel].finish;
                if (typeof transitions[channel].callback === 'function') {
                    callbacks.push(transitions[channel].callback);
                }
                delete transitions[channel];
            } else {
                data[channel] = Math.round(transitions[channel].val);
            }
        });

        if (data.length > 0) {
            config.setter(data);
        }

        callbacks.forEach(function (cb) {
            cb(null, null);
        });
    }

    setInterval(transitionTick, 1000 / ticksPerSecond);

    this.setScene = function (args, callback) {
        var scene = config.scenes[args[0]];
        var transition = args[1];
        var tmp = [];
        if (transition) {
            scene.forEach(function (finish, ch) {
                if (finish !== null && finish !== undefined) {
                    tmp.push([ch, finish, transition]);
                }
            });
            async.each(tmp, startTransition, callback);
        } else {
            config.setter(scene);
            if (typeof callback === 'function') {
                callback();
            }
        }

        function startTransition(args, callback) {
            var ch = args[0];
            var finish = args[1];
            var transition = args[2];

            transition = parseFloat(transition) || 1;
            var start = (config.data && config.data[ch]) || 0;

            var step = (finish - start) / ticksPerSecond / transition;
            if (transitions[ch]) {
                that.emit('transition-conflict', ch);
                if (typeof callback === 'function') {
                    callback();
                }
            } else {
                transitions[ch] = {val: start, step: step, finish: finish, callback: callback};
            }
        }
    };

    // eslint-disable-next-line func-name-matching, max-params
    this.newSequence = function NewSequence(sequence, repeat, shuffle, speed, callback) {
        if (!(this instanceof NewSequence)) {
            return new NewSequence(sequence, repeat, shuffle, speed, callback);
        }

        var seq = config.sequences[sequence];

        if (!seq) {
            that.emit('sequence-missing', seq);
            return;
        }

        speed = speed || 1;
        repeat = repeat || 0;

        var pause = false;
        var step = -1;

        seqStep();

        function seqStep() {
            if (pause) {
                return;
            }

            var len = seq.length;
            step += 1;

            if (step >= len) {
                if (repeat) {
                    step = 0;
                } else {
                    if (typeof callback === 'function') {
                        callback(null, null);
                    }
                    return;
                }
            }

            var index;
            if (shuffle) {
                index = Math.floor(Math.random() * seq.length);
            } else {
                index = step;
            }
            var duration = (seq[index][2] * 1000 / speed) || 0;
            that.setScene([seq[index][0], (seq[index][1] / speed) || 0], function () {
                setTimeout(seqStep, duration);
            });
        }

        // Jumps to the end of the sequence, disables repeat and calls sequence callback
        this.stop = function () {
            step = seq.length;
            repeat = false;
        };

        this.pause = function () {
            pause = true;
        };

        this.resume = function () {
            pause = false;
            seqStep();
        };

        this.speed = function (s) {
            speed = s;
        };
        this.shuffle = function (s) {
            shuffle = s;
        };
        this.repeat = function (r) {
            repeat = r;
        };

        return this;
    };
};

util.inherits(IntSequencer, EventEmitter);

module.exports = IntSequencer;
