/* eslint-disable no-mixed-spaces-and-tabs */
import {
    IPersistence,
    IPersistenceRead
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord
} from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { ISubscription, storedRoomData } from '../definition';

export class Subscription {
    [x: string]: any;
    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead
    ) {}

    // Get all the subscription in the storage
    public async getAllSubscriptions(): Promise<ISubscription[]> {
        try {
            const associations: RocketChatAssociationRecord[] = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    'subscription'
                )
            ];
            const subscriptions: ISubscription[] =
                (await this.persistenceRead.readByAssociations(
                    associations
                )) as ISubscription[];
            return subscriptions;
        } catch (error) {
            console.warn('Get All Subscription Error :', error);
            const subscriptions: ISubscription[] = [];
            return subscriptions;
        }
    }

    // public async deleteSubscriptionByTeamId(
    // 	team_id: string,
    // ): Promise<Array<Record<string, unknown>>> {
    // 	try {
    // 		const associations: RocketChatAssociationRecord[] = [
    // 			new RocketChatAssociationRecord(
    // 				RocketChatAssociationModel.MISC,
    // 				'subscription',
    // 			),
    // 			new RocketChatAssociationRecord(
    // 				RocketChatAssociationModel.MISC,
    // 				`team_id:${team_id}`,
    // 			),
    // 		];
    // 		return await this.persistence.removeByAssociations(associations);
    // 	} catch (error) {
    // 		console.warn('Delete Subscription By Hook Id Error :', error);
    // 		return [{
    // 		}];
    // 	}
    // }

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
        projects_id: string[] | undefined,
        files_id: string[] | undefined
    ): Promise<string> {
        const room_data: storedRoomData[] = [
            {
                room_Id: room.id,
                project_Ids: projects_id,
                file_Ids: files_id
            }
        ];
        try {
            const associations: RocketChatAssociationRecord[] = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    'subscription'
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
                )
            ];

            const subscriptionRecord: ISubscription = {
                webhook_id,
                user_id: user.id,
                name,
                team_id,
                event_name,
                room_data
            };

            const recordId = await this.persistence.createWithAssociations(
                subscriptionRecord,
                associations
            );
            return recordId;
        } catch (error) {
            console.warn('Subscription Error :', error);
            return '';
        }
    }

    public async getSubscriptionsByTeam(
        team_id: string
    ): Promise<ISubscription[]> {
        let subscriptions: ISubscription[] = [];
        try {
            const associations: RocketChatAssociationRecord[] = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    'subscription'
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `team_id:${team_id}`
                )
            ];

            subscriptions = (await this.persistenceRead.readByAssociations(
                associations
            )) as ISubscription[];
        } catch (error) {
            console.warn(
                '[X] Get Subscriptions By teamId - ',
                team_id,
                ' Error :',
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
        room_data: storedRoomData[],
        team_id: string,
        event_name: string,
        webhook_id: string,
        user_id: string
    ): Promise<string> {
        try {
            const associations: RocketChatAssociationRecord[] = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    'subscription'
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
                )
            ];

            const subscriptionRecord: ISubscription = {
                webhook_id,
                user_id,
                name: 'subscription',
                team_id,
                event_name,
                room_data
            };
            const recordId = await this.persistence.updateByAssociations(
                associations, // associations may be different if it is creating a new record
                subscriptionRecord,
                true
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
    ): Promise<ISubscription[]> {
        try {
            const associations: RocketChatAssociationRecord[] = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    'subscription'
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `name:${name}`
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    event
                )
            ];
            const subscriptions: ISubscription[] =
                (await this.persistenceRead.readByAssociations(
                    associations
                )) as ISubscription[];
            return subscriptions;
        } catch (error) {
            console.warn('Get Subscribed Rooms Error :', error);
            const subscriptions: ISubscription[] = [];
            return subscriptions;
        }
    }

    public async getSubscriptionsByHookID(
        hook_id: string
    ): Promise<ISubscription[]> {
        let subscriptions: ISubscription[] = [];
        try {
            const associations: RocketChatAssociationRecord[] = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `webhook_id:${hook_id}`
                )
            ];

            subscriptions = (await this.persistenceRead.readByAssociations(
                associations
            )) as ISubscription[];
        } catch (error) {
            console.warn('Get Subscriptions By Hook id Error :', error);
            return subscriptions;
        }

        return subscriptions;
    }

    public async deleteAllTeamSubscriptions(
        team_id: string
    ): Promise<object[]> {
        try {
            const associations: RocketChatAssociationRecord[] = [
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    'subscription'
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    `team_id:${team_id}`
                )
            ];
            return await this.persistence.removeByAssociations(associations);
        } catch (error) {
            console.warn('Delete All Room Subscription Error :', error);
            return [];
        }
    }
}
