/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import {IHttp,
	IModify,
	IPersistence,
	IRead} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';

import { FigmaApp } from '../../FigmaApp';
import { getTeamID, getWebhookUrl } from '../sdk/subscription.sdk';
import { getAccessTokenForUser } from '../storage/users';
import { Subscription } from '../sdk/webhooks.sdk';
import { sendMessage, sendNotificationToUsers } from '../lib/messages';
import { IProjectModalData } from '../definition';
import { events } from '../enums/enums';
import { storedRoomData } from '../definition';
import { newProjectSubscription } from './newProjectSubscription';
import { newFileSubscription } from './newFileSubscription';
import { newTeamSubscription } from './newTeamSubscription';
import { createWebhookResponseHandler } from './createWebhookResponseHandler';
import { updateSubscriptionHandler } from './updateSubscriptionHandler';

export class AddSubscription {
	constructor(
        private readonly app: FigmaApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
	) {}

	public async run(context: UIKitViewSubmitInteractionContext, room: IRoom) {
		const { user, view } = context.getInteractionData();
		const { state }: IProjectModalData = view as any;
		const event_type = state?.selectedEvents.events;
		const project_Ids: string[] | undefined =
            state?.selectedProjects?.projects;
		const file_Ids: string[] | undefined = state?.selectedFiles?.files;
		const team_id = getTeamID(state?.team_url.url);
		const webhook_url = await getWebhookUrl(this.app);

		// Refer this fig jam file for the flow of this code https://www.figma.com/file/hufAYVAtxhcxv56WKM0jLi/Figma-App?node-id=7%3A308

		try {
			if (user.id) {
				if (
					typeof team_id === undefined ||
                    typeof event_type === undefined
				) {
					await sendNotificationToUsers(
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
						await sendNotificationToUsers(
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

						console.log('user sent data - ', state);
						subscriptionStorage
							.getAllSubscriptions()
							.then((r) => {
								console.log(r);
								r.forEach((subscription) => {
									console.log(
										'ALL SUBSCRIPTIONS - ',
										subscription.room_data
									);
								});
							})
							.catch((e) => {
								console.log(
									'Error in getting all subscriptions',
									e
								);
							});

						// subscriptionStorage.deleteAllTeamSubscriptions(team_id).then((res) => {
						//        console.log('deleted subscriptions - ', res);
						//    });
						let count = 0; // this counter we will use if if there are only 4 or less hooks left to create in figma we will notify the use that subscription was unsuccessful and delete some in figma
						subscriptionStorage
							.getSubscriptionsByTeam(team_id)
							.then((subscriptions) => {
								if (subscriptions && subscriptions.length) {
									console.log('1');
									for (const subscription of subscriptions) {
										console.log('2');
										if (
											subscription.team_id === team_id &&
                                            subscription.room_data.length > 0
										) {
											// now we are entering the room data zone to modify it.
											for (const room_data of subscription.room_data) {
												console.log('3');
												return updateSubscriptionHandler(
													room,
													user,
													room_data,
													event_type,
													subscription,
													project_Ids,
													file_Ids,
													subscriptionStorage
												);
												// lets update only those whose event matches with previous events and remove room from those events which are not there in the current passed data by user
											}
										} else {
											// If the room does not exist then update the subscription
											console.log(
												'subscription does not exist',
												subscription.team_id,
												subscription.room_data
											);
										}
									}
									return;
								} else {
									[
										events.COMMENT,
										events.DELETE,
										events.LIBRARY_PUBLISHED,
										events.UPDATE,
										events.VERSION_UPDATE
									].map((event) => {
										// our main logic is to hook into figma 5 times for every event type
										const data = {
											event_type: event,
											team_id,
											endpoint: url,
											passcode: room.id, // Send room id as passcode
											description: room.id
										};
										this.http // we send request to figma webhook to create a hook fro every event
											.post(
												'https://api.figma.com/v2/webhooks',
												{
													headers: {
														Authorization: `Bearer ${accessToken?.token}`
													},
													data
												}
											)
											.then(async (response) => {
												// when a hook is created successfully we save it in db
												if (
													response.statusCode === 400
												) {
													// todo : manage this logic in a better way which covers all the edge cases. If for any request there is a error response then delete the created hooks and send the error message to user
													if (count === 4) {
														await sendNotificationToUsers(
															this.read,
															this.modify,
															user,
															room,
															response.data.reason
														);
														// todo: for now figma gives a reason and says to delete a webhook but modify it to say at least 5 webhooks.
													}
													return;
												} else {
													return createWebhookResponseHandler(
														this.persistence,
														this.read,
														this.http,
														response,
														project_Ids,
														file_Ids,
														room,
														accessToken,
														team_id,user,
														event_type,
														event,
													);
												}
											})
											.catch((e) => {
												sendMessage(
													this.modify,
													room,
													user,
													`Error Subscribing to file from figma, ${e.message}`
												);
												return;
											})
											.finally(() => count++);
									});
									return;
								}
							})
							.catch((err) => {
								console.log(
									'Error getting subscriptions from storage - ',
									err
								);
								return;
							});
					}

					return;
				}
			}
		} catch (error) {
			console.log('error user id does not exist : ', error);
		}

		return {
			success: true
		};
	}
}
