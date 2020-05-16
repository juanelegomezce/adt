import { Service, PlatformAccessory } from "homebridge";
import { ADTHomebridgePlatform } from "./platform";
import axios, { AxiosInstance } from "axios";

export class ADTPlatformAccessory {

    protected service: Service;
  
    constructor(
      protected readonly platform: ADTHomebridgePlatform,
      protected readonly accessory: PlatformAccessory,
      protected readonly apiClient: AxiosInstance,
    ) {
      this.service = new Service("", "");
      
      this.apiClient = axios.create({
        baseURL: "https://api.smartthings.com/v1/",
        responseType: "json",
        headers: {
          Authorization: `Bearer ${accessory.context.device.apiKey}`,
        },
      });
    }
  
}