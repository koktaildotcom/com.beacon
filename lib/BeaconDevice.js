'use strict';

const Homey = require('homey');

class BeaconDevice extends Homey.Device {

    /**
     * on init the device
     */
    onInit() {
        Homey.app.log('Beacon device ' + this.getName() + ' is initiated...');
        this.changeDetected = 0;
    }

    /**
     *  Set detect
     */
    setDetect() {
        if (this.getCapabilityValue("detect") === false) {

            this.changeDetected++;
            Homey.app.log('beacon:' + this.getName() + " changed detect inside: " + this.changeDetected);

            if (this.changeDetected >= Homey.ManagerSettings.get('verificationAmountInside')) {
                this.setCapabilityValue("detect", true);

                Homey.app.beaconInsideRange.trigger({
                    'device': this.getName(),
                    'beacon': this.getName()
                })
                    .then(function () {
                        Homey.app.log('Done trigger flow card beacon_inside_range');
                    })
                    .catch(function (error) {
                        Homey.app.log('Cannot trigger flow card beacon_inside_range: ' + error);
                    });

                Homey.app.deviceBeaconInsideRange.trigger(this, {
                    'beacon': this.getName()
                })
                    .then(function () {
                        Homey.app.log('Done trigger flow card device_beacon_inside_range');
                    })
                    .catch(function (error) {
                        Homey.app.log('Cannot trigger flow card device_beacon_inside_range: ' + error);
                    });

                Homey.app.beaconStateChanged.trigger({
                    'device': this.getName(),
                    'beacon': this.getName(),
                    'detected': true
                })
                    .then(function () {
                        Homey.app.log('Done trigger flow card beacon_state_changed');
                    })
                    .catch(function (error) {
                        Homey.app.log('Cannot trigger flow card beacon_state_changed: ' + error);
                    });

                Homey.app.deviceBeaconStateChanged.trigger(this, {
                    'beacon': this.getName(),
                    'detected': true
                })
                    .then(function () {
                        Homey.app.log('Done trigger flow card device_beacon_state_changed');
                    })
                    .catch(function (error) {
                        Homey.app.log('Cannot trigger flow card device_beacon_state_changed: ' + error);
                    });
            }
        }
        else {
            this.changeDetected = 0;
        }
    }

    /**
     *  Set undetected
     */
    setUndetect() {
        if (this.getCapabilityValue("detect") === true) {

            this.changeDetected++;
            Homey.app.log('beacon:' + this.getName() + " changed detect outside: " + this.changeDetected);

            if (this.changeDetected >= Homey.ManagerSettings.get('verificationAmountOutside')) {
                this.setCapabilityValue("detect", false);

                Homey.app.beaconOutsideRange.trigger({
                    'device': this.getName(),
                    'beacon': this.getName()
                })
                    .then(function () {
                        Homey.app.log('Done trigger flow card beacon_outside_range');
                    })
                    .catch(function (error) {
                        Homey.app.log('Cannot trigger flow card beacon_outside_range: ' + error);
                    });

                Homey.app.deviceBeaconOutsideRange.trigger(this, {
                    'beacon': this.getName()
                })
                    .then(function () {
                        Homey.app.log('Done trigger flow card device_beacon_outside_range');
                    })
                    .catch(function (error) {
                        Homey.app.log('Cannot trigger flow card device_beacon_outside_range: ' + error);
                    });

                Homey.app.beaconStateChanged.trigger({
                    'device': this.getName(),
                    'beacon': this.getName(),
                    'detected': false
                })
                    .then(function () {
                        Homey.app.log('Done trigger flow card beacon_state_changed');
                    })
                    .catch(function (error) {
                        Homey.app.log('Cannot trigger flow card beacon_state_changed: ' + error);
                    });

                Homey.app.deviceBeaconStateChanged.trigger(this, {
                    'beacon': this.getName(),
                    'detected': false
                })
                    .then(function () {
                        Homey.app.log('Done trigger flow card device_beacon_state_changed');
                    })
                    .catch(function (error) {
                        Homey.app.log('Cannot trigger flow card device_beacon_state_changed: ' + error);
                    });
            }
        }
        else {
            this.changeDetected = 0;
        }
    }
}

module.exports = BeaconDevice;
