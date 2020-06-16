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
     * on init the driver. Experimental: using the device availability along with
     * "detect" capability.
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
//                device.setAvailable();

                // if never detected yet, set detected but don't trigger flow
                if (device.getCapabilityValue("detect") === null) {
                    device.setCapabilityValue("detect", true);
                    device.setAvailable();
                }
                // New way for deciding whether the advertisements list contains
                //  an advertisement for a specific device.
                const found = device.foundInAdvertisements(driver, advertisements);
//                const found = (advertisementUuids.indexOf(device.getData().uuid) !== -1);
                if (found) {
                    Homey.app.log( device.getName() + '[✓]');
                    device.setDetect();
                    device.setAvailable();
                }
                else {
                    Homey.app.log( device.getName() + '[x]');
                    device.setUndetect();
                    device.setUnavailable();
                }
            })

            Homey.app.sendLog();
        });
    }

    /**
     * New method for building the list of devices for pairing to Homey. This
     * method replaces onPairListDevices(). It is very fast because it uses
     * the data already collected during periodical scanning (see the method
     * _discoverAdvertisements() in app.js).
     *
     * @param socket
     */
    onPair(socket) {
        console.log('onPair');
        socket.on('list_devices', async (data, callback) => {
            let devices = [];
            Homey.app._advertisements.forEach(function (beaconAdv) {
                devices.push(beaconAdv.deviceToBePaired());
            });
            callback(null, devices);
        });
    }
    /**
     * render a list of devices for pairing to homey
     *
     * @param data
     * @param callback
     */
    //onPairListDevices(data, callback) {
    //    console.log('onPairListDevices');
    //    Homey.app.discoverDevices(this)
    //        .then(devices => {
    //            callback(null, devices);
    //        })
    //        .catch(error => {
    //            callback(new Error('Cannot get devices:' + error));
    //        });
    //}
}

module.exports = BeaconDriver;
