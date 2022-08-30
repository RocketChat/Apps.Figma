import {IHttp,
	IMessageBuilder,
	IModify,
	IModifyCreator,
	IPersistence,
	IRead,} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUIKitResponse, TextObjectType, UIKitViewSubmitInteractionContext , ButtonStyle, UIKitInteractionContext} from '@rocket.chat/apps-engine/definition/uikit';
import {ISlashCommand,
	SlashCommandContext,} from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUIKitViewSubmitIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { getAccessTokenForUser } from '../storage/users';
import { HttpStatusCode } from '@rocket.chat/apps-engine/definition/accessors';
import { Subscription } from '../sdk/webhooks.sdk';
import { storedRoomData } from '../definition';

export async function getFiles(context, persistence: IPersistence, read: IRead, data, room, http: IHttp) {
	//const state = data.view.state;
	//const user: IUser = context.getInteractionData().user;
	console.log('reached here');
	// we will get all the files from db and then show them to the user.
	const subscriptionStorage = new Subscription(
		persistence,
		read.getPersistenceReader(),
	);

	subscriptionStorage.getAllSubscriptions()
		.then(async (subscriptions) => {

			// get all subscriptions then check rom_data for every subscriptions if room_data.room_id matches with the current room then send all the files inside those arrays to the user
			const room_files_ids: string[] = [];
			for (const subscription of subscriptions) {
				const roomData: storedRoomData[] = subscription.room_data;
				for (const room_data of roomData) {
					console.log('room id', room_data);
					if (room_data.room_Id === room.id && room_data.file_Ids) {
						// push each room id from room_data to room_files_ids array
						room_files_ids.push(...room_data.file_Ids);
						console.log('room_files_ids', room_files_ids);
					}
				}
			}
			console.log(' all the files in this room - ', room_files_ids);
		}).catch (error => {
			console.log('error getting all subscriptions - ', error);
		});
}


