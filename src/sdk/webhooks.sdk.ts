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
import { ISubscription, storedRoomData } from "../definition";
import { events } from "../enums/index";

export class Subscription {
    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead
    ) {}

    // get all the subscription in the storage
    public async getAllSubscriptions(): Promise<Array<ISubscription>> {
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `subscription`
                ),
            ];
            let subscriptions: Array<ISubscription> =
                (await this.persistenceRead.readByAssociations(
                    associations
                )) as Array<ISubscription>;
            return subscriptions;
        } catch (error) {
            console.warn("Get All Subscription Error :", error);
            let subscriptions: Array<ISubscription> = [];
            return subscriptions;
        }
    }

    public async deleteSubscriptionByTeamId(
        team_id: string
    ): Promise<object[]> {
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
            return await this.persistence.removeByAssociations(associations);
        } catch (error) {
            console.warn("Delete Subscription By Hook Id Error :", error);
            return [{}];
        }
    }

    /**
     * This method is used to create a new subscription in persistance storage
     * @param name name of the file/team/project
     * @param event_name name of the event of that webhook
     * @param projects_id projectIds[] of the webhook
     * @param webhook_id webhook_id of the team
     * @param team_id team_id of the team
     * @param room IRoom object
     * @param user IUser object
     * @returns true if the subscription is deleted else false
     */
    public async storeSubscriptionByEvent(
        name: string,
        webhook_id: string,
        team_id: string,
        room: IRoom,
        user: IUser,
        event_name: string,
        projects_id?: string[],
        files_id?: string[]
    ): Promise<string> {
        const room_data: storedRoomData[] = [
            {
                room_id: room.id,
                project_ids: projects_id,
                file_ids: files_id,
            },
        ];
        console.log("room data - ", room_data);
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
                    RocketChatAssociationModel.MISC,
                    `team_id:${team_id}`
                ),

                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `event_name:${event_name}`
                ),
            ];

            const subscriptionRecord: ISubscription = {
                webhook_id,
                user_id: user.id,
                name,
                team_id,
                event_name,
                room_data,
            };

            const recordId = await this.persistence.updateByAssociations(
                associations,
                subscriptionRecord
            );
            console.log(
                "[4] - Stored subscription record ✅",
                subscriptionRecord
            );
            return recordId;
        } catch (error) {
            console.warn("Subscription Error :", error);
            return "";
        }
    }

    public async getSubscriptionsByTeam(
        team_id: string
    ): Promise<Array<ISubscription>> {
        let subscriptions: Array<ISubscription> = [];
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    "subscription"
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
            console.warn(
                "Get Subscriptions By teamId - ",
                team_id,
                " Error :",
                error
            );
            return subscriptions;
        }
        return subscriptions;
    }

    /**
     * This method is used to update the previous subscription
     * @param name name of the file/team/project
     * @param event_name name of event
     * @param projects_id array of project ids subscribed by this room
     * @param webhook_id webhook_id of the team
     * @param team_id team_id of the team
     * @param room IRoom object
     * @param user_id id of the user
     * @returns recordId of the updated subscription
     */

    public async updateSubscriptionByTeamId(
        name: string,
        webhook_id: string,
        team_id: string,
        room: IRoom,
        user_id: string,
        event_name: string,
        projects_id?: string[],
        files_id?: string[]
    ): Promise<string> {
        try {
            const room_data: storedRoomData[] = [
                {
                    room_id: room.id,
                    project_ids: projects_id,
                    file_ids: files_id,
                },
            ];
            console.log("room data - ", room_data);

            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `subscription`
                ),

                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `team_id:${team_id}`
                ),

                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `event_name:${event_name}`
                ),
            ];

            const subscriptionRecord: ISubscription = {
                webhook_id,
                user_id,
                name,
                team_id,
                event_name,
                room_data,
            };

            console.log(
                "[5] Updated Subscription record 🙋🏻‍♂️ - ",
                subscriptionRecord
            );

            const recordId = await this.persistence.updateByAssociations(
                associations,
                subscriptionRecord
            );
            return recordId;
        } catch (error) {
            return error.message;
        }
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

    public async deleteAllRoomSubscriptions(teamId: string): Promise<boolean> {
        try {
            const associations: Array<RocketChatAssociationRecord> = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `subscription`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    teamId
                ),
            ];
            await this.persistence.removeByAssociations(associations);
        } catch (error) {
            console.warn("Delete All Room Subsciption Error :", error);
            return false;
        }
        return true;
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
                    hook_id
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.USER,
                    event_type
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
