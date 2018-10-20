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
        console.log('Beacon driver '+ this.getBleName() +' is running...');

        const driver = this;

        Homey.on('beacon.devices', function(findDevices){
            console.log('catch event beacon.devices');
            driver.getDevices().forEach(function(device){
                const found = (findDevices.indexOf(device.getData().uuid) !== -1);
                if(device.getCapabilityValue("detect") !== found){

                    if(!device.detectedChangeCount){
                        device.detectedChangeCount = 0;
                    }

                    if(found) {
                        device.detectedChangeCount++;
                    }
                    else{
                        device.detectedChangeCount = 0;
                    }

                    if(device.detectedChangeCount >= 2) {
                        device.detectedChangeCount = 0;
                        if (found) {
                            console.log('Device: CapabilityValue detect ' + device.getName() + ' found');
                            device.setDetect();
                        }
                        else {
                            console.log('Device: CapabilityValue detect ' + device.getName() + ' not found');
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