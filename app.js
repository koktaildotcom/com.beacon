'use strict';

const Homey = require('homey');

class Beacon extends Homey.App {

    /**
     * on init the app
     */
    onInit() {
        console.log('Successfully init Beacon app version: %s', Homey.app.manifest.version);

        if (!Homey.ManagerSettings.get('timeout')) {
            Homey.ManagerSettings.set('timeout', 5)
        }

        if (!Homey.ManagerSettings.get('updateInterval')) {
            Homey.ManagerSettings.set('updateInterval', 10)
        }

        if (!Homey.ManagerSettings.get('verificationAmountInside')) {
            Homey.ManagerSettings.set('verificationAmountInside', 1)
        }

        if (!Homey.ManagerSettings.get('verificationAmountOutside')) {
            Homey.ManagerSettings.set('verificationAmountOutside', 5)
        }

        this.logTrigger = new Homey.FlowCardTrigger('log');
        this.logTrigger.register();

        this.beaconInsideRange = new Homey.FlowCardTrigger('beacon_inside_range');
        this.beaconInsideRange.register();

        this.deviceBeaconInsideRange = new Homey.FlowCardTriggerDevice('device_beacon_inside_range');
        this.deviceBeaconInsideRange.register();

        this.beaconOutsideRange = new Homey.FlowCardTrigger('beacon_outside_range');
        this.beaconOutsideRange.register();

        this.deviceBeaconOutsideRange = new Homey.FlowCardTriggerDevice('device_beacon_outside_range');
        this.deviceBeaconOutsideRange.register();

        this.beaconStateChanged = new Homey.FlowCardTrigger('beacon_state_changed');
        this.beaconStateChanged.register();

        this.deviceBeaconStateChanged = new Homey.FlowCardTriggerDevice('device_beacon_state_changed');
        this.deviceBeaconStateChanged.register();

        this._advertisements = [];
        this._scanning();
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
     * @param message
     */
    log(message) {
        if (this.logTrigger) {
            this.logTrigger.trigger({
                'log': this._getDateTime(new Date()) + ' ' + message
            })
        }
        console.log(message);
    }

    /**
     * @param date Date
     * @returns {string}
     * @private
     */
    _getDateTime(date) {

        let hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        let min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        let sec = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        let year = date.getFullYear();

        let month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        let day = date.getDate();
        day = (day < 10 ? "0" : "") + day;

        return day + "-" + month + "-" + year + " " + hour + ":" + min + ":" + sec;
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
        try {
            let updateDevicesTime = new Date();
            this._updateDevices()
                .then((foundDevices) => {
                    if (foundDevices.length !== 0) {
                        Homey.emit('beacon.devices', foundDevices);
                    }
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
            Homey.ManagerBLE.discover([], Homey.ManagerSettings.get('timeout') * 1000).then(function (advertisements) {
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