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
        console.log('Beacon driver ' + this.getBleName() + ' is running...');

        // on discovery
        const driver = this;
        Homey.on('beacon.devices', function (advertisements) {

            let advertisementUuids = [];
            advertisements.forEach(advertisement => {
                advertisementUuids.push(advertisement.uuid);
            });

            driver.getDevices().forEach(function (device) {

                // set available, it is possibly marked unavailable in v1.2.7
                // @deprecated
                device.setAvailable();

                // if never detected yet, set detected but don't trigger flow
                if (device.getCapabilityValue("detect") === null) {
                    device.setCapabilityValue("detect", true);
                }

                const found = (advertisementUuids.indexOf(device.getData().uuid) !== -1);
                if (found) {
                    Homey.app.log( device.getName() + '[✓]');
                    device.setDetect();
                }
                else {
                    Homey.app.log( device.getName() + '[x]');
                    device.setUndetect();
                }
            })

            Homey.app.sendLog();
        });
    }

    /**
     * render a list of devices for pairing to homey
     *
     * @param data
     * @param callback
     */
    onPairListDevices(data, callback) {
        console.log('onPairListDevices');
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
