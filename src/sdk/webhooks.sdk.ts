import {
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { ISubscription } from "../definition";

export class Subscription {
    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead
    ) {}

    /**
     * This method is used to get the subscription
     * @param name name of the file/team/project
     * @param event event[] of the webhook
     * @param projects projectIds[] of the webhook
     * @param webhook_id webhook_id of the team
     * @param team_id team_id of the team
     * @param room IRoom object
     * @param user IUser object
     * @returns true if the subscription is deleted else false
     */

    public async storeSubscription(
        name: string,
        event: string[],
        projects: string[],
        webhook_id: string,
        team_id: string,
        room: IRoom,
        user: IUser
    ): Promise<boolean> {
        console.log("store by room id - ", team_id);
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `subscription`
                ),

                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `webhook_id:${webhook_id}`
                ),

                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.ROOM,
                    room.id
                ),

                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.USER,
                    `${team_id}`
                ),
            ];

            const subscriptionRecord: ISubscription = {
                webhook_id,
                user: user.id,
                name,
                room: room.id,
                projects,
                team_id,
                events: event,
            };

            const recordId = await this.persistence.updateByAssociations(
                associations,
                subscriptionRecord
            );

            console.log("subscription stored ✅✅✅✅✅✅", recordId);
        } catch (error) {
            console.warn("Subscription Error :", error);
            return false;
        }
        return true;
    }

    /**
     * This method is used to get the subscription room by web
     * @param name name of the file/team/
     * @param event event name of the webhook
     * @returns true if the subscription is deleted else false
     */
    public async getSubscribedRooms(
        name: string,
        event: string
    ): Promise<Array<ISubscription>> {
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `subscription`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `name:${name}`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    event
                ),
            ];
            let subscriptions: Array<ISubscription> =
                (await this.persistenceRead.readByAssociations(
                    associations
                )) as Array<ISubscription>;
            return subscriptions;
        } catch (error) {
            console.warn("Get Subscribed Rooms Error :", error);
            let subscriptions: Array<ISubscription> = [];
            return subscriptions;
        }
    }

    public async getSubscriptions(
        team_id: string
    ): Promise<Array<ISubscription>> {
        console.log("search by room id - ", team_id);
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `subscription`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.ROOM,
                    team_id
                ),
            ];
            let subscriptions: Array<ISubscription> =
                (await this.persistenceRead.readByAssociations(
                    associations
                )) as Array<ISubscription>;
            return subscriptions;
        } catch (error) {
            console.warn("Get Subscription Error :", error);
            let subscriptions: Array<ISubscription> = [];
            return subscriptions;
        }
    }

    public async deleteSubscriptions(
        repoName: string,
        event: string,
        roomId: string
    ): Promise<boolean> {
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `subscription`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `repo:${repoName}`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.ROOM,
                    roomId
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    event
                ),
            ];
            await this.persistence.removeByAssociations(associations);
        } catch (error) {
            console.warn("Delete Subsciption Error :", error);
            return false;
        }
        return true;
    }
    public async deleteSubscriptionsByRepoUser(
        repoName: string,
        roomId: string,
        userId: string
    ): Promise<boolean> {
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `subscription`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `repo:${repoName}`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.USER,
                    `${userId}`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.ROOM,
                    roomId
                ),
            ];
            await this.persistence.removeByAssociations(associations);
        } catch (error) {
            console.warn("Delete Subsciption Error :", error);
            return false;
        }
        return true;
    }

    public async deleteAllRoomSubscriptions(roomId: string): Promise<boolean> {
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `subscription`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.ROOM,
                    roomId
                ),
            ];
            await this.persistence.removeByAssociations(associations);
        } catch (error) {
            console.warn("Delete All Room Subsciption Error :", error);
            return false;
        }
        return true;
    }

    public async getSubscriptionsByTeam(
        team_id: string,
    ): Promise<Array<ISubscription>> {
        let subscriptions: Array<ISubscription> = [];
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `subscription`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `team_id:${team_id}`
                ),
            ];
            subscriptions = (await this.persistenceRead.readByAssociations(
                associations
            )) as Array<ISubscription>;
        } catch (error) {
            console.warn("Get Subscriptions By Repo Error :", error);
            return subscriptions;
        }
        return subscriptions;
    }
    public async getSubscriptionsByHookID(
        hook_id: string,
        event_type: string
    ): Promise<Array<ISubscription>> {
        let subscriptions: Array<ISubscription> = [];
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `subscription`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `hook_id:${hook_id}`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.USER,
                    `${event_type}`
                ),
            ];
            subscriptions = (await this.persistenceRead.readByAssociations(
                associations
            )) as Array<ISubscription>;
        } catch (error) {
            console.warn("Get Subscriptions By Hook id Error :", error);
            return subscriptions;
        }
        return subscriptions;
    }
}
