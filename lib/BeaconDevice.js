'use strict';

const Homey = require('homey');

class BeaconDevice extends Homey.Device {

    /**
     * on init the device
     */
    onInit() {
        console.log('Beacon device ' + this.getName() + ' is initiated...');

        this._registerCards();
    }

    setDetect() {
        console.log('Set detect ' + this.getName());

        this.setCapabilityValue("detect", true);

        this.beaconInsideRange.trigger({
            'device': this.getName(),
            'beacon': this.getName(),
            'value': true
        })
            .then(function () {
                console.log('Trigger beacon_inside_range success!');
            })
            .catch(function (error) {
                console.log('Cannot trigger flow card beacon_inside_range: %s.', error);
            });

        this.deviceBeaconInsideRange.trigger(this, {
            'beacon': this.getName(),
            'value': true
        })
            .then(function () {
                console.log('Trigger device_beacon_inside_range success!');
            })
            .catch(function (error) {
                console.log('Cannot trigger flow card device_beacon_inside_range: %s.', error);
            });
    }

    setUndetect() {
        console.log('Set undetect ' + this.getName());

        this.setCapabilityValue("detect", false);

        this.beaconOutsideRange.trigger({
            'device': this.getName(),
            'beacon': this.getName(),
            'value': true
        })
            .then(function () {
                console.log('Trigger beacon_outside_range success!');
            })
            .catch(function (error) {
                console.log('Cannot trigger flow card beacon_outside_range: %s.', error);
            });

        this.deviceBeaconOutsideRange.trigger(this, {
            'beacon': this.getName(),
            'value': true
        })
            .then(function () {
                console.log('Trigger device_beacon_outside_range success!');
            })
            .catch(function (error) {
                console.log('Cannot trigger flow card device_beacon_outside_range: %s.', error);
            });
    }

    _registerCards() {
        this.beaconInsideRange = new Homey.FlowCardTrigger('beacon_inside_range');
        this.beaconInsideRange.register();

        this.deviceBeaconInsideRange = new Homey.FlowCardTriggerDevice('device_beacon_inside_range');
        this.deviceBeaconInsideRange.register();

        this.beaconOutsideRange = new Homey.FlowCardTrigger('beacon_outside_range');
        this.beaconOutsideRange.register();

        this.deviceBeaconOutsideRange = new Homey.FlowCardTriggerDevice('device_beacon_outside_range');
        this.deviceBeaconOutsideRange.register();
    }
}

module.exports = BeaconDevice;