// The instances of this class represente a a specialized type of
// advertisement: the beacon advertisements. The class allows to construct
// new instances from a standard Homey BLE advertisement.  

const Homey = require('homey');

const btaUnknown = 0;    // Unknown
const btaPeripheral = 1; // Generic BLE periperal
const btaIBeacon = 2;    // iBeacon
const btaEddystone = 3;  // Eddystone UID


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
                let UUIDArr = new Uint8Array(md.slice(4, 20));
                this.key = {
                    typeId: btaIBeacon,
                    iBeacon: {
                        proximityUUID: UUIDArr.toHexString(),
                        major: md[20] * 256 + md[21],
                        minor: md[22] * 256 + md[23]
                    }
                }
                this.calibratedPower = md[24] - 256;
                if (advertisement.serviceData !== undefined) {
                    for (let i = 0; i < advertisement.serviceData.length; i++) {
                        let serviceDatum = advertisement.serviceData[i];
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
            for (let i = 0; i < advertisement.serviceData.length; i++) {
                let serviceDatum = advertisement.serviceData[i];
                // 0xFEAA is the 16 bit UUID data type of the Eddystone Service
                // UUID.
                // Reference: https://github.com/google/eddystone/blob/master/protocol-specification.md
                if (serviceDatum.uuid == 'feaa') {
                    // The specific type of Eddystone frame is encoded in the high 
                    // order four bits of the first octet in the Service Data
                    // associated with the Service UUID. The four low order bits
                    // have a fixed value of 0000. The value 0x00 indicates the
                    // Eddystone UID frame.
                    if (serviceDatum.data[0] == 0) {
                        let NSArr = new Uint8Array(serviceDatum.data.slice(2, 12));
                        let instanceArr = new Uint8Array(serviceDatum.data.slice(12, 18));
                        this.key = {
                            typeId: btaEddystone,
                            eddystone: {
                                NS: NSArr.toHexString(),
                                instance: instanceArr.toHexString()
                            }
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
            this.key = {
                typeId: btaPeripheral,
                peripheral: {
                    id: advertisement.id,
                    uuid: advertisement.uuid,
                    address: advertisement.uuid,
                    name: advertisement.localName,
                    type: advertisement.addressType,
                    version: "v" + Homey.manifest.version
                }
            }
            return;
        }
        this.key = {
            typeId: btaUnknown
        }
    }


    advertisedNameToString() {
        if (this.name !== undefined && this.name !== null) 
            return this.name;
        return '-';
    }

    calibratedPowerToString() {
        if (this.calibratedPower !== undefined && this.calibratedPower !== null)
            return this.calibratedPower.toString() + ' dBm';
        return '-';
    }


    deviceToBePaired() {
        let iconFilename;
        let nameStr, advertisedNameStr;
        let calibratedPowerStr;
        let typeNameStr;
        let frameDetailStr;
        let capabilityArr;
        let energyObj = undefined;
        switch (this.key.typeId) {
            case btaIBeacon:
                iconFilename = "ibeacon.svg";
                typeNameStr = 'iBeacon';
                let iBeaconProximityUUIDStr = this.key.iBeacon.proximityUUID.slice(0, 8) + '-' +
                    this.key.iBeacon.proximityUUID.slice(8, 12) + '-' +
                    this.key.iBeacon.proximityUUID.slice(12, 16) + '-' +
                    this.key.iBeacon.proximityUUID.slice(16, 20) + '-' +
                    this.key.iBeacon.proximityUUID.slice(20);
                let iBeaconMajorStr = this.key.iBeacon.major.toString();
                let iBeaconMinorStr = this.key.iBeacon.minor.toString();
                frameDetailStr = "UUID: " + iBeaconProximityUUIDStr + " Major: " +
                    iBeaconMajorStr + " Minor: " + iBeaconMinorStr;
                if (this.name !== undefined) {
                    nameStr = this.name + '-ib';
                }
                else {
                    nameStr = iBeaconProximityUUIDStr + ' ' +
                        iBeaconMajorStr + ' ' + iBeaconMinorStr;
                }
                capabilityArr = ["detect", "signal_strength", "homey_distance"];
                break;
            case btaEddystone:
                iconFilename = "eddystone.svg";
                typeNameStr = 'Eddystone';
                let eddystoneNSStr = this.key.eddystone.NS;
                let eddystoneInstanceStr = this.key.eddystone.instance;
                frameDetailStr = "Namespace: " + eddystoneNSStr + " Instance: " +
                    eddystoneInstanceStr;
                if (this.name !== undefined) {
                    nameStr = this.name + '-eu';
                }
                else {
                    nameStr = eddystoneNSStr + ' ' + eddystoneInstanceStr;
                }
                capabilityArr = ["detect", "signal_strength", "homey_distance"];
                break;
            case btaPeripheral:
                nameStr = this.name;
                iconFilename = "icon.svg";
                typeNameStr = 'BLE Peripheral';
                frameDetailStr = '-';
                capabilityArr = ["detect", "signal_strength"];
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

        return {
            name: nameStr,
            data: this.key,
            settings: {
                address: this.address,
                advertised_name: this.advertisedNameToString(),
                calibrated_power: this.calibratedPowerToString(),
                typeName: typeNameStr,
                frame_detail: frameDetailStr
            },
            store: {
                advertised_name_: this.name,
                calibrated_power_: this.calibratedPower,
                energy: energyObj
            },
            icon: iconFilename, // relative to: /drivers/<driver_id>/assets/
            capabilities: capabilityArr
        };
    }
}

module.exports = BeaconAdvertisement;
