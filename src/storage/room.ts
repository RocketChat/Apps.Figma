import {
    IPersistence,
    IPersistenceRead,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord
} from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { storedRoom } from '../definition';
// Functions needed to persist room data while modal and other UI interactions
export const storeInteractionRoomData = async (
    persistence: IPersistence,
    userId: string,
    roomId: string
): Promise<void> => {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        `${userId}#RoomId`
    );
    const storeRoomData: storedRoom = {
        roomId
    };
    await persistence.updateByAssociation(association, storeRoomData, true);
};

export const getInteractionRoomData = async (
    persistenceRead: IPersistenceRead,
    userId: string
): Promise<storedRoom | null> => {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        `${userId}#RoomId`
    );
    const result = (await persistenceRead.readByAssociation(
        association
    )) as storedRoom[];
    return result && result.length ? result[0] : null;
};

export const getRoom = async (
    read: IRead,
    user: IUser
): Promise<IRoom | undefined> => {
    const roomFromStorage = await getInteractionRoomData(
        read.getPersistenceReader(),
        user.id
    );
    if (roomFromStorage) {
        const room = await read.getRoomReader().getById(roomFromStorage.roomId);
        return room;
    } else {
        return undefined;
    }
};
export const clearInteractionRoomData = async (
    persistence: IPersistence,
    userId: string
): Promise<void> => {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        `${userId}#RoomId`
    );
    await persistence.removeByAssociation(association);
};
