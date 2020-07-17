"use strict";

// The instances of this class represente a a specialized type of
// advertisement: the generic_beacon advertisements. The class allows to construct
// new instances from a standard Homey BLE advertisement.

const Homey = require('homey');
const IBeaconDriver = require('../drivers/ibeacon/driver.js')
const EddystoneDriver = require('../drivers/eddystone/driver.js')
const GenericBeaconDriver = require('../drivers/generic_beacon/driver.js')

Uint8Array.prototype.toHexString = function () {
    let s = '';
    for (let i = 0; i < this.length; i++) {
        let c = this[i].toString(16);
        if (c.length < 2)
            c = '0' + c;
        s = s + c;
    }
    return s;
}

class BeaconAdvertisement {

    getBeaconFromAdvertisement(advertisement) {
        const beacon = {};
        beacon.name = advertisement.localName;
        beacon.rssi = advertisement.rssi;
        beacon.address = advertisement.address;
        if (advertisement.manufacturerData !== undefined) {
            // Field manufacturerData expected in iBeacon
            let md = advertisement.manufacturerData;
            if (md.length == 25 && md[0] == 76 && md[1] == 0 && md[2] == 2 && md[3] == 21) {
                let uuidArr = new Uint8Array(md.slice(4, 20));
                beacon.type = IBeaconDriver.getBeaconType();
                beacon.key = {
                    uuid: uuidArr.toHexString(),
                    major: md[20] * 256 + md[21],
                    minor: md[22] * 256 + md[23]
                }
                beacon.calibratedPower = md[24] - 256;
                if (advertisement.serviceData !== undefined) {
                    for (let serviceDatum of advertisement.serviceData) {
                        // The UUID 0x180F indicates the battery service.
                        // Reference: https://www.bluetooth.com/specifications/gatt/services/
                        if (serviceDatum.uuid == '180f') {
                            // Battery level as a percentage from 0% to 100%; 0%
                            // represents a battery that is fully discharged, 100%
                            // represents a battery that is fully charged.
                            beacon.batteryLevel = serviceDatum.data[0];
                        }
                    };
                }
                return beacon;
            }
        }
        if (advertisement.serviceData !== undefined) {
            for (let serviceDatum of advertisement.serviceData) {
                // 0xFEAA is the 16 bit UUID data type of the Eddystone Service
                // UUID.
                // Reference: https://github.com/google/eddystone/blob/master/protocol-specification.md
                if (serviceDatum.uuid == 'feaa') {
                    // The specific type of Eddystone frame is encoded in the
                    // high order four bits of the first octet in the Service
                    // Data associated with the Service UUID (the four low
                    // order bits have a fixed value of 0000). The value 0x00
                    // indicates the Eddystone UID frame; the value 0x30
                    // indicates the Eddystone EID frame.
                    if (serviceDatum.data[0] == 0x00 || serviceDatum.data[0] == 0x30) {
                        let namespaceArr = new Uint8Array(serviceDatum.data.slice(2, 12));
                        let instanceArr = new Uint8Array(serviceDatum.data.slice(12, 18));
                        if (serviceDatum.data[0] !== 0x30) {
                            beacon.type = EddystoneDriver.getBeaconType();
                        }
                        beacon.key = {
                           namespace: namespaceArr.toHexString(),
                           instance: instanceArr.toHexString()
                        }
                    }
                    beacon.calibratedPower = serviceDatum.data[1] - 256;
                }
                // The UUID 0x180F indicates the battery service.
                // Reference: https://www.bluetooth.com/specifications/gatt/services/
                else if (serviceDatum.uuid == '180f') {
                    // Battery level as a percentage from 0% to 100%; 0%
                    // represents a battery that is fully discharged, 100%
                    // represents a battery that is fully charged.
                    beacon.batteryLevel = serviceDatum.data[0];
                }
            }
            if (beacon.key)
                return beacon;
        }
        if (advertisement.localName !== undefined) {
            beacon.type = GenericBeaconDriver.getBeaconType();
            beacon.key = {
                id: advertisement.id,
                uuid: advertisement.uuid,
                address: advertisement.uuid,
                name: advertisement.localName,
                type: advertisement.addressType,
                version: "v" + Homey.manifest.version
            }
            return beacon;
        }

        return null;
    }

    _advertisedNameToString(beacon) {
        if (beacon.name !== undefined && beacon.name !== null)
            return beacon.name;
        return '-';
    }

    _calibratedPowerToString(beacon) {
        if (beacon.calibratedPower !== undefined && beacon.calibratedPower !== null)
            return beacon.calibratedPower.toString() + ' dBm';
        return '-';
    }

