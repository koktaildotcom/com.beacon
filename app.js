'use strict';

const Homey = require('homey');

// make the BLE beta backwards compatible for 1.5.8 and maybe previous versions (not tested).
if (process.env.HOMEY_VERSION.replace(/\W/g, '') < 159) {
    Homey.BlePeripheral.prototype.disconnect = function disconnect(callback) {
        if (typeof callback === 'function')
            return Homey.util.callbackAfterPromise(this, this.disconnect, arguments);

        const disconnectPromise = new Promise((resolve, reject) => {
            this._disconnectQueue.push((err, result) => err ? reject(err) : resolve(result));
        });

        if (this._disconnectLockCounter === 0) {
            clearTimeout(this._disconnectTimeout);
            this._disconnectTimeout = setTimeout(() => {
                if (this._disconnectLockCounter === 0) {
                    this._disconnected();
                    // console.log('called disconnect', new Error().stack);
                    this.__client.emit('disconnect', [this._connectionId, this.uuid], err => {
                        this._connectionId = null;
                        this._disconnectQueue.forEach(cb => cb(err));
                        this._disconnectQueue.length = 0;
                    });
                }
            }, 100);
        }

        return disconnectPromise;
    };

    Homey.BlePeripheral.prototype.getService = async function getService(uuid, callback) {
        if (typeof callback === 'function')
            return Homey.util.callbackAfterPromise(this, this.getService, arguments);

        this.resetConnectionWarning();

        let service = Array.isArray(this.services) ? this.services.find(service => service.uuid === uuid) : null;

        if (!service) {
            const [discoveredService] = await this.discoverServices([uuid]);

            if (!discoveredService && !Array.isArray(this.services)) {
                return Promise.reject(new Error('Error, could not get services'));
            }
            service = discoveredService;
        }

        return service || Promise.reject(new Error(`No service found with UUID ${uuid}`));
    };
}

class Beacon extends Homey.App {

    onInit() {
        this.log('Beacon is running...');
    }

    /**
     * discover devices
     *
     * @param driver BeaconDriver
     * @returns {Promise.<object[]>}
     */
    discoverDevices(driver) {
        return new Promise((resolve, reject) => {
            try {
                this._searchDevices(driver).then((devices) => {
                    if (devices.length > 0) {
                        resolve(devices);
                    }
                    else {
                        new Promise(resolve => setTimeout(resolve, 1000)).then(() => {
                            this._searchDevices(driver).then((devices) => {
                                if (devices.length > 0) {
                                    resolve(devices);
                                }
                                else {
                                    reject("No devices found.");
                                }
                            });
                        });
                    }
                })
            } catch (exception) {
                reject(exception);
            }
        })
    }

    /**
     * discover devices
     *
     * @param driver BeaconDriver
     * @returns {Promise.<object[]>}
     */
    _searchDevices(driver) {
        return new Promise((resolve, reject) => {
            Homey.ManagerBLE.discover().then(function (advertisements) {
                let index = 0;
                let devices = [];
                advertisements.forEach(function (advertisement) {
                    console.log(advertisement);
                    if (advertisement.localName === driver.getBleIntentifier()) {
                        ++index;
                        devices.push({
                            "name": driver.getBleName() + " " + index,
                            "data": {
                                "id": advertisement.id,
                                "uuid": advertisement.uuid,
                                "address": advertisement.uuid,
                                "name": advertisement.name,
                                "type": advertisement.type,
                                "version": "v" + Homey.manifest.version,
                            },
                            "capabilities": ["detect"],
                        });
                    }
                });

                resolve(devices);
            })
                .catch(function (error) {
                    reject('Cannot discover BLE devices from the homey manager. ' + error);
                });
        })
    }


    /**
     * connect to advertisement and return peripheral
     *
     * @returns {Promise.<BeaconDevice>}
     */
    connect(device) {
        console.log('Connect');
        return new Promise((resolve, reject) => {

            device.advertisement.connect((error, peripheral) => {
                if (error) {
                    reject('failed connection to peripheral: ' + error);
                }
                else {
                    device.peripheral = peripheral;

                    resolve(device);
                }
            });
        })
    }

    /**
     * disconnect from peripheral
     *
     * @returns {Promise.<BeaconDevice>}
     */
    disconnect(device) {
        console.log('Disconnect');
        return new Promise((resolve, reject) => {

            if (device && device.peripheral) {
                device.peripheral.disconnect((error, peripheral) => {
                    if (error) {
                        reject('failed connection to peripheral: ' + error);
                    }
                    resolve(device);
                });
            }
            else {
                reject('cannot disconnect to unknown device or peripheral');
            }
        })
    }

    /**
     * discover advertisements
     *
     * @returns {Promise.<BeaconDevice>}
     */
    discover(device) {
        console.log('Discover');
        return new Promise((resolve, reject) => {
            if (device) {
                Homey.ManagerBLE.discover().then(function (advertisements) {
                    if (advertisements) {

                        let matchedAdvertisements = advertisements.filter(function (advertisement) {
                            return (advertisement.uuid === device.getData().address || advertisement.uuid === device.getData().address);
                        });

                        if (matchedAdvertisements.length === 1) {
                            device.advertisement = matchedAdvertisements[0];

                            resolve(device);
                        }
                        else {
                            reject("Cannot find advertisement with uuid " + device.getData().address);
                        }
                    }
                    else {
                        reject("Cannot find any advertisements");
                    }
                }).catch(error => {
                    reject(error);
                });
            }
            else {
                reject("No device found");
            }
        });
    }

    /**
     * render a list of devices for pairing to homey
     *
     * @param data
     * @param callback
     */
    onPairListDevices(data, callback) {
        Homey.app.discoverDevices(this)
            .then(devices => {
                callback(null, devices);
            })
            .catch(error => {
                reject('Cannot get devices:' + error);
            });
    }
}

module.exports = Beacon;