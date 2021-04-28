"use strict";

const BeaconDriver = require('../../lib/beacon-driver.js');

class GenericBeaconDriver extends BeaconDriver {

    /** @inheritdoc */
    isMyAdvertisement(advertisement) {
        // As of Beacon app v1.2.10, file app.js, row 238. 
        if ( advertisement.localName !== undefined) {
            // As stated in BT SIG specification v4.2, Volume 6 (Low Energy),
            //  Part B (Link Layer), section 1.3 (Device Address) and Volume 3 (Host),
            //  Part C (GAP) section 10.8 (Random Device Address), a random address
            //  is not necessarily static. Thus it can vary from time to time and
            //  it cannot be used for identifying a device. 
            if (advertisement.addressType != 'random') {
                return true;
            }
        }
        return false;
    }

}

module.exports = GenericBeaconDriver;
