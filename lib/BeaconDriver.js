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

        // on discovery
        Homey.on('beacon.devices', function () {
            Homey.app.log('catch event beacon.devices');
            driver.getDevices().forEach(function (device) {
                // if never detected yet, set detected but don't trigger flow
                if (device.getCapabilityValue("detect") === null) {
                    device.setCapabilityValue("detect", true);
                }
                console.log('try to find ' + device.getName());
                Homey.ManagerBLE.find(device.getData().uuid).then(function (advertisement) {
                    if (advertisement) {
                        advertisement.connect((error, peripheral) => {
                            console.log(peripheral);
                            if (error) {
                                driver.undetect(device, error);
                            }

                            driver.detect(device);

                            peripheral.disconnect();
                        });
                    }
                }).catch(error => {
                    driver.undetect(device, error);
                });
            })
        });
    }

    detect(device) {
        Homey.app.log('Device: CapabilityValue detect ' + device.getName() + ' found');
        if (device.getCapabilityValue("detect") === false) {
            device.setDetect();
        }
    }

    undetect(device, reason) {
        Homey.app.log('Device: CapabilityValue not detect ' + device.getName() + ' not found: ' + reason);
        if (device.getCapabilityValue("detect") === true) {
            device.setUndetect();
        }
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