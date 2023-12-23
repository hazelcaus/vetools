export * from "./CancellationEvent"
export * from "./EnumStorage"
export * from "./ItemFactory"
export * from "./ItemType"
export * from "./IDeployDestination"
import {
    CommandItemCreator,
    InfuraNetworkNodeItemCreator,
    InfuraProjectItemCreator,
    InfuraServiceItemCreator,
    LocalNetworkNodeItemCreator,
    LocalProjectItemCreator,
    LocalServiceItemCreator,
    MemberItemCreator,
    NullableItemCreator,
} from "./ItemCreators"
import { ItemFactory } from "./ItemFactory"
import { ItemType } from "./ItemType"

ItemFactory.register(ItemType.COMMAND, new CommandItemCreator())
ItemFactory.register(ItemType.NULLABLE, new NullableItemCreator())

ItemFactory.register(ItemType.LOCAL_SERVICE, new LocalServiceItemCreator())
ItemFactory.register(ItemType.INFURA_SERVICE, new InfuraServiceItemCreator())

ItemFactory.register(ItemType.LOCAL_PROJECT, new LocalProjectItemCreator())
ItemFactory.register(ItemType.INFURA_PROJECT, new InfuraProjectItemCreator())

ItemFactory.register(ItemType.LOCAL_NETWORK_NODE, new LocalNetworkNodeItemCreator())
ItemFactory.register(ItemType.INFURA_NETWORK_NODE, new InfuraNetworkNodeItemCreator())

ItemFactory.register(ItemType.MEMBER, new MemberItemCreator())
