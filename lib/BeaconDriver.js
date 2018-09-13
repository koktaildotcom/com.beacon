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
        return new Promise((resolve, reject) => {
            console.log('update device ' + device.getName());
            try {
                this._handleUpdateSequence(device)
                    .then(device => {
                        // device.retry = 0;
                        resolve(device);
                    })
                    .catch(error => {
                        // device.retry++;
                        // console.log('retry ' + device.retry);
                        // console.log(error);
                        //
                        // if (device.retry < MAX_RETRIES) {
                        //     resolve(this._updateDevice(device));
                        // }

                        reject('Max retries exceeded, no success');
                    });
            }
            catch (error) {
                reject(error);
            }
        })
    }

    /**
     * connect to the sensor, update data and disconnect
     *
     * @param device <BeaconDevice>
     * @returns {Promise.<BeaconDevice>}
     */
    _handleUpdateSequence(device) {
        return new Promise((resolve, reject) => {
            let updateDeviceTime = new Date();

            Homey.app.discover(device)
                .then((device) => {
                    return Homey.app.connect(device);
                })
                .catch(error => {
                    reject(error);
                })
                .then((device) => {
                    console.log('Found!');

                    device.setCapabilityValue("detect", true);

                    return device;
                })
                .catch(error => {
                    console.log('Not found!');

                    device.setCapabilityValue("detect", false);

                    Homey.app.disconnect(device)
                        .catch(error => {
                            reject(error);
                        });

                    reject(error);
                })
                .then((device) => {
                    console.log('Device sync complete in: ' + (new Date() - updateDeviceTime) / 1000 + ' seconds');

                    Homey.app.disconnect(device)
                        .catch(error => {
                            reject(error);
                        });

                    resolve(device);
                })
                .catch(error => {
                    reject(error);
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