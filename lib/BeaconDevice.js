'use strict';

const Homey = require('homey');

class BeaconDevice extends Homey.Device {
    /**
     * on init the device
     */
    onInit() {
        this.beaconInsideRange = new Homey.FlowCardTrigger('beacon_inside_range');
        this.beaconInsideRange.register();

        this.deviceBeaconInsideRange = new Homey.FlowCardTriggerDevice('device_beacon_inside_range');
        this.deviceBeaconInsideRange.register();

        this.beaconOutsideRange = new Homey.FlowCardTrigger('beacon_outside_range');
        this.beaconOutsideRange.register();

        this.deviceBeaconOutsideRange = new Homey.FlowCardTriggerDevice('device_beacon_outside_range');
        this.deviceBeaconOutsideRange.register();
    }

    setDetect() {
        this.setCapabilityValue("detect", true);

        this.beaconInsideRange.trigger({
            'sensor': this.getName(),
            'value': true
        })
            .catch(function (error) {
                console.error('Cannot trigger flow card beacon_inside_range: %s.', error);
            });

        this.deviceBeaconInsideRange.trigger(this, {
            'sensor': this.getName(),
            'value': true
        })
            .catch(function (error) {
                console.error('Cannot trigger flow card device_beacon_inside_range: %s.', error);
            });
    }

    setUndetect() {
        this.setCapabilityValue("detect", false);

        this.beaconOutsideRange.trigger({
            'sensor': this.getName(),
            'value': true
        })
            .catch(function (error) {
                console.error('Cannot trigger flow card beacon_inside_range: %s.', error);
            });

        this.deviceBeaconOutsideRange.trigger(this, {
            'sensor': this.getName(),
            'value': true
        })
            .catch(function (error) {
                console.error('Cannot trigger flow card device_beacon_inside_range: %s.', error);
            });
    }
}

module.exports = BeaconDevice;