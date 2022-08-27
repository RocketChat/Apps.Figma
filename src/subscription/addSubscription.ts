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
		const project_Ids: string[] |  undefined = state?.selectedProjects?.projects;
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
						  		console.log('[3]- subscription found now here - ', subscriptions);
						  		if (subscriptions && subscriptions.length) {
						 			for (const subscription of subscriptions) {
						 				// For every subscription from those 5
						 				console.log('[4] - see team id matched here');
						 				if (subscription.team_id === team_id && subscription.room_data.length > 0 && project_Ids) {
						 					console.log('[5] - room_data in subscription exists and team id matched to the subscription team id - ', subscription);
						 					// now we are entering the room data zone to modify it.
						 					for (const room_data of subscription.room_data) {
						 						console.log('[6] -  now for room data - ', room_data);
						 						if (room_data.room_id === room.id) { // room id will be unique for every object inside room_data
						 							console.log('[9] - room id matched to the current room id');
						 							if (event_type.includes(subscription.event_name) && room_data.project_ids) {
						 								const newRoomData: storedRoomData[] = [];
						 								// now the room id is there update its project ids and file ids with the passed project ids and file ids
						 								for (const project_id of room_data.project_ids) {
						 									if (project_Ids.includes(project_id)) {
						 										newRoomData.push({
						 											room_id: room.id,
						 											project_ids: project_Ids,
						 											file_ids: room_data.file_ids,
						 										});
						 									}
						 								}
						 								console.log('[10] - new room data - ', newRoomData);
						 								subscriptionStorage.updateSubscriptionByTeamId(newRoomData, subscription.team_id, subscription.event_name, subscription.webhook_id, user.id)
						 									.then((res) => console.log('[14] - updated subscription - ', res))
						 									.catch((err) => console.log('[14] - error updating subscription for existing room - ', err)
						 									);
						 							} else {
						 								// if event type is not passed by user then remove this room id from the room data as user dont want to subscribe for that event
						 								console.log('[11] - event type not matched for the passed event so we will remove this room from that event - ', event_type.includes(subscription.event_name));
						 								const newRoomData: storedRoomData[] = [
						 									{
						 										room_id: room.id,
						 										project_ids: room_data.project_ids,
						 										file_ids: room_data.file_ids,
						 									},
						 								];
						 								subscriptionStorage.updateSubscriptionByTeamId(newRoomData, subscription.team_id, subscription.event_name, subscription.webhook_id, user.id)
						 									.then(res => console.log('[4] - for new room - ', res))
						 									.catch(err => console.log('[4] - error updating subscription for new room - ', err));
						 							}
						 							console.log('-------------------------------');
						 						} else {
						 							if (event_type.includes(subscription.event_name)) {
						 								console.log('[8] room id did not match to the current room id for - ', subscription.event_name);
						 								const newRoomData: storedRoomData[] = [...subscription.room_data, {
						 									room_id: room.id,
						 									project_ids: project_Ids,
						 								}];
						 								console.log('[9] as it was a fresh new room we appended a new room record in room-data - ', newRoomData);
						 								subscriptionStorage.updateSubscriptionByTeamId(newRoomData, subscription.team_id, subscription.event_name, subscription.webhook_id, user.id)
						 									.then(res => console.log('[4] - updated subscription for new room - ', res))
						 									.catch(err => console.log('[4] - error updating subscription for new room - ', err));
						 							} else {
						 								console.log('[8] this subscription event user dont want to subscribe see here - ', event_type.includes(subscription.event_name));
						 							}
						 						}
						 						// lets update only those whose event matches with previous events and remove room from those events which are not there in the current passed data by user
						 					}
						 				} else {
						 					console.log('[4] - current room id ', room.id, ' not in the stored room id - stored room id is -> ', subscription.room_data);
						 					// If the room does not exist then update the subscription

						 				}
						 			}

						  			//console.log('[5] - subscription updated');
						  			// Send notification to the user that subscription has been updated
						  			//sendNotificationToUsers(this.read, this.modify, user, room, 'Subscription updated successfully!');
						  		} else {
						 			[
						 				events.COMMENT, events.DELETE, events.LIBRARY_PUBLISHED, events.UPDATE, events.VERSION_UPDATE,
						  			].map((event, key) => {
						  				const data = {
						  					event_type: event, team_id,
						  					endpoint: url,
						  					passcode: room.id, // Send room id as passcode
						  					description: room.id
						  				};
						  				this.http
						  					.post(
						  						'https://api.figma.com/v2/webhooks',
						  						{
						  							headers: {
						  								Authorization: `Bearer ${accessToken?.token}`
						  							}, data
						  						},
						  					)
						  					.then(async response => {
						  						if (response.data.error) {
						  							console.log('[3] - error from figma - ', response.data.error, ' - for - ', key, event,);
						  							throw new Error(response.data.error,);
						  						} else {
						 							// set the enivirment to production for unhandled promis rejections.
						  							console.log('[3] Successfully subscribed to -', key, event);
						  							let projects_to_be_stored: string[] | undefined;
						  							// todo: if subscription is for team add all the projects ( will check project ids for that )
						  							if (project_Ids && project_Ids.length === 0) { // for team subscription
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
						  									);
						  								});
						  							} else {
						  								// if subscription is for project then we will have to store the project
						  								event_type.forEach(async useSentEvent => {
						  									if (useSentEvent === event) { projects_to_be_stored = project_Ids; }
						  								});
						  								console.log('[3] subscription was for projects and for the event - ', event, ' - we stored - ', projects_to_be_stored?.length, ' projects');
						  								await subscriptionStorage.storeSubscriptionByEvent(
						  									'subscription',
						  									response.data.id,
						  									team_id,
						  									room,
						  									user,
						  									event,
						  									projects_to_be_stored,
						  								);
						  							}


						  						}
						  					})
						  					.catch(e => console.log('[4] - error storing subscription in storage - ', e, ' - for - ', key, event));
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
