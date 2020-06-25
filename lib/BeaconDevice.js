'use strict';

const Homey = require('homey');
const BeaconAdvertisement = require('../../lib/BeaconAdvertisement.js');


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

    /**
     * Update capability values, setting (info) values and store values using
       data contained in beacon advertisement.
     */
    update(beaconAdv) {
        // This advertisement does contain an identifying frame.
        let beaconAdvertisedName;
        if (beaconAdv.name !== undefined) {
            beaconAdvertisedName = beaconAdv.name;
        }
        else {
            // The device store never contains an undefined value; before
            //  comparing current value with store value convert unassigned
            //  to null.
            beaconAdvertisedName = null;
        }
        if (this.getStoreValue('advertised_name_') != beaconAdvertisedName) {
            this.setStoreValue("advertised_name_", beaconAdvvertisedName)
                .catch(this.error);
            this.setSettings({
                "advertised_name": beaconAdv.advertisedNameToString(),
            })
                .catch(this.error);
        }
        let beaconCalibratedPower;
        if (beaconAdv.calibratedPower !== undefined)
            beaconCalibratedPower = beaconAdv.calibratedPower;
        else
            // The device store never contains an undefined value; before
            //  comparing current value with store value convert unassigned
            //  to null.
            beaconCalibratedPower = null;
        if (this.getStoreValue('calibrated_power_') != beaconCalibratedPower) {
            this.setStoreValue("calibrated_power_", beaconCalibratedPower)
                .catch(this.error);
            this.setSettings({
                "calibrated_power": beaconAdv.calibratedPowerToString(),
            })
                .catch(this.error);
        }
        if (this.hasCapability("signal_strength")) {
            if (this.getCapabilityValue("signal_strength") != beaconAdv.rssi) {
                this.setCapabilityValue("signal_strength", beaconAdv.rssi)
                    .catch(this.error);
            }
        }
        if (this.hasCapability("homey_distance")) {
            let newDistance = getDistance(beaconAdv.calibratedPower, beaconAdv.rssi);
            if (this.getCapabilityValue("homey_distance") != newDistance) {
                this.setCapabilityValue("homey_distance", newDistance)
                    .catch(this.error);
            }

        }
    }
}

module.exports = BeaconDevice;