    /**
     * The method getPairObject() analyses the generic_beacon advertisement and returns
     * an object suitable for device pairing in Homey.
     */
    getMetaData(beacon) {
        let nameStr;
        let frameDetailStr;
        let capabilityArr = ["detect", "signal_strength"];
        let energyObj = undefined;
        console.log(beacon.type);
        switch (beacon.type) {
            case IBeaconDriver.getBeaconType():
                let iBeaconUUIDStr = beacon.key.uuid.slice(0, 8) + '-' +
                    beacon.key.uuid.slice(8, 12) + '-' +
                    beacon.key.uuid.slice(12, 16) + '-' +
                    beacon.key.uuid.slice(16, 20) + '-' +
                    beacon.key.uuid.slice(20);
                let iBeaconMajorStr = beacon.key.major.toString();
                let iBeaconMinorStr = beacon.key.minor.toString();
                frameDetailStr = "UUID: " + iBeaconUUIDStr +
                    " Major: " + iBeaconMajorStr + " Minor: " + iBeaconMinorStr;
                if (beacon.name !== undefined) {
                    nameStr = beacon.name;
                }
                else {
                    nameStr = beacon.key.uuid + ' ' + beacon.key.major.toString() +
                        ' ' + beacon.key.minor.toString();
                }
                break;
            case EddystoneDriver.getBeaconType():
                let eddystoneNamespaceStr = beacon.key.namespace;
                let eddystoneInstanceStr = beacon.key.instance;
                frameDetailStr = "Namespace: " + eddystoneNamespaceStr + " Instance: " +
                    eddystoneInstanceStr;
                if (beacon.name !== undefined) {
                    nameStr = beacon.name ;
                }
                else {
                    nameStr = beacon.key.namespace + ' ' + beacon.key.instance;
                }
                break;
            case GenericBeaconDriver.getBeaconType():
                frameDetailStr = "-";
                nameStr = beacon.name;
                break;
        };
        let known_model = false;
        if (beacon.name) {
            if (beacon.name.startsWith('BlueUp')) {
                let splitName = beacon.name.split('-');
                if (splitName.length == 3) {
                    if (splitName[1] == '01') { // BlueUp model Mini
                        capabilityArr.push("measure_battery");
                        energyObj = {
                            batteries: ["CR2477"]
                        }
                        known_model = true;
                    }
                    if (splitName[1] == '02') { // BlueUp model Maxi
                        capabilityArr.push("measure_battery");
                        energyObj = {
                            batteries: ["AA", "AA"]
                        }
                        known_model = true;
                    }
                    if (splitName[1] == '04') { // BlueUp model Forte
                        capabilityArr.push("measure_battery");
                        energyObj = {
                            batteries: ["CR123A"]
                        }
                        known_model = true;
                    }
                    if (splitName[1] == '05') { // BlueUp model Tag
                        capabilityArr.push("measure_battery");
                        energyObj = {
                            batteries: ["CR2032", "CR2032"]
                        }
                        known_model = true;
                    }
                    if (splitName[1] == '06') { // BlueUp model Board
                        energyObj = {
                            "approximation": {
                                "usageConstant": 0.03 // in Watt
                            }
                        }
                        known_model = true;
                    }
                    if (splitName[1] == '07') { // BlueUp model Sensor
                        capabilityArr.push("measure_battery");
                        energyObj = {
                            batteries: ["AA", "AA"]
                        }
                        known_model = true;
                    }
                    if (splitName[1] == '08') { // BlueUp model Card
                        capabilityArr.push("measure_battery");
                        energyObj = {
                            batteries: ["INTERNAL"]
                        }
                        known_model = true;
                    }
                }
            }
        }
        if (!known_model) {
            if (beacon.batteryLevel !== undefined) {
                capabilityArr.push("measure_battery");
                energyObj = {
                    batteries: ["OTHER"]
                }
            }
        }
        if (beacon.calibratedPower !== undefined) {
            capabilityArr.push("homey_distance");
        }
        return {
            name: nameStr,
            data: beacon.key,
            settings: {
                address: beacon.address,
                advertised_name: this._advertisedNameToString(beacon),
                calibrated_power: this._calibratedPowerToString(beacon),
                frame_detail: frameDetailStr
            },
            store: {
                calibrated_power_: beacon.calibratedPower,
                energy: energyObj
            },
            capabilities: capabilityArr
        };
    }
}

module.exports = BeaconAdvertisement;
