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
     * Update capability values, setting (info) values and store values using
       data contained in beacon advertisement.
     */
    update(beaconAdv) {
        //// This advertisement does contain an identifying frame.
        //let beaconAdvertisedName;
        //if (beaconAdv.name !== undefined) {
        //    beaconAdvertisedName = beaconAdv.name;
        //}
        //else {
        //    // The device store never contains an undefined value; before
        //    //  comparing current value with store value convert unassigned
        //    //  to null.
        //    beaconAdvertisedName = null;
        //}
        //if (this.getStoreValue('advertised_name_') != beaconAdvertisedName) {
        //    this.setStoreValue("advertised_name_", beaconAdvertisedName)
        //        .catch(this.error);
        //    this.setSettings({
        //        "advertised_name": beaconAdv.advertisedNameToString(),
        //    })
        //        .catch(this.error);
        //}
        //let beaconCalibratedPower;
        //if (beaconAdv.calibratedPower !== undefined)
        //    beaconCalibratedPower = beaconAdv.calibratedPower;
        //else
        //    // The device store never contains an undefined value; before
        //    //  comparing current value with store value convert unassigned
        //    //  to null.
        //    beaconCalibratedPower = null;
        //if (this.getStoreValue('calibrated_power_') != beaconCalibratedPower) {
        //    this.setStoreValue("calibrated_power_", beaconCalibratedPower)
        //        .catch(this.error);
        //    this.setSettings({
        //        "calibrated_power": beaconAdv.calibratedPowerToString(),
        //    })
        //        .catch(this.error);
        //}
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
        if (beaconAdv.batteryLevel !== undefined) {
            if (this.hasCapability("measure_battery")) {
                this.setCapabilityValue("measure_battery", beaconAdv.batteryLevel);
            }
        }
        let energyObj = this.getStoreValue("energy");
        if (energyObj) {
            this.unsetStoreValue("energy");
            this.setEnergy(energyObj);
        }
    }

    refreshSettings(devToBeRefreshed) {
        let refreshed = false;
        if (this.getSetting("address") != devToBeRefreshed.settings.address) {
            this.setSetting("address", devToBeRefreshed.settings.address)
                .catch(this.error);
            refreshed = true;
        }

        let newAdvertisedName = null;
        if (devToBeRefreshed.store.advertised_name_ !== undefined) {
            newAdvertisedName = devToBeRefreshed.store.advertised_name_;
        }
        if (this.getStoreValue('advertised_name_') != newAdvertisedName) {
            this.setStoreValue("advertised_name_", newAdvertisedName)
                .catch(this.error);
            this.setSettings({
                "advertised_name": devToBeRefreshed.settings.advertised_name,
            })
                .catch(this.error);
        }

        let newCalibratedPower = null;
        if (devToBeRefreshed.store.calibrated_power_ !== undefined)
            newCalibratedPower = devToBeRefreshed.store.calibrated_power_;
        if (this.getStoreValue('calibrated_power_') != newCalibratedPower) {
            this.setStoreValue("calibrated_power_", newCalibratedPower)
                .catch(this.error);
            this.setSettings({
                "calibrated_power": devToBeRefreshed.settings.calibrated_power,
            })
                .catch(this.error);
        }

        let newEnergy = {};
        if (devToBeRefreshed.store.energy !== undefined) {
            newEnergy = devToBeRefreshed.store.energy;
        }
        if (JSON.stringify(this.getEnergy()) !== JSON.stringify(newEnergy)) {
            this.setEnergy(newEnergy)
                .catch (this.error);
            refreshed = true;
        }
        let currCaps = this.getCapabilities();
        let newCaps = devToBeRefreshed.capabilities;
        console.log(currCaps);
        console.log(newCaps);
        let addedCaps = [];
        let removedCaps = [];
        let checkElems = [];
        checkElems.length = newCaps.length;
        for (let j = 0; j < newCaps.length; j++) {
            checkElems[j] = {
                i: newCaps[j],
                IsNew: true
            };
        }
        for (let i = 0; i < currCaps.length; i++) {
            let toBeRemoved = true;
            for (let j = 0; j < newCaps.length; j++) {
                if (currCaps[i] == newCaps[j] && checkElems[j].IsNew) {
                    checkElems[j].IsNew = false;
                    toBeRemoved = false;
                    break;
                }
            }
            if (toBeRemoved)
                removedCaps.push(currCaps[i]);
        }
        for (let j = 0; j < checkElems.length; j++) {
            if (checkElems[j].IsNew)
                addedCaps.push(checkElems[j].i);
        }
        if (addedCaps.Length > 0 || addedCaps.Length > 0) {
            refreshed = true;
        }
        return {
            actuallyRefreshed: refreshed
        };
    }
}

module.exports = BeaconDevice;
