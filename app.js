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
                    // Homey.app.log('called disconnect', new Error().stack);
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

    /**
     * on init the app
     */
    onInit() {
        Homey.app.log('Beacon app is running...');

        if (!Homey.ManagerSettings.get('updateInterval')) {
            Homey.ManagerSettings.set('updateInterval', 1)
        }

        if (!Homey.ManagerSettings.get('verificationAmountInside')) {
            Homey.ManagerSettings.set('verificationAmountInside', 0)
        }

        if (!Homey.ManagerSettings.get('verificationAmountOutside')) {
            Homey.ManagerSettings.set('verificationAmountOutside', 3)
        }

        this.beaconDiscovered = new Homey.FlowCardTrigger('beacon_discovered');
        this.beaconDiscovered.register();

        this._bleDevices = [];
        this._scanning();
    }

    /**
     * @private
     *
     * set a new timeout for synchronisation
     */
    _setNewTimeout() {
        setTimeout(this._scanning.bind(this), 1000 * Homey.ManagerSettings.get('updateInterval'));
    }

    /**
     * @private
     *
     * handle beacon matches
     */
    _scanning() {
        Homey.app.log('New sequence --------------------------------------------------------------------------------');
        try {
            let updateDevicesTime = new Date();
            this._updateDevices()
                .then((foundDevices) => {
                    Homey.emit('beacon.devices', foundDevices);
                    Homey.app.log('Sequence complete ---------------------------------------------------------------------------');
                    Homey.app.log('All devices are synced complete in: ' + (new Date() - updateDevicesTime) / 1000 + ' seconds');
                    this._setNewTimeout();
                })
                .catch((error) => {
                    Homey.app.log('error 1: ' + error.message);
                    this._setNewTimeout();
                });
        }
        catch (error) {
            Homey.app.log('error 2: ' + error.message);
            this._setNewTimeout();
        }
    }

    /**
     * discover beacons
     *
     * @returns {Promise.<BeaconDevice[]>}
     */
    _updateDevices() {
        const app = this;
        return new Promise((resolve, reject) => {
            Homey.ManagerBLE.discover([], 10000).then(function (advertisements) {
                app._advertisements = [];
                advertisements.forEach(advertisement => {
                    app._advertisements.push(advertisement);
                });
                resolve(advertisements);
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
        const app = this;
        return new Promise((resolve, reject) => {
            let devices = [];
            let currentUuids = [];
            driver.getDevices().forEach(device => {
                let data = device.getData();
                currentUuids.push(data.uuid);
            });

            const advertisements = app._advertisements.filter(function (advertisement) {
                return (currentUuids.indexOf(advertisement.uuid) === -1);
            });

            if (advertisements.length === 0) {
                resolve([]);
            }

            advertisements.forEach(function (advertisement) {
                if (advertisement.localName !== undefined) {
                    devices.push({
                        "name": advertisement.localName,
                        "data": {
                            "id": advertisement.id,
                            "uuid": advertisement.uuid,
                            "address": advertisement.uuid,
                            "name": advertisement.localName,
                            "type": advertisement.type,
                            "version": "v" + Homey.manifest.version,
                        },
                        "capabilities": ["detect"],
                    });
                }
            });

            resolve(devices);
        });
    }
}

module.exports = Beacon;