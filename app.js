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
        this.log('Beacon app is running...');
        this._matchBeacons();
    }

    /**
     * @private
     *
     * set a new timeout for synchronisation
     */
    _setNewTimeout() {
        let interval = 1000 * 20;
        console.log('set timeout: %s', interval);
        this._syncTimeout = setTimeout(this._matchBeacons.bind(this), interval);
    }

    /**
     * @private
     *
     * handle beacon matches
     */
    _matchBeacons() {
        let updateDevicesTime = new Date();
        console.log("_matchBeacons");
        this._scanDevices()
            .then((foundDevices) => {
                console.log('Found %s devices', foundDevices.length);

                console.log('emit event beacon.devices');
                Homey.emit('beacon.devices', foundDevices);

                console.log('All devices are synced complete in: ' + (new Date() - updateDevicesTime) / 1000 + ' seconds');
                this._setNewTimeout();
            })
            .catch(error => {
                this._setNewTimeout();
                throw new Error(error);
            });
    }

    /**
     * discover advertisements
     *
     * @returns {Promise.<Array>}
     */
    _scanDevices() {
        console.log('_scanDevices');
        return new Promise((resolve, reject) => {

            /**
             * @param advertisements
             *
             * @returns {Promise.<Array>}
             */
            async function _extractAdvertisements(advertisements) {
                const foundDevices = [];
                advertisements.forEach(function (advertisement) {
                    console.log("find: %s with uuid %s", advertisement.localName, advertisement.uuid)
                    foundDevices.push(advertisement.uuid);
                });

                return foundDevices;
            }

            Homey.ManagerBLE.discover().then(function (advertisements) {
                console.log("discover ready");
                if (advertisements) {
                    resolve(_extractAdvertisements(advertisements));
                }
                else {
                    reject("Cannot find any advertisements");
                }
            }).catch(error => {
                reject(error);
            });
        });
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
                        reject("No devices found.");
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
}

module.exports = Beacon;