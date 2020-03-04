This app integrate the basic flows for BLE beacons into Homey.
Once the app is installed it will do a discovery of BLE devices, after a short adjustable timeout it wil keep discovering.
After each discovery the app compares the found devices with the one paired.
If the beacon is not found within the new "discovered list" the beacon is changed in state.

For filtering out false positives there is a verification amount inside or outside the range available in the settings.
This setting is the amount of times the beacon needs to be changed before it wil marked as such. The amount will be reset if the beacon is not in that current state.