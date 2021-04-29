'use strict';

const Homey = require('homey');

class BeaconDevice extends Homey.Device {

    /**
     * on init the device
     */
    onInit() {
        console.log('Beacon device ' + this.getName() + ' is initiated...');
        this.changeDetected = 0;
    }

    /**
     * Return true if the BLE advertisement discovered by Homey matches the device.
     * @abstract
     * @param {BleAdvertisement} advertisement
     * @returns {boolean}
     */
    matchAdvertisement(advertisement) {
        throw new Error('todo: Implement `matchAdvertisement` into child class');
    }

    /**
      * @typedef {object} BeaconAdv
      * @property {number} rssi
      * @property {number} homeyDistance
      * @property {number} batteryLevel
      * /

   /**
     * Parse the BLE advertisement discovered by Homey and return an object that
     *  will be subsequently used for updating the device capability values (see
     *  updateCapabilityValues method). This method can be overridden in child
     *  classes.
     * @param {BleAdvertisement} advertisement
     * @returns {BeaconAdv}
     */
    parseAdvertisement(advertisement) {
        let currBatteryLevel = null;
        if (advertisement.serviceData !== undefined) {
            for (const serviceDatum of advertisement.serviceData) {
                // The UUID 0x180F indicates the battery service.
                // Reference: https://www.bluetooth.com/specifications/gatt/services/
                if (serviceDatum.uuid == '180f') {
                    // Battery level as a percentage from 0% to 100%; 0%
                    // represents a battery that is fully discharged, 100%
                    // represents a battery that is fully charged.
                    currBatteryLevel = serviceDatum.data[0];
                }
            }
        }
        // The Minew devices (whose public MAC address starts with AC:23:3F) can
        //  send battery level percentage within a service. The service UUID is
        //  0xFFE1 which is proprietary (it does not appear to be a member
        //  service of the Bluetooth SIG).
        if (advertisement.address.startsWith('ac:23:3f')) {
            if (advertisement.serviceData !== undefined) {
                for (const serviceDatum of advertisement.serviceData) {
                    if (serviceDatum.uuid == 'ffe1') {
                        if (serviceDatum.data[0] = 0xa1) {
                            currBatteryLevel = serviceDatum.data[2];
                        }
                    }
                }
            }
        }
        return {
            rssi: advertisement.rssi,
            homeyDistance: null,
            batteryLevel: currBatteryLevel
        }
    }

    /**
     *  Set detect
     */
    setDetect() {
        if (this.getCapabilityValue("detect") === false) {

            this.changeDetected++;
            this.log('beacon:' + this.getName() + " changed detect inside: " + this.changeDetected);

            if (this.changeDetected >= this.homey.settings.get('verificationAmountInside')) {
                this.setCapabilityValue("detect", true);

                this.homey.app.beaconInsideRange.trigger({
                    'device': this.getName(),
                    'beacon': this.getName()
                })
                    .then(() => {
                        this.log('Done trigger flow card beacon_inside_range');
                    })
                    .catch(error => {
                        this.log('Cannot trigger flow card beacon_inside_range: ' + error);
                    });

                this.homey.app.deviceBeaconInsideRange.trigger(this, {
                    'beacon': this.getName()
                })
                    .then(() => {
                        this.log('Done trigger flow card device_beacon_inside_range');
                    })
                    .catch(error => {
                        this.log('Cannot trigger flow card device_beacon_inside_range: ' + error);
                    });

                this.homey.app.beaconStateChanged.trigger({
                    'device': this.getName(),
                    'beacon': this.getName(),
                    'detected': true
                })
                    .then(() => {
                        this.log('Done trigger flow card beacon_state_changed');
                    })
                    .catch(error => {
                        this.log('Cannot trigger flow card beacon_state_changed: ' + error);
                    });

                this.homey.app.deviceBeaconStateChanged.trigger(this, {
                    'beacon': this.getName(),
                    'detected': true
                })
                    .then(() => {
                        this.log('Done trigger flow card device_beacon_state_changed');
                    })
                    .catch(error => {
                        this.log('Cannot trigger flow card device_beacon_state_changed: ' + error);
                    });
            }
        } else {
            this.changeDetected = 0;
        }
    }

    /**
     *  Set undetected
     */
    setUndetect() {
        if (this.getCapabilityValue("detect") === true) {

            this.changeDetected++;
            this.log('beacon:' + this.getName() + " changed detect outside: " + this.changeDetected);

            if (this.changeDetected >= this.homey.settings.get('verificationAmountOutside')) {
                this.setCapabilityValue("detect", false);

                this.homey.app.beaconOutsideRange.trigger({
                    'device': this.getName(),
                    'beacon': this.getName()
                })
                    .then(() => {
                        this.log('Done trigger flow card beacon_outside_range');
                    })
                    .catch(error => {
                        this.log('Cannot trigger flow card beacon_outside_range: ' + error);
                    });

                this.homey.app.deviceBeaconOutsideRange.trigger(this, {
                    'beacon': this.getName()
                })
                    .then(() => {
                        this.log('Done trigger flow card device_beacon_outside_range');
                    })
                    .catch(error => {
                        this.log('Cannot trigger flow card device_beacon_outside_range: ' + error);
                    });

                this.homey.app.beaconStateChanged.trigger({
                    'device': this.getName(),
                    'beacon': this.getName(),
                    'detected': false
                })
                    .then(() => {
                        this.log('Done trigger flow card beacon_state_changed');
                    })
                    .catch(error => {
                        this.log('Cannot trigger flow card beacon_state_changed: ' + error);
                    });

                this.homey.app.deviceBeaconStateChanged.trigger(this, {
                    'beacon': this.getName(),
                    'detected': false
                })
                    .then(() => {
                        this.log('Done trigger flow card device_beacon_state_changed');
                    })
                    .catch(error => {
                        this.log('Cannot trigger flow card device_beacon_state_changed: ' + error);
                    });
            }
        } else {
            this.changeDetected = 0;
        }
    }

