'use strict';

const Homey = require('homey');

class BeaconDevice extends Homey.Device {

    /**
     * on init the device
     */
    onInit() {
        Homey.app.log('Beacon device ' + this.getName() + ' is initiated...');
        this.changeDetected = 0;
        this._registerCards();
    }

    /**
     *  Set detect
     */
    setDetect() {
        if (this.getCapabilityValue("detect") === false) {

            this.changeDetected++;
            Homey.app.log('beacon:' + this.getName() + " changed detect inside: " + this.changeDetected);

            if (this.changeDetected >= Homey.ManagerSettings.get('verificationAmountInside')) {
                this.setCapabilityValue("detect", true);

                this.beaconInsideRange.trigger({
                    'device': this.getName(),
                    'beacon': this.getName()
                })
                    .catch(function (error) {
                        Homey.app.log('Cannot trigger flow card beacon_inside_range: %s.', error);
                    });

                this.deviceBeaconInsideRange.trigger(this, {
                    'beacon': this.getName()
                })
                    .catch(function (error) {
                        Homey.app.log('Cannot trigger flow card device_beacon_inside_range: %s.', error);
                    });
            }
        }
        else {
            this.changeDetected = 0;
        }
    }

    /**
     *  Set undetected
     */
    setUndetect() {
        if (this.getCapabilityValue("detect") === true) {

            this.changeDetected++;
            Homey.app.log('beacon:' + this.getName() + " changed detect outside: " + this.changeDetected);

            if (this.changeDetected >= Homey.ManagerSettings.get('verificationAmountOutside')) {
                this.setCapabilityValue("detect", false);

                this.beaconOutsideRange.trigger({
                    'device': this.getName(),
                    'beacon': this.getName()
                })
                    .catch(function (error) {
                        Homey.app.log('Cannot trigger flow card beacon_outside_range: %s.', error);
                    });

                this.deviceBeaconOutsideRange.trigger(this, {
                    'beacon': this.getName()
                })
                    .catch(function (error) {
                        Homey.app.log('Cannot trigger flow card device_beacon_outside_range: %s.', error);
                    });
            }
        }
        else {
            this.changeDetected = 0;
        }
    }

    _registerCards() {
        this.beaconInsideRange = new Homey.FlowCardTrigger('beacon_inside_range');
        this.beaconInsideRange.register();

        this.deviceBeaconInsideRange = new Homey.FlowCardTriggerDevice('device_beacon_inside_range');
        this.deviceBeaconInsideRange.register();

        this.beaconOutsideRange = new Homey.FlowCardTrigger('beacon_outside_range');
        this.beaconOutsideRange.register();

        this.deviceBeaconOutsideRange = new Homey.FlowCardTriggerDevice('device_beacon_outside_range');
        this.deviceBeaconOutsideRange.register();
    }
}

module.exports = BeaconDevice;