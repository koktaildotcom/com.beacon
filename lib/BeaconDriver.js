"use strict";

const Homey = require('homey');

class BeaconDriver extends Homey.Driver {

    /**
     * @abstract
     *
     * the name of the BLE for identification
     */
    getBleName() {
        throw new Error('todo: Implement getBleName into child class');
    }

    /**
     * on init the driver
     */
    onInit() {
        Homey.app.log('Beacon driver ' + this.getBleName() + ' is running...');

        // on discovery
        const driver = this;
        Homey.on('beacon.devices', function (advertisements) {

            let advertisementUuids = [];
            Homey.app.log('found ' + advertisements.length + ' devices!');
            advertisements.forEach(advertisement => {
                Homey.app.log('found ble' + advertisement.uuid + ' ' + advertisement.localName);
                advertisementUuids.push(advertisement.uuid);
            });

            Homey.app.log('catch event ' + driver.getBleName() + ' beacon.devices');
            driver.getDevices().forEach(function (device) {
                // if never detected yet, set detected but don't trigger flow
                if (device.getCapabilityValue("detect") === null) {
                    device.setCapabilityValue("detect", true);
                }

                const found = (advertisementUuids.indexOf(device.getData().uuid) !== -1);
                if (found) {
                    Homey.app.log('[✓] beacon:' + device.getName());
                    device.setDetect();
                }
                else {
                    Homey.app.log('[x] beacon:' + device.getName());
                    device.setUndetect();
                }
            })
        });
    }

    /**
     * render a list of devices for pairing to homey
     *
     * @param data
     * @param callback
     */
    onPairListDevices(data, callback) {
        Homey.app.log('onPairListDevices');
        Homey.app.discoverDevices(this)
            .then(devices => {
                callback(null, devices);
            })
            .catch(error => {
                callback(new Error('Cannot get devices:' + error));
            });
    }
}

module.exports = BeaconDriver;