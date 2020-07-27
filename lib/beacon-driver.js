"use strict";

const Homey = require('homey');

class BeaconDriver extends Homey.Driver {

    /**
     * @abstract
     *
     * the name of the BLE for identification
     */
    getBleName() {
        throw new Error('todo: Implement `getBleName` into child class');
    }

    /**
     * @abstract
     *
     * The type of generic_beacon handled by this driver.
     */
    getBeaconType() {
        throw new Error('todo: Implement `getBeaconType` into child class');
    }

    /**
     * on init the driver.
     */
    onInit() {
        console.log('Beacon driver ' + this.getBleName() + ' is running...');

        // on discovery
        const driver = this;
        Homey.on('generic_beacon.devices', function (beacons) {
            driver.getDevices().forEach(function (device) {

                // set available, it is possibly marked unavailable in v1.2.7
                device.setAvailable();

                // if never detected yet, set detected but don't trigger flow
                if (device.getCapabilityValue("detect") === null) {
                    device.setCapabilityValue("detect", true);
                }

                // The advertisements list contains an advertisement for a specific device.
                if (driver.isDeviceInAdvertisements(device, beacons)) {
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
            Homey.app.discoverDevices(this)
                .then(devices => {
                    callback(null, devices);
                })
                .catch(error => {
                    callback(new Error('Cannot get devices:' + error));
                });
        });
    }

    onRepair(socket, device) {
        socket.on('query_curr_device', (data, callback) => {
            let beaconTypeAndDetails = {
                deviceName: device.getName(),
                typeName: device.getSetting('type_name'),
                frameDetail: device.getSetting('frame_detail')
            }
            callback(null, beaconTypeAndDetails);
        });

        socket.on('discover_and_refresh', (data, callback) => {
            Homey.app.discoverDevices(this)
                .then(pairObjects => {
                    let discovered = false;
                    for (let pairObject of pairObjects) {
                        if (this.getDevice(pairObject.data) === device) {
                            discovered = true;
                            callback(null, device.refreshProperties(pairObject));
                            break;
                        }
                    }
                    if (!discovered) {
                        callback(null, null);
                    }
                })
                .catch(error => {
                    callback(new Error('Cannot get devices:' + error));
                });
        });
    }

    /**
     *  New method that determines if there is a beacon advertisement that is
     *  related to a device defined in Homey. It also let the device update its
     *  capability values from info contained in the beacon advertisement.
     */
    isDeviceInAdvertisements(device, beacons) {
        for (let beacon of beacons) {
            if (this.getDevice(beacon.key) === device) {
                device.updateCapabilityValues(beacon);
                return true;
            }
        }
        return false;
    }
}

module.exports = BeaconDriver;
