'use strict';

const Homey = require('homey');
const BeaconAdvertisement = require('../../lib/BeaconAdvertisement.js');


// This function estimates the distance between a beacon and Homey. It is based
// on the ratio of the beacon signal strength(rssi) over the calibrated
// transmitter power. 
function getDistance(calibratedPower, rssi) {
    var ratio_db = calibratedPower - rssi;
    var ratio_linear = Math.pow(10, ratio_db / 10);
    var r = Math.sqrt(ratio_linear);
    return r;
}


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
     *  New method that determines if a beacon advertisement is related to a 
     *  device defined in Homey. It also update capability values, setting
     *  (info) values and store values.
     */
    foundInAdvertisements(driver, advertisements) {
        for (let i = 0; i < advertisements.length; i++) {
            let beaconAdv = new BeaconAdvertisement(advertisements[i]);
            if (driver.getDevice(beaconAdv.key) == this) {
                // This advertisement does contain an identifying frame.
                let beaconAdvertisedName;
                if (beaconAdv.name !== undefined)
                    beaconAdvertisedName = beaconAdv.name;
                else
                    // The device store never contains an undefined value; before
                    //  comparing current value with store value convert unassigned
                    //  to null.
                    beaconAdvertisedName = null;
                if (this.getStoreValue('advertisedName_') != beaconAdvertisedName) {
                    this.setStoreValue("advertisedName_", beaconAdvvertisedName)
                        .catch(this.error);
                    this.setSettings({
                        "advertisedName": beaconAdv.advertisedNameToString(),
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
                if (this.getStoreValue('calibratedPower_') != beaconCalibratedPower) {
                    this.setStoreValue("calibratedPower_", beaconCalibratedPower)
                        .catch(this.error);
                    this.setSettings({
                        "calibratedPower": beaconAdv.calibratedPowerToString(),
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
                return true;
            }
        }
        return false;
    }
}

module.exports = BeaconDevice;
