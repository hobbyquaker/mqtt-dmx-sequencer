var IntSequencer = function (config) {
    if (!(this instanceof  IntSequencer)) return new IntSequencer(config);

    var that = this;

    var async = require('async');
    
    var ticksPerSecond = 25;
    
    var transitions = {};

    function transitionTick() {
        var data = [];
        var finished;
        var callbacks = [];
        for (var channel in transitions) {
            transitions[channel].val = transitions[channel].val + transitions[channel].step;

            finished = transitions[channel].step > 0 ? (
                transitions[channel].val >= transitions[channel].finish
            ) : (
                transitions[channel].val <= transitions[channel].finish
            );

            if (!finished) {
                data[channel] = Math.round(transitions[channel].val);
            } else {
                data[channel] = transitions[channel].finish;
                if (typeof transitions[channel].callback === 'function') callbacks.push(transitions[channel].callback);
                delete transitions[channel];
            }
        }

        if (data.length) {
            config.setter(data);
        }

        callbacks.forEach(function (cb) {
            cb(null, null);
        });
    }

    setInterval(transitionTick, 1000 / ticksPerSecond);

    this.setScene = function setScene(args, callback) {
        var scene = config.scenes[args[0]];
        //console.log('setScene', args);
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
            if (typeof callback === 'function') callback();
        }

        function startTransition(args, callback) {
            var ch = args[0];
            var finish = args[1];
            var transition = args[2];

            transition = parseFloat(transition) || 1;
            var start = config.data && config.data[ch] || 0;
            //console.log('startTransition', ch, start, finish, transition);

            var step = (finish - start) / ticksPerSecond / transition;
            if (!transitions[ch]) {
                transitions[ch] = {val: start, step: step, finish: finish, callback: callback};
            } else {
                console.log('transition conflict', ch);
                callback();
            }
        }
    };

    this.newSequence = function newSequence(sequence, repeat, shuffle, speed, callback) {

        if (!(this instanceof newSequence)) {
            return new newSequence(sequence, repeat, shuffle, speed, callback);
        }

        var seq = config.sequences[sequence];

        if (!seq) {
            console.log('sequence missing', seq);
            return;
        }

        speed = speed || 1;
        repeat = repeat || 0;

        var pause = false;
        var step = -1;

        seqStep();

        function seqStep() {
            if (pause) return;

            var len = seq.length;
            step += 1;

            if (step >= len) {
                if (repeat) {
                    step = 0;
                } else {
                    if (typeof callback === 'function') callback(null, null);
                    return;
                }
            }

            var index;
            if (!shuffle) {
                index = step;
            } else {
                index = Math.floor(Math.random() * seq.length);
            }
            var duration = (seq[index][2] * 1000 / speed) || 0;
            that.setScene([seq[index][0], (seq[index][1] / speed) || 0], function () {
                setTimeout(seqStep, duration);
            });
        }

        /*
         jumps to the end of the sequence, disables repeat and calls sequence callback
         */
        this.stop = function seqStop() {
            step = seq.length;
            repeat = false;
        };

        this.pause = function seqPause() {
            pause = true;
        };

        this.resume = function seqResume() {
            pause = false;
            seqStep();
        };

        this.speed = function seqSpeed(s) {
            speed = s;
        };
        this.shuffle = function seqShuffle(s) {
            shuffle = s;
        };
        this.repeat = function seqRepeat(r) {
            repeat = r;
        };

        return this;
    }

};

module.exports = IntSequencer;
