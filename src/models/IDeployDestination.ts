
import { TruffleConfiguration } from "../helpers/truffleConfig";
import { ItemType } from "./ItemType";

export interface IDeployDestination {
  description?: string;
  detail?: string;
  label: string;
  networkType: ItemType;
  port?: number;
  getTruffleNetwork: () => Promise<TruffleConfiguration.INetwork>;
  networkId: number;
}
