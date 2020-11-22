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
        Homey.on('update.beacon.status', function (beacons) {
            for (const device of driver.getDevices()) {

                // set available, it is possibly marked unavailable in v1.2.7
                device.setAvailable();

                // if never detected yet, set detected but don't trigger flow
                if (device.getCapabilityValue("detect") === null) {
                    device.setCapabilityValue("detect", true);
                }

                // The advertisements list contains an advertisement for a specific device.
                if (beacons.find(beacon => beacon.key === device.getIdentificationSignature())) {
                    Homey.app.log(device.getName() + '[✓]');
                    device.setDetect();
                } else {
                    Homey.app.log(device.getName() + '[x]');
                    device.setUndetect();
                }
            }
        });

        Homey.app.sendLog();
    }


    /**
     * New method for building the list of devices for pairing to Homey.
     * Compared to onPairListDevices() this method allows you customize
     * the views of the pairing process (in might be useful in future
     * versions).
     *
     * @param socket
     */
    async onPair(socket) {
        Homey.app.pairing = true;
        socket.on('list_devices', async (data, callback) => {
            await Homey.app._searchDevices(this)
                .then(devices => {
                    Homey.app.pairing = false;
                    callback(null, devices);
                })
                .catch(error => {
                    Homey.app.pairing = false;
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
            Homey.app._searchDevices(this)
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
}

module.exports = BeaconDriver;
