import {
    IHttp,
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import {
    IUIKitModalResponse,
    TextObjectType,
    UIKitViewSubmitInteractionContext
} from '@rocket.chat/apps-engine/definition/uikit';

import { FigmaApp } from '../../FigmaApp';
import { getTeamID, getWebhookUrl } from '../sdk/subscription.sdk';
import { getAccessTokenForUser } from '../storage/users';
import { Subscription } from '../sdk/webhooks.sdk';
import { botMessageChannel, botNotifyCurrentUser } from '../lib/messages';
import { IProjectModalData } from '../definition';
import { events } from '../enums/enums';
import { WebhookSubscription } from '../handlers/subscription/createSubscriptionHandler';
import { updateSubscriptionHandler } from '../handlers/subscription/updateSubscriptionHandler';
import { postRequest } from '../helpers/Figma.sdk';
export class AddSubscription {
    constructor(
        private readonly app: FigmaApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async run(
        context: UIKitViewSubmitInteractionContext,
        room: IRoom
    ): Promise<
        | {
              success: boolean;
          }
        | string
        | IUIKitModalResponse
    > {
        const { user, view } = context.getInteractionData();
        const { state }: IProjectModalData = view as any; //todo: fix this
        const event_type = state?.selectedEvents.events;

        const project_Ids: string[] | undefined =
            state?.selectedProjects?.projects;
        const file_Ids: string[] | undefined = state?.selectedFiles?.files;
        const team_id = getTeamID(state?.team_url.url);

        // Refer this fig jam file for the flow of this code https://www.figma.com/file/hufAYVAtxhcxv56WKM0jLi/Figma-App?node-id=7%3A308
        try {
            if (user.id) {
                if (
                    typeof team_id === undefined ||
                    typeof event_type === undefined
                ) {
                    await botNotifyCurrentUser(
                        this.read,
                        this.modify,
                        user,
                        room,
                        'Invalid Input !'
                    );
                } else {
                    const accessToken = await getAccessTokenForUser(
                        this.read,
                        user
                    );
                    if (!accessToken) {
                        await botNotifyCurrentUser(
                            this.read,
                            this.modify,
                            user,
                            room,
                            'You are not connect to figma!'
                        );
                    } else {
                        const url = await getWebhookUrl(this.app);
                        const subscriptionStorage = new Subscription(
                            this.persistence,
                            this.read.getPersistenceReader()
                        );
                        const createWebhookSubscription =
                            await new WebhookSubscription(
                                this.read,
                                this.http,
                                this.modify,
                                this.persistence
                            );
                        // subscriptionStorage
                        // 	.getAllSubscriptions()
                        // 	.then((r) => {
                        // 		r.forEach((subscription) => {
                        // 			 console.log(
                        // 			 	'-1 - all subscriptions - ',
                        // 				subscription.room_data,
                        // 				subscription.event_name
                        // 			 );
                        // 		});
                        // 	})
                        // 	.catch((e) => {
                        // 		console.log(
                        // 			'Error in getting all subscriptions',
                        // 			e
                        // 		);
                        // 	});

                        subscriptionStorage
                            .deleteAllTeamSubscriptions(team_id)
                            .then((res) => {
                                console.log('deleted subscriptions - ', res);
                            });
                        // let count = 0; // this counter we will use if if there are only 4 or less hooks left to create in figma we will notify the use that subscription was unsuccessful and delete some in figma
                        // subscriptionStorage
                        //     .getSubscriptionsByTeam(team_id)
                        //     .then(async (subscriptions) => {
                        //         if (subscriptions && subscriptions.length) {
                        //             for (const subscription of subscriptions) {
                        //                 console.log(
                        //                     '1 - found subscription for event 🤯 ',
                        //                     subscription.event_name
                        //                 );
                        //                 if (
                        //                     subscription.team_id === team_id &&
                        //                     subscription.room_data.length > 0
                        //                 ) {
                        //                     // now we are entering the room data zone to modify it.
                        //                     for (const room_data of subscription.room_data) {
                        //                         console.log(
                        //                             '2 - team id matched 🏡 ',
                        //                             room_data
                        //                         );
                        //                         updateSubscriptionHandler(
                        //                             room,
                        //                             user,
                        //                             room_data,
                        //                             event_type,
                        //                             subscription,
                        //                             project_Ids,
                        //                             file_Ids,
                        //                             subscriptionStorage
                        //                         );
                        //                         // lets update only those whose event matches with previous events and remove room from those events which are not there in the current passed data by user
                        //                     }
                        //                 } else {
                        //                     // If the room does not exist then update the subscription
                        //                     console.log(
                        //                         '2 - subscription does not exist ❌ ',
                        //                         subscription.team_id,
                        //                         subscription.room_data
                        //                     );
                        //                 }
                        //             }
                        //         } else {
                        //             console.log(' 1 - no subscription found');
                        //             let counter = 0;
                        //             [
                        //                 events.COMMENT,
                        //                 events.DELETE,
                        //                 events.LIBRARY_PUBLISHED,
                        //                 events.UPDATE,
                        //                 events.VERSION_UPDATE
                        //             ].map(async (event) => {
                        //                 // our main logic is to hook into figma 5 times for every event type
                        //                 const data = {
                        //                     event_type: event,
                        //                     team_id: team_id,
                        //                     endpoint: url,
                        //                     passcode: room.id, // Send room id as passcode
                        //                     description: room.id
                        //                 };

                        //                 // we send request to figma webhook to create a hook for every event ( runs 5 times )
                        //                 await postRequest(
                        //                     this.read,
                        //                     context,
                        //                     this.http,
                        //                     'https://api.figma.com/v2/webhooks',
                        //                     data
                        //                 )
                        //                     .then(async (response) => {
                        //                         // when a hook is created successfully we save it in db
                        //                         if (
                        //                             response.data.error === true
                        //                         ) {
                        //                             // todo : manage this logic in a better way which covers all the edge cases. If for any request there is a error response then delete the created hooks and send the error message to user
                        //                             if (counter === 4) {
                        //                                 await botNotifyCurrentUser(
                        //                                     this.read,
                        //                                     this.modify,
                        //                                     user,
                        //                                     room,
                        //                                     response.data.reason
                        //                                 );
                        //                                 // todo: for now figma gives a reason and says to delete a webhook but modify it to say at least 5 webhooks.
                        //                             } else {
                        //                                 console.log(
                        //                                     'response data error'
                        //                                 );
                        //                             }
                        //                         } else {
                        //                             await createWebhookSubscription
                        //                                 .createWebhookResponseHandler(
                        //                                     context,
                        //                                     response,
                        //                                     room,
                        //                                     user,
                        //                                     project_Ids,
                        //                                     file_Ids,
                        //                                     team_id,
                        //                                     event_type,
                        //                                     event
                        //                                 )
                        //                                 .then(async () => {
                        //                                     if (counter === 4) {
                        //                                         // check for what the subscription is created
                        //                                         // if it is created for a single or some files then sned htose files with images and link to those files
                        //                                         // if for team then send a message with link to the project
                        //                                         // if for project then list the name of all the projects
                        //                                         // now how to check for what the subscription is created
                        //                                         // for team both project and files will be empty
                        //                                         // validation
                        //                                         console.log(
                        //                                             ' subscription for team - ',
                        //                                             project_Ids,
                        //                                             file_Ids
                        //                                         );
                        //                                         if (
                        //                                             project_Ids?.length ===
                        //                                                 0 &&
                        //                                             file_Ids?.length ===
                        //                                                 0
                        //                                         ) {
                        //                                             console.log(
                        //                                                 'team'
                        //                                             );
                        //                                             await botNotifyCurrentUser(
                        //                                                 this
                        //                                                     .read,
                        //                                                 this
                        //                                                     .modify,
                        //                                                 user,
                        //                                                 room,
                        //                                                 'Subscription created for team'
                        //                                             );
                        //                                         } else if (
                        //                                             project_Ids &&
                        //                                             file_Ids?.length ===
                        //                                                 0
                        //                                         ) {
                        //                                             console.log(
                        //                                                 'project'
                        //                                             );
                        //                                             await botNotifyCurrentUser(
                        //                                                 this
                        //                                                     .read,
                        //                                                 this
                        //                                                     .modify,
                        //                                                 user,
                        //                                                 room,
                        //                                                 'Subscription created for project'
                        //                                             );
                        //                                         } else if (
                        //                                             project_Ids?.length ===
                        //                                                 0 &&
                        //                                             file_Ids
                        //                                         ) {
                        //                                             console.log(
                        //                                                 'file'
                        //                                             );
                        //                                             await botNotifyCurrentUser(
                        //                                                 this
                        //                                                     .read,
                        //                                                 this
                        //                                                     .modify,
                        //                                                 user,
                        //                                                 room,
                        //                                                 'Subscription created for file'
                        //                                             );
                        //                                         }

                        //                                         // const block =
                        //                                         //     this.modify
                        //                                         //         .getCreator()
                        //                                         //         .getBlockBuilder();
                        //                                         // block.addSectionBlock(
                        //                                         //     {
                        //                                         //         text: {
                        //                                         //             text: `A new subscriptions is created successfully by ${user.name}. You will start receiving notifications for updates and comments inside the team in this channel.`,
                        //                                         //             type: TextObjectType.PLAINTEXT
                        //                                         //         }
                        //                                         //     }
                        //                                         // );
                        //                                         // await botMessageChannel(
                        //                                         //     this.read,
                        //                                         //     this.modify,
                        //                                         //     room,
                        //                                         //     block
                        //                                         // );
                        //                                     }
                        //                                     return;
                        //                                 })
                        //                                 .catch(async () => {
                        //                                     if (count === 4) {
                        //                                         await botNotifyCurrentUser(
                        //                                             this.read,
                        //                                             this.modify,
                        //                                             user,
                        //                                             room,
                        //                                             'error subscribing to the file please try again'
                        //                                         );
                        //                                     }
                        //                                     return;
                        //                                 });
                        //                         }
                        //                         counter++;
                        //                     })
                        //                     .catch((e) => {
                        //                         botNotifyCurrentUser(
                        //                             this.read,
                        //                             this.modify,
                        //                             user,
                        //                             room,
                        //                             `Error Subscribing to file from figma, ${e.message}`
                        //                         );
                        //                     })
                        //                     .finally(() => count++);
                        //             });
                        //         }
                        //     })
                        //     .catch(async (err) => {
                        //         return await botNotifyCurrentUser(
                        //             this.read,
                        //             this.modify,
                        //             user,
                        //             room,
                        //             `Error Subscribing to file from figma, ${err.message}`
                        //         );
                        //     });
                    }
                }
            }
        } catch (error) {
            await botNotifyCurrentUser(
                this.read,
                this.modify,
                user,
                room,
                `Error Subscribing to file from figma, ${error.message}`
            );
        }

        return {
            success: true
        };
    }
}
