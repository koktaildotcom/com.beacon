"use strict";

const Homey = require('homey');

class BeaconDriver extends Homey.Driver {

    /**
     * This method is used as filter function for arrays. It returns true whenever
     *  the advertisement passed as argument is handled by the specific driver
     *  implementation.
     * @abstract
     * @param {BleAdvertisement} advertisement
     * @returns {boolean}
     */
    supports(advertisement){
        throw new Error('todo: Implement `supports` into child class');
    }

    /**
     * This method analyzes a BLE advertisemet discovered by Homey in order to
     *  extract the metadata used for pairing/repairing a device in Homey. This
     *  method can be overridden in child classes.
     * @param {BleAdvertisement} advertisement
     * @returns {Metadata}
     */
    extractMetadata(advertisement) {
        let metadata = {
            settings: {},
            capabilities: ['detect', 'signal_strength'],
            store: {}
        };
        if (advertisement.addressType == 'public') {
            metadata.settings['address'] = advertisement.address;
            if (advertisement.address.startsWith('ac:23:3f')) {
                metadata.settings['manufacturer'] = 'Minew';
                metadata.capabilities.push('measure_battery');
                metadata.store['energy'] = {
                    batteries: ['OTHER']
                };
                // Based on Minew's documentation about the "info" frame.
                for (const serviceDatum of advertisement.serviceData) {
                    if (serviceDatum.uuid == 'ffe1') {
                        if (serviceDatum.data.length > 9) {
                            if (serviceDatum.data[0] = 0xa1) {
                                let model = '';
                                for (let i = 9; i < serviceDatum.data.length; i++) {
                                    model = model + String.fromCharCode( serviceDatum.data[i]);
                                }
                                if (model == 'C6-6' || model == 'PLUS') {
                                    metadata.store['energy'] = {
                                        batteries: ['CR2032']
                                    }
                                }
                                metadata.settings['model'] = model + ' (v' + serviceDatum.data[1] + ')';
                            }
                        }
                    }
                }
            }
        }
        else {
            // A random address is not necessarily static. Thus it can vary from time
            //  to time and its actual value may not be a significative info.
            metadata.settings['address'] = 'random';
        }
        if (typeof advertisement.localName === 'string') {
            metadata['name'] = advertisement.localName;
            metadata.settings['advertised_name'] = advertisement.localName;
            if (advertisement.localName.startsWith('BlueUp')) {
                metadata.settings['manufacturer'] = 'BlueUp';
                let splitName = advertisement.localName.split('-');
                if (splitName.length == 3) {
                    if (splitName[1] == '01') {
                        metadata.settings['model'] = 'Mini';
                        metadata.capabilities.push('measure_battery');
                        metadata.store['energy'] = {
                            batteries: ['CR2477']
                        }
                    }
                    if (splitName[1] == '02') {
                        metadata.settings['model'] = 'Maxi';
                        metadata.capabilities.push('measure_battery');
                        metadata.store['energy'] = {
                            batteries: ['AA', 'AA']
                        }
                    }
                    if (splitName[1] == '04') {
                        metadata.settings['model'] = 'Forte';
                        metadata.capabilities.push('measure_battery');
                        metadata.store['energy'] = {
                            batteries: ['CR123A']
                        }
                    }
                    if (splitName[1] == '05') {
                        metadata.settings['model'] = 'Tag';
                        metadata.capabilities.push('measure_battery');
                        metadata.store['energy'] = {
                            batteries: ['CR2032', 'CR2032']
                        }
                    }
                    if (splitName[1] == '06') {
                        metadata.settings['model'] = 'Board';
                        metadata.store['energy'] = {
                            'approximation': {
                                'usageConstant': 0.03 // in Watt
                            }
                        }
                    }
                    if (splitName[1] == '07') {
                        metadata.settings['model'] = 'Sensor';
                        metadata.capabilities.push('measure_battery');
                        metadata.store['energy'] = {
                            batteries: ['AA', 'AA']
                        }
                    }
                    if (splitName[1] == '08') {
                        metadata.settings['model'] = 'Card';
                        metadata.capabilities.push('measure_battery');
                        metadata.store['energy'] = {
                            batteries: ['INTERNAL']
                        }
                    }
                }
            }
        }
        else {
            metadata['name'] = advertisement.address;
            metadata.settings['advertised_name'] = '-';
            if (metadata.settings.model) {
                metadata.name = metadata.settings.model + ' ' +  metadata.name;
            }
            else {
                metadata.settings['model'] = '-';
            }
            if (metadata.settings.manufacturer) {
                metadata.name = metadata.settings.manufacturer + ' ' +  metadata.name;
            }
            else {
                metadata.settings['manufacturer'] = '-';
            }
        }
        return metadata;
    }

    /**
     * on init the driver.
     */
    onInit() {
        console.log('Beacon driver ' + this.manifest.name.en + ' is running...');

        // on discovery
        const driver = this;
        this.homey.on('update.beacon.status', advertisements => {
            let filteredAdvertisements = advertisements.filter(this.supports.bind(driver));
            for (const device of driver.getDevices()) {

                // set available, it is possibly marked unavailable in v1.2.7
                device.setAvailable();

                // if never detected yet, set detected but don't trigger flow
                if (device.getCapabilityValue("detect") === null) {
                    device.setCapabilityValue("detect", true);
                }

                let detected = false;
                for (const filteredAdvertisement of filteredAdvertisements) {
                    if (device.matchAdvertisement(filteredAdvertisement)) {
                        const beacon = device.parseAdvertisement(filteredAdvertisement);
                        device.updateCapabilityValues(beacon);
                        detected = true;
                        break;
                    }
                }
                // The advertisements list contains an advertisement for a specific device.
                if (detected) {
                    this.homey.log('[✓]' + device.getName());
                    device.setDetect();
                } else {
                    this.homey.log('[x]' + device.getName());
                    device.setUndetect();
                }
            }
        });
    }


    /**
     * New method for building the list of devices for pairing to Homey.
     * Compared to onPairListDevices() this method allows you customize
     * the views of the pairing process (in might be useful in future
     * versions).
     *
     * @param session
     */
    async onPair(session) {
        this.homey.app.pairing = true;
        const driver = this;
        session.setHandler('list_devices', async () => {
            try {
                const advertisements = await this.homey.ble.discover([]);
                const myAdvertisements = advertisements.filter(this.supports.bind(driver));
                const devices = [];
                for (const myAdvertisement of myAdvertisements) {
                    devices.push(this.extractMetadata(myAdvertisement));
                }
                this.homey.app.pairing = false;
                return devices;
            } catch (error) {
                this.homey.app.pairing = false;
                return Promise.reject(new Error('Cannot get devices: ' + error));
            }
        });
    }

    onRepair(session, device) {
        session.setHandler('query_curr_device', async () => {
            return {
                deviceName: device.getName(),
                deviceData: device.getData()
            }
        });
        session.setHandler('discover_and_refresh', async () => {
            try {
                const advertisements = await this.homey.ble.discover([]);
                const myAdvertisements = advertisements.filter(advertisement => this.supports(advertisement).bind(this));
                for (const myAdvertisement of myAdvertisements) {
                    if (device.matchAdvertisement(myAdvertisement)) {
                        if (device.refreshProperties(this.extractMetadata(myAdvertisement)) === true) {
                            return 'refreshed';
                        }
                        else {
                            return 'nothing_to_be_refreshed';
                        }
                    }
                }
                return 'not_discovered';
            }
            catch(error) {
                return error;
            }
        });
    }
}

module.exports = BeaconDriver;
