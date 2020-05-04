import { CharacteristicEventTypes } from "homebridge";
import axios, { AxiosInstance } from "axios";

import type {
  Service,
  PlatformAccessory,
  CharacteristicValue,
  CharacteristicSetCallback,
  CharacteristicGetCallback,
} from "homebridge";

import { ADTHomebridgePlatform } from "./platform";

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ADTPlatformAccessory {
  private service: Service;
  private apiClient: AxiosInstance;
  private statusMapping: string[] = [
    "homeScene",
    "awayScene",
    "nightScene",
    "homeScene",
  ];

  private armedMapping: Record<string, number> = {
    "armedStay": 2,
    "armedAway": 1,
    "disarmed": 0,
  };

  constructor(
    private readonly platform: ADTHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, "Samsgung")
      .setCharacteristic(this.platform.Characteristic.Model, "ADT Panel")
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        "123-456-789",
      );

    // get the SecuritySystem service if it exists, otherwise create a new SecuritySystem service
    // you can create multiple services for each accessory
    this.service =
      this.accessory.getService(this.platform.Service.SecuritySystem) ??
      this.accessory.addService(this.platform.Service.SecuritySystem);

    // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
    // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
    // this.accessory.getService('NAME') ?? this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE');

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.context.device.exampleDisplayName,
    );

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://github.com/homebridge/HAP-NodeJS/blob/master/src/lib/gen/HomeKit.ts

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(
        this.platform.Characteristic.SecuritySystemCurrentState,
      )
      .on(CharacteristicEventTypes.GET, this.getState.bind(this));
    this.service
      .getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
      .on(CharacteristicEventTypes.SET, this.setState.bind(this));

    this.apiClient = axios.create({
      baseURL: "https://api.smartthings.com/v1/",
      responseType: "json",
      headers: {
        Authorization: `Bearer ${accessory.context.apiKey}`,
      },
    });
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  setState(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    // implement your own code to turn your device on/off
    this.platform.log.debug("Set Characteristic On ->", value);

    const sceneId = this.accessory.context[
      this.statusMapping[parseInt(value.toString())]
    ];

    this.apiClient
      .post(`scenes/${sceneId}/execute)`)
      .then(() => {
        callback(null, value);
      })
      .catch((error) => {
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
    this.apiClient
      .get(
        `devices/${this.accessory.context.deviceId}/components/main/capabilities/securitySystem/status`,
      )
      .then((result) => {
        callback(null, this.armedMapping[result.data.securitySystemStatus.value]);
      })
      .catch((err) => {
        callback(err);
      });
  }
}
