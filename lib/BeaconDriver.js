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
     * init the driver
     */
    onInit() {
        this._synchroniseSensorData();
    }

    /**
     * @private
     *
     * start the synchronisation
     */
    _synchroniseSensorData() {
        let devices = this.getDevices();
        if (devices.length === 0) {
            this._setNewTimeout();
        }
        else {
            let updateDevicesTime = new Date();
            this._updateDevices(devices)
                .then(devices => {
                    console.log('All devices are synced complete in: ' + (new Date() - updateDevicesTime) / 1000 + ' seconds');
                    this._setNewTimeout();
                })
                .catch(error => {
                    this._setNewTimeout();
                    throw new Error(error);
                });
        }
    }

    /**
     * update the devices one by one
     *
     * @param devices <BeaconDevice>[]
     * @returns {Promise.<BeaconDevice[]>}
     */
    _updateDevices(devices) {
        return devices.reduce((promise, device) => {
            return promise
                .then(() => {
                    device.retry = 0;
                    return this._updateDevice(device);
                }).catch(error => {
                    console.log(error);
                });
        }, Promise.resolve());
    }

    /**
     * update the devices one by one
     *
     * @param device <BeaconDevice>
     * @returns {Promise.<BeaconDevice>}
     */
    _updateDevice(device) {
        return this._handleUpdateSequence(device).then((response) => {
            console.log(response);
        }).catch(error => {
            console.log(error);
        });
    }

    /**
     * connect to the sensor, update data and disconnect
     *
     * @param device <BeaconDevice>
     * @returns {Promise.<BeaconDevice>}
     */
    _handleUpdateSequence(device) {
        return new Promise((resolve, reject) => {
            Homey.app.discover(device)
                .then((device) => {
                    resolve('Device: ' + device.getName() + ' found, set detected!');
                    device.setDetect();
                })
                .catch(error => {
                    resolve('Device: ' + device.getName() + ' not found, set undetect!');
                    device.setUndetect();
                    resolve(error);
                });
        });
    }

    /**
     * @private
     *
     * set a new timeout for synchronisation
     */
    _setNewTimeout() {

        let interval = 1000 * 60;

        this._syncTimeout = setTimeout(this._synchroniseSensorData.bind(this), interval);
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
                reject('Cannot get devices:' + error);
            });
    }
}

module.exports = BeaconDriver;