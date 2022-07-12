import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';

import { FigmaApp } from '../../FigmaApp';
import { getWebhookUrl } from '../sdk/subscription.sdk';
import { getAccessTokenForUser } from '../storage/users';
import { Subscription } from '../sdk/webhooks.sdk';
import { getInteractionRoomData } from '../storage/room';
import { sendNotificationToUsers } from '../lib/messages';
import { createSubscription, updateSubscription } from '../helpers/Figma.sdk';

export class AddSubscription {
    constructor(
        private readonly app: FigmaApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence,
    ) { }

    public async run(context: UIKitViewSubmitInteractionContext, teamId: string) {

        const { user, view } = context.getInteractionData();
        const event_type = ['FILE_COMMENT', 'FILE_UPDATE'];
        const team_id = teamId

        try {
            if (user.id) {
                const { roomId } = await getInteractionRoomData(this.read.getPersistenceReader(), user.id);

                        if (roomId) {
                            let room = await this.read.getRoomReader().getById(roomId) as IRoom;

                            if (typeof (team_id) == undefined || typeof (event_type) == undefined) {

                                await sendNotificationToUsers(this.read, this.modify, user, room, "Invalid Input !");
                            } else {
                                let accessToken = await getAccessTokenForUser(this.read, user);
                                if (!accessToken) {

                                    await sendNotificationToUsers(this.read, this.modify, user, room, "Login To Github !");
                                } else {
                                    //if we have a webhook for the repo and our room requires the same event,we just make our entries to the apps storage instead of making a new hook
                                    //if we have a hook but we dont have all the events, we send in a patch request,

                                    let url = await getWebhookUrl(this.app);
                                    console.log('url -', url)
                                    let subscriptionStorage = new Subscription(this.persistence, this.read.getPersistenceReader());
                                    let subscribedEvents = new Map<string, boolean>;
                                    let hookId = "";


                                    let subscriptions = await subscriptionStorage.getSubscriptionsByTeam(team_id, user.id);
                                    console.log(subscriptions)
                                    if (subscriptions && subscriptions.length) {
                                        for (let subscription of subscriptions) {
                                            subscribedEvents.set(subscription.event, true);
                                            if (hookId == "") {
                                                hookId = subscription.webhook_id;
                                            }
                                        }
                                    }
                                    let additionalEvents = 0;
                                    for (let event of event_type) {
                                        if (!subscribedEvents.has(event)) {
                                            additionalEvents++;
                                            subscribedEvents.set(event, true);
                                        }
                                    }
                                   let response: any;
                                   //if hook is null we create a new hook, else we add more events to the new hook
                                   if (hookId == "") {
                                       response = await createSubscription(this.http, team_id, url, accessToken.token, event_type);
                                   }
                                     else {
                                         //if hook is already present, we just need to send a patch request to add new events to existing hook
                                         let newEvent_type: Array<string> = [];
                                         for (let [event, present] of subscribedEvents) {
                                             newEvent_type.push(event);
                                         }
                                         if (additionalEvents && newEvent_type.length) {
                                             response = await updateSubscription(this.http, team_id, accessToken.token, hookId, newEvent_type);
                                         }
                                     }
                                     let createdEntry = false;
                                     //subscribe rooms to hook events
                                     for (let event of event_type) {
                                         createdEntry = await subscriptionStorage.storeSubscription(team_id, event, response?.id, room, user);
                                     }
                                     if (!createdEntry) {
                                         throw new Error("Error creating new subscription entry");
                                     }
                                     await sendNotificationToUsers(this.read, this.modify, user, room, `Subscibed to ${team_id} ✔️`);
                                }

                            }
                        }
            }
        } catch (error) {
            console.log('error : ', error);
        }

        return {
            success: true,
        };
    }
}
