/* eslint-disable no-mixed-spaces-and-tabs */
import {IHttp,
	IModify,
	IPersistence,
	IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {IRoom} from '@rocket.chat/apps-engine/definition/rooms';
import {UIKitViewSubmitInteractionContext} from '@rocket.chat/apps-engine/definition/uikit';

import {FigmaApp} from '../../FigmaApp';
import {getTeamID, getWebhookUrl} from '../sdk/subscription.sdk';
import {getAccessTokenForUser} from '../storage/users';
import {Subscription} from '../sdk/webhooks.sdk';
import {sendNotificationToUsers} from '../lib/messages';
import {IProjectModalData} from '../definition';
import { events } from '../enums/index';
import { storedRoomData } from '../definition';
export class AddSubscription {
	constructor(
		private readonly app: FigmaApp,
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly modify: IModify,
		private readonly persistence: IPersistence,
	) {}

	public async run(context: UIKitViewSubmitInteractionContext, room: IRoom) {
		const {user, view} = context.getInteractionData();
		const {state}: IProjectModalData = view as any;
		const event_type = state?.selectedEvents.events;
		const project_Ids: string[] | undefined = state?.selectedProjects?.projects;
		const file_Ids: string[] | undefined = state?.selectedFiles?.files;
		const team_id = getTeamID(state?.team_url.url);
		const webhook_url = await getWebhookUrl(this.app);

		// Refer this fig jam file for the flow of this code https://www.figma.com/file/hufAYVAtxhcxv56WKM0jLi/Figma-App?node-id=7%3A308

		try {
			if (user.id) {
				if (
					typeof team_id === undefined
                    || typeof event_type === undefined
				) {
					await sendNotificationToUsers(
						this.read,
						this.modify,
						user,
						room,
						'Invalid Input !',
					);
				} else {
					console.log('0');
					const accessToken = await getAccessTokenForUser(
						this.read,
						user,
					);
					if (!accessToken) {
						await sendNotificationToUsers(
							this.read,
							this.modify,
							user,
							room,
							'You are not connect to figma!',
						);
					} else {
						const url = await getWebhookUrl(this.app);
						const subscriptionStorage = new Subscription(
							this.persistence,
							this.read.getPersistenceReader(),
						);

						subscriptionStorage.getAllSubscriptions().then(r => {
							// For every subscription print event type and team id

							r.forEach(subscription => {
								console.log(subscription);
							});
						});
						//    subscriptionStorage.deleteAllTeamSubscriptions(team_id).then((res) => {
						//           console.log('deleted subscriptions - ', res);
						//       });
						  subscriptionStorage
						  	.getSubscriptionsByTeam(team_id)
						  	.then(subscriptions => {
						  		if (subscriptions && subscriptions.length) {
									console.log('1');
									for (const subscription of subscriptions) {
										console.log('2');
						 				if (subscription.team_id === team_id && subscription.room_data.length > 0 ) {// now we are entering the room data zone to modify it.
											for (const room_data of subscription.room_data) {
												console.log('3');
						 						if (room_data.room_Id === room.id) { // room id will be unique for every object inside room_data
													if (event_type.includes(subscription.event_name) && room_data.project_Ids) {
														console.log('4');
						 								const newRoomData: storedRoomData[] = [];
														if (project_Ids) {
															for (const project_id of room_data.project_Ids) {// now the room id is there update its project ids if they exist with the passed project ids
																if (project_Ids.includes(project_id)) {
																	newRoomData.push({
																		room_Id: room.id,
																		project_Ids: project_Ids,
																		file_Ids: room_data.file_Ids!,
																	});
																}
															}
														} else if (file_Ids) {
															for (const file_id of room_data.file_Ids!) { // the room id is there update its file ids if they exist with the passed file ids
																if (file_Ids.includes(file_id)) {
																	newRoomData.push({
																		room_Id: room.id,
																		project_Ids: room_data.project_Ids!,
																		file_Ids: file_Ids,
																	});
																}
															}
														} else {
															console.log('file_ids and Project_ids array are undefined');
														}
						 								subscriptionStorage.updateSubscriptionByTeamId(newRoomData, subscription.team_id, subscription.event_name, subscription.webhook_id, user.id)
						 									.then((res) => console.log('updated subscription - ', res))
						 									.catch((err) => console.log('error updating subscription for existing room - ', err)
						 									);
						 							} else {// if event type is not passed by user then remove this room id from the room data as user don't want to subscribe for that event
						 								const newRoomData: storedRoomData[] = [
						 									{
						 										room_Id: room.id,
						 										project_Ids: room_data.project_Ids,
						 										file_Ids: room_data.file_Ids,
						 									},
						 								];
						 								subscriptionStorage.updateSubscriptionByTeamId(newRoomData, subscription.team_id, subscription.event_name, subscription.webhook_id, user.id)
						 									.then(res => console.log('for new room - ', res))
						 									.catch(err => console.log('error updating subscription for new room - ', err));
						 							}
						 						} else {
						 							if (event_type.includes(subscription.event_name)) {
						 								const newRoomData: storedRoomData[] = [...subscription.room_data, {
						 									room_Id: room.id,
						 									project_Ids: project_Ids,
															file_Ids: file_Ids,
						 								}];
						 								subscriptionStorage.updateSubscriptionByTeamId(newRoomData, subscription.team_id, subscription.event_name, subscription.webhook_id, user.id)
						 									.then(res => console.log('updated subscription for new room - ', res))
						 									.catch(err => console.log('error updating subscription for new room - ', err));
						 							} else {
						 							  //this subscription event user dont want to subscribe see here
														console.log('this subscription event user dont want to subscribe to', subscription.event_name);
						 							}
						 						}
						 						// lets update only those whose event matches with previous events and remove room from those events which are not there in the current passed data by user
						 					}
						 				} else {
						 			     // If the room does not exist then update the subscription
											console.log('subscription does not exist', subscription.team_id, subscription.room_data);
						 				}
						 			}
						  		} else {
						 			[
						 				events.COMMENT, events.DELETE, events.LIBRARY_PUBLISHED, events.UPDATE, events.VERSION_UPDATE,
						  			].map((event, key) => { // our main logic is to hook into figma 5 times for every event type
						  				const data = {
						  					event_type: event, team_id,
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
						  							}, data
						  						},
						  					)
						  					.then(async response => { // when a hook is created successfully we save it in db
						  						if (response.data.error) {
						  							throw new Error(response.data.error,);
						  						} else {
													let projects_to_be_stored: string[] | undefined; // we need to store projects + files + room id in db subscribed by particular room
													let files_to_be_stored: string[] | undefined;
						  							// todo: if subscription is for team add all the projects ( will check project ids for that )

													// for team subscription we need to store only room id and all the files in that room.
						  							if (project_Ids && project_Ids.length === 0) {
						  								console.log('[4] - team subscription');
						  								this.http.get(
						  									`https://api.figma.com/v1/teams/${team_id}/projects`,
						  									{
						  										headers: {
						  											Authorization: `Bearer ${accessToken?.token}`
						  										}
						  									},
						  								).then(async response => {
						  									// we got the response of all the projects from figma now we will have to store them inside in project_Ids array
						  	 								projects_to_be_stored = response.data.projects.map((project) => project.id);
						  									await subscriptionStorage.storeSubscriptionByEvent(
						  										'subscription',
						  										response.data.id,
						  										team_id,
						  										room,
						  										user,
						  										event,
																projects_to_be_stored,
																files_to_be_stored,
						  									);
						  								});
						  							} else {
														// for project and file subscription
														event_type.forEach(async useSentEvent => {
															// for each event we will look if user passed the same event and then store files and projects
															if (useSentEvent === event && project_Ids && project_Ids.length > 0) {
																projects_to_be_stored = project_Ids;
																await Promise.all(project_Ids.map(async (project_id) => {
																	await this.http.get(
																		`https://api.figma.com/v1/projects/${project_id}/files`,
																		{
																			headers: {
																				Authorization: `Bearer ${accessToken?.token}`
																			}
																		},
																	).then(async response => {
																		console.log('response from figma while storing all the projects into db - ', response);
																		// we got the response of all the files from figma now we will have to store them inside file_Ids array in room data
																		// we need this in order to identify if a user subscribed to a particular project does the figma event file is in that project or not.
																		files_to_be_stored = response.data.files.map((file) => file.id);
																		return await subscriptionStorage.storeSubscriptionByEvent(
																			'subscription',
																			response.data.id,
																			team_id,
																			room,
																			user,
																			event,
																			projects_to_be_stored,
																			files_to_be_stored,
																		);

																	});
																}));
															}
															// for file
															else if (useSentEvent === event && file_Ids && file_Ids.length > 0) {
																files_to_be_stored = file_Ids;
																await subscriptionStorage.storeSubscriptionByEvent(
																	'subscription',
																	response.data.id,
																	team_id,
																	room,
																	user,
																	event,
																	projects_to_be_stored,
																	files_to_be_stored,
																);
															}
															// for those events which user not subscribed
															await subscriptionStorage.storeSubscriptionByEvent(
																'subscription',
																response.data.id,
																team_id,
																room,
																user,
																event,
																projects_to_be_stored,
																files_to_be_stored,
															);
														});
						  							}


						  						}
						  					})
						  					.catch(e => console.log('error storing subscription in storage - ', e, ' - for - ', key, event));
						  			});
						  		}
						  	})
						  	.catch (err => {
						  		console.log(
						  			'[2] - Error getting subscriptions from storage - ',
						  			err,
						  		);
						  	},
						  	);
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
