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

        this._synchroniseSensorData();
    }

    /**
     * @private
     *
     * set a new timeout for synchronisation
     */
    _setNewTimeout() {
        setTimeout(this._synchroniseSensorData.bind(this), 1000 * 5);
    }

    /**
     * @private
     *
     * handle beacon matches
     */
    _synchroniseSensorData() {
        Homey.app.log('New sequence --------------------------------------------------------------------------------');
        try {
            let devices = this.getDevices();
            if (devices.length === 0) {
                this._setNewTimeout();
            }
            else {
                let updateDevicesTime = new Date();
                this._updateBeacons(devices)
                    .then(() => {
                        Homey.app.log('Sequence complete ---------------------------------------------------------------------------');
                        Homey.app.log('All devices are synced complete in: ' + (new Date() - updateDevicesTime) / 1000 + ' seconds');
                        this._setNewTimeout();
                    })
                    .catch((error) => {
                        Homey.app.log('error 1: ' + error.message);
                        this._setNewTimeout();
                    });
            }
        }
        catch (error) {
            Homey.app.log('error 2: ' + error.message);
            this._setNewTimeout();
        }
    }

    /**
     * update the devices one by one
     *
     * @param beacons BeaconDevice[]
     *
     * @returns {Promise.<BeaconDevice[]>}
     */
    _updateBeacons(beacons) {
        return beacons.reduce((promise, beacon) => {
            return promise
                .then(() => {
                    return this._updateBeacon(beacon);
                }).catch(error => {
                    Homey.app.log('error 3: ' + error.message);
                    throw new Error(error);
                });
        }, Promise.resolve());

        // not in sequence
        /**
         const driver = this;
         const promises = [];
         beacons.forEach(function (beacon) {
            promises.push(driver._updateBeacon(beacon));
        });

         return Promise.all(promises).catch(error => {
            throw new Error(error);
        });
         **/
    }

    /**
     * update the devices one by one
     *
     * @param beacon
     *
     * @returns {Promise.<device>}
     */
    _updateBeacon(beacon) {
        const timeout = 1;
        return new Promise((resolve, reject) => {
            Homey.ManagerBLE.find(beacon.getData().uuid, timeout * 1000).then(function (advertisement) {
                if (!advertisement) {
                    beacon.setUndetect();
                    reject('advertisement not found');
                }
                advertisement.connect((error, peripheral) => {
                    if (error) {
                        beacon.setUndetect();

                        resolve(beacon);
                    }
                    else {
                        beacon.setDetect();

                        resolve(beacon);
                    }

                    if (peripheral) {
                        peripheral.disconnect();
                    }
                });
            }).catch(error => {
                if(error.message !== 'No device with that uuid found') {
                    // log other errors if not found
                    Homey.app.log('error 4: ' + error.message);
                }
                beacon.setUndetect();

                resolve(beacon);
            });
        })
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