"use strict";


const Homey = require('homey');
const BeaconAdvertisement = require('../../lib/BeaconAdvertisement.js');


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
     * on init the driver.
     */
    onInit() {
        console.log('Beacon driver ' + this.getBleName() + ' is running...');

        // on discovery
        const driver = this;
        Homey.on('beacon.devices', function (advertisements) {

            let advertisementUuids = [];
            let beaconAdvs = [];
            advertisements.forEach(advertisement => {
                advertisementUuids.push(advertisement.uuid);
                beaconAdvs.push(new BeaconAdvertisement(advertisement));
            });

            driver.getDevices().forEach(function (device) {

                // set available, it is possibly marked unavailable in v1.2.7
                // @deprecated
                device.setAvailable();

                // if never detected yet, set detected but don't trigger flow
                if (device.getCapabilityValue("detect") === null) {
                    device.setCapabilityValue("detect", true);
                }
                // New way for deciding whether the advertisements list contains
                //  an advertisement for a specific device.
                const found = driver.isDeviceInAdvertisements(device, beaconAdvs);
//                const found = (advertisementUuids.indexOf(device.getData().uuid) !== -1);
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
     * New method for building the list of devices for pairing to Homey.
     * Compared to onPairListDevices() this method allows you customize 
     * the views of the pairing process (in might be useful in future
     * versions).
     *
     * @param socket
     */
    onPair(socket) {
        console.log('onPair');
        socket.on('list_devices', async (data, callback) => {
            let devices = [];
            Homey.app.discoverDevices(this)
                .then(devices => {
                    callback(null, devices);
                })
                .catch(error => {
                    callback(new Error('Cannot get devices:' + error));
                });
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


    /**
     *  New method that determines if a beacon advertisement is related to a 
     *  device defined in Homey. It also update the device capability values,
     *  the device setting (info) values, the device store values.
     */
    isDeviceInAdvertisements(device, beaconAdvs) {
        for (let i = 0; i < beaconAdvs.length; i++) {
            let beaconAdv = beaconAdvs[i];
            if (this.getDevice(beaconAdv.key) == device) {
                device.update(beaconAdv);
                return true;
            }
        }
        return false;
    }
}

module.exports = BeaconDriver;
