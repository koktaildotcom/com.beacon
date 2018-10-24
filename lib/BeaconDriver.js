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
     * on init the device
     */
    onInit() {
        Homey.app.log('Beacon driver ' + this.getBleName() + ' is running...');

        const driver = this;

        // if never detected yet, set detected but don't trigger flow
        driver.getDevices().forEach(function (device) {
            if (device.getCapabilityValue("detect") === null) {
                device.setCapabilityValue("detect", true);
            }
        });

        // on discovery
        Homey.on('beacon.devices', function (foundDevices) {
            Homey.app.log('catch event beacon.devices');
            driver.getDevices().forEach(function (device) {
                const found = (foundDevices.indexOf(device.getData().uuid) !== -1);
                if (device.getCapabilityValue("detect") !== found) {

                    if (!device.detectedChangeCount) {
                        device.detectedChangeCount = 0;
                    }

                    device.detectedChangeCount++;

                    Homey.app.log("change detected " +  device.detectedChangeCount);

                    if (2 === device.detectedChangeCount) {
                        device.detectedChangeCount = 0;
                        if (found) {
                            Homey.app.log('Device: CapabilityValue detect ' + device.getName() + ' found');
                            device.setDetect();
                        }
                        else {
                            Homey.app.log('Device: CapabilityValue detect ' + device.getName() + ' not found');
                            device.setUndetect();
                        }
                    }
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
                reject('Cannot get devices:' + error);
            });
    }
}

module.exports = BeaconDriver;