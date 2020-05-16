import { CharacteristicEventTypes } from "homebridge";
import { AxiosInstance } from "axios";

import type {
  PlatformAccessory,
  CharacteristicValue,
  CharacteristicSetCallback,
  CharacteristicGetCallback,
} from "homebridge";

import { ADTHomebridgePlatform } from "./platform";
import { ADTPlatformAccessory } from "./adt-platform-accessory";

export class ADTSecuritySystem extends ADTPlatformAccessory {

  private armedMapping: Record<string, number> = {
    "armedStay": 2,
    "armedAway": 1,
    "disarmed": 0,
  };

  constructor(
    platform: ADTHomebridgePlatform,
    accessory: PlatformAccessory,
    apiClient: AxiosInstance,
  ) {
    super(platform, accessory, apiClient);

    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, "Samsgung")
      .setCharacteristic(this.platform.Characteristic.Model, "ADT Panel")
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        "123-456-789",
      );

    this.platform.log.debug("context", this.accessory.context.device);

    this.service =
      this.accessory.getService(this.platform.Service.SecuritySystem) ??
      this.accessory.addService(this.platform.Service.SecuritySystem);

    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.context.device.exampleDisplayName,
    );

    this.service
      .getCharacteristic(
        this.platform.Characteristic.SecuritySystemCurrentState,
      )
      .on(CharacteristicEventTypes.GET, this.getState.bind(this));
    this.service
      .getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
      .on(CharacteristicEventTypes.SET, this.setState.bind(this));
  }

  setState(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    
    const sceneId = this.accessory.context.device[
      this.statusMapping[parseInt(value.toString())]
    ];

    this.platform.log.debug("Set Scene ->", sceneId);
    

    this.apiClient
      .post(`scenes/${sceneId}/execute`)
      .then((result) => {
        this.platform.log.debug("Call result", result);
        callback(null, value);
      })
      .catch((error) => {
        this.platform.log.debug("Call result error", error);
        callback(error);
      });
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   * 
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   * 
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  getState(callback: CharacteristicGetCallback) {
    this.platform.log.debug("getState");
    this.apiClient
      .get(
        `devices/${this.accessory.context.device.deviceId}/components/main/capabilities/securitySystem/status`,
      )
      .then((result) => {
        this.platform.log.debug("Call result", result);
        callback(null, this.armedMapping[result.data.securitySystemStatus.value]);
      })
      .catch((err) => {
        this.platform.log.debug("Call result error", err);
        callback(err);
      });
  }
}