    /**
     * Update capability values using data contained in beacon advertisement.
     * NOTE: Homey does not allow yet to set Energy object during pairing
     * procedure (see https://apps.developer.athom.com/tutorial-Drivers-Pairing.html,
     * example, "/drivers/<driver_id>/driver.js").
     * In order to set the Energy object, an object that contains energy info
     * may have been previously saved into a (temporary) store whose Id is
     * "energy". If the "energy" store exists, this method saves its value into
     * the Energy object of the device and unset (removes) the "energy" store.
     */
    updateCapabilityValues(beacon) {
        if (false === this.hasCapability("signal_strength")) {
                this.addCapability("signal_strength")
        }
        if (beacon.rssi != null) {
            if (this.hasCapability("signal_strength")) {
                if (this.getCapabilityValue("signal_strength") !== beacon.rssi) {
                    this.setCapabilityValue("signal_strength", beacon.rssi);
                }
            }
        }
        if (beacon.homeyDistance != null) {
            if (this.hasCapability("homey_distance")) {
                if (this.getCapabilityValue("homey_distance") !== beacon.homeyDistance) {
                    this.setCapabilityValue("homey_distance", beacon.homeyDistance);
                }
            }
        }
        if (beacon.batteryLevel != null) {
            if (this.hasCapability("measure_battery")) {
                if (this.getCapabilityValue("measure_battery") !== beacon.batteryLevel) {
                    this.setCapabilityValue("measure_battery", beacon.batteryLevel);
                }
            }
        }
        const energyObj = this.getStoreValue("energy");
        if (energyObj) {
            this.unsetStoreValue("energy");
            this.setEnergy(energyObj);
        }
    }

    /**
     * Refresh properties (properties are: Homey settings, Homey stores, Homey
     * capabilities and Homey energy) using info contained in metadata.
     * The method refesh capabilities as follows:
     * - update setting values;
     * - add and/or remove capabilities;
     * - update the energy object.
     * The method returns a boolean value that indicates whether at least a
     * property has been actually refreshed.
     */
    refreshProperties(metadata) {
        let actuallyRefreshed = false;
        if (this.getSetting("address") !== metadata.settings.address) {
            this.setSettings({
                "address": metadata.settings.address
            })
                .catch(this.error);
            actuallyRefreshed = true;
        }
        if (this.getSetting("advertised_name") !== metadata.settings.advertised_name) {
            this.setSettings({
                "advertised_name": metadata.settings.advertised_name
            })
                .catch(this.error);
            actuallyRefreshed = true;
        }
        if (this.getSetting("model") !== metadata.settings.model) {
            this.setSettings({
                "model": metadata.settings.model
            })
                .catch(this.error);
            actuallyRefreshed = true;
        }
        if (this.getSetting("manufacturer") !== metadata.settings.manufacturer) {
            this.setSettings({
                "manufacturer": metadata.settings.manufacturer
            })
                .catch(this.error);
            actuallyRefreshed = true;
        }
        let newEnergy = {};
        if (metadata.store.energy !== undefined) {
            newEnergy = metadata.store.energy;
        }
        if (JSON.stringify(this.getEnergy()) !== JSON.stringify(newEnergy)) {
            this.setEnergy(newEnergy)
                .catch(this.error);
            actuallyRefreshed = true;
        }
        const currCaps = this.getCapabilities();
        const newCaps = metadata.capabilities;
        let addedCaps = [];
        let removedCaps = [];
        let checkElems = [];
        checkElems.length = newCaps.length;
        for (let i = 0; i < newCaps.length; i++) {
            checkElems[i] = {
                cap: newCaps[i],
                isNew: true
            };
        }
        for (let currCap of currCaps) {
            let toBeRemoved = true;
            for (let i = 0; i < newCaps.length; i++) {
                if (currCap === newCaps[i] && checkElems[i].isNew) {
                    checkElems[i].isNew = false;
                    toBeRemoved = false;
                    break;
                }
            }
            if (toBeRemoved)
                removedCaps.push(currCap);
        }
        for (let checkElem of checkElems) {
            if (checkElem.isNew)
                addedCaps.push(checkElem.cap);
        }
        if (addedCaps.length > 0 || removedCaps.length > 0) {
            for (let removedCap of removedCaps) {
                this.removeCapability(removedCap)
                    .catch(this.error);
            }
            for (let addedCap of addedCaps) {
                this.addCapability(addedCap)
                    .catch(this.error);
            }
            actuallyRefreshed = true;
        }
        return actuallyRefreshed;
    }

}

module.exports = BeaconDevice;
