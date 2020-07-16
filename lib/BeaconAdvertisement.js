// The instances of this class represente a a specialized type of
// advertisement: the beacon advertisements. The class allows to construct
// new instances from a standard Homey BLE advertisement.  

const Homey = require('homey');

const btaUnknown = 0;    // Unknown
const btaGenericBeacon = 1; // Generic BLE periperal
const btaIBeacon = 2;    // iBeacon
const btaEddystoneUID = 3;  // Eddystone UID
const btaEddystoneEID = 4;  // Eddystone EID


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

    constructor(advertisement) {
        this.name = advertisement.localName;
        this.rssi = advertisement.rssi;
        this.address = advertisement.address;
        if (advertisement.manufacturerData !== undefined) {
            // Field manufacturerData expected in iBeacon
            let md = advertisement.manufacturerData;
            if (md.length == 25 && md[0] == 76 && md[1] == 0 && md[2] == 2 && md[3] == 21) {
                let uuidArr = new Uint8Array(md.slice(4, 20));
                this.type = btaIBeacon;
                this.key = {
                    uuid: uuidArr.toHexString(),
                    major: md[20] * 256 + md[21],
                    minor: md[22] * 256 + md[23]
                }
                this.calibratedPower = md[24] - 256;
                if (advertisement.serviceData !== undefined) {
                    for (let serviceDatum of advertisement.serviceData) {
                        // The UUID 0x180F indicates the battery service.
                        // Reference: https://www.bluetooth.com/specifications/gatt/services/
                        if (serviceDatum.uuid == '180f') {
                            // Battery level as a percentage from 0% to 100%; 0%
                            // represents a battery that is fully discharged, 100%
                            // represents a battery that is fully charged.
                            this.batteryLevel = serviceDatum.data[0];
                        }
                    };
                }
                return;
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
                        if (serviceDatum.data[0] == 0x30) {
                            this.type = btaEddystoneEID;
                        }
                        else {
                            this.type = btaEddystoneUID;
                        }
                        this.key = {
                           namespace: namespaceArr.toHexString(),
                           instance: instanceArr.toHexString()
                        }
                    }
                    this.calibratedPower = serviceDatum.data[1] - 256;
                }
                // The UUID 0x180F indicates the battery service.
                // Reference: https://www.bluetooth.com/specifications/gatt/services/
                else if (serviceDatum.uuid == '180f') {
                    // Battery level as a percentage from 0% to 100%; 0%
                    // represents a battery that is fully discharged, 100%
                    // represents a battery that is fully charged.
                    this.batteryLevel = serviceDatum.data[0];
                }
            }
            if (this.key)
                return;
        }
        if (advertisement.localName !== undefined) {
            this.type = btaGenericBeacon;
            this.key = {
                id: advertisement.id,
                uuid: advertisement.uuid,
                address: advertisement.uuid,
                name: advertisement.localName,
                type: advertisement.addressType,
                version: "v" + Homey.manifest.version
            }
            return;
        }
        this.type = btaUnknown;
    }

    _advertisedNameToString() {
        if (this.name !== undefined && this.name !== null) 
            return this.name;
        return '-';
    }

    _calibratedPowerToString() {
        if (this.calibratedPower !== undefined && this.calibratedPower !== null)
            return this.calibratedPower.toString() + ' dBm';
        return '-';
    }

    /**
     * The method getPairObject() analyses the beacon advertisement and returns
     * an object suitable for device pairing in Homey. 
     */
    getPairObject() {
        let nameStr;
        let frameDetailStr;
        let capabilityArr = ["detect", "signal_strength"];
        let energyObj = undefined;
        switch (this.type) {
            case btaIBeacon:
                let iBeaconUUIDStr = this.key.uuid.slice(0, 8) + '-' +
                    this.key.uuid.slice(8, 12) + '-' +
                    this.key.uuid.slice(12, 16) + '-' +
                    this.key.uuid.slice(16, 20) + '-' +
                    this.key.uuid.slice(20);
                let iBeaconMajorStr = this.key.major.toString();
                let iBeaconMinorStr = this.key.minor.toString();
                frameDetailStr = "UUID: " + iBeaconUUIDStr +
                    " Major: " + iBeaconMajorStr + " Minor: " + iBeaconMinorStr;
                if (this.name !== undefined) {
                    nameStr = this.name;
                }
                else {
                    nameStr = this.key.uuid + ' ' + this.key.major.toString() +
                        ' ' + this.key.minor.toString();
                }
                break;
            case btaEddystoneUID:
                let eddystoneNamespaceStr = this.key.namespace;
                let eddystoneInstanceStr = this.key.instance;
                frameDetailStr = "Namespace: " + eddystoneNamespaceStr + " Instance: " +
                    eddystoneInstanceStr;
                if (this.name !== undefined) {
                    nameStr = this.name ;
                }
                else {
                    nameStr = this.key.namespace + ' ' + this.key.instance;
                }
                break;
            case btaGenericBeacon:
                frameDetailStr = "-";
                nameStr = this.name;
                break; 
        };
        let known_model = false;
        if (this.name) {
            if (this.name.startsWith('BlueUp')) {
                let splitName = this.name.split('-');
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
            if (this.batteryLevel !== undefined) {
                capabilityArr.push("measure_battery");
                energyObj = {
                    batteries: ["OTHER"]
                }
            }
        }
        if (this.calibratedPower !== undefined) {
            capabilityArr.push("homey_distance");
        }
        return {
            name: nameStr,
            data: this.key,
            settings: {
                address: this.address,
                advertised_name: this._advertisedNameToString(),
                calibrated_power: this._calibratedPowerToString(),
                frame_detail: frameDetailStr
            },
            store: {
                calibrated_power_: this.calibratedPower,
                energy: energyObj
            },
            capabilities: capabilityArr
        };
    }
}

module.exports = BeaconAdvertisement;
module.exports.btaUnknown = btaUnknown;
module.exports.btaGenericBeacon = btaGenericBeacon;
module.exports.btaIBeacon = btaIBeacon;
module.exports.btaEddystoneUID = btaEddystoneUID;
module.exports.btaEddystoneEID = btaEddystoneEID;