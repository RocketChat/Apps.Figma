import { IHttp, IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import {  ICommentPayload, IDeletePayload, IUpdatePayload , IVersionUpdatePayload , ILibraryPublishPayload, ISubscription } from '../definition';
import { sendMessage } from '../lib/messages';

export async function commentEvent(
	payload:  ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
)  {
	let comment: string; // todo : fix the comment text
	// it contains an array of 3 then the first element is the text and the second is the mention and the third is the text after mention
	if (payload.comment.length == 3) {
		comment = payload.comment[0].text + ' ' + payload.comment[1].mention + ' ' + payload.comment[2].text;
	} else {
		comment = payload.comment[0].text;
	}
	// now send a message with comment as quote to all the subscribed users
	for (const subscription of subscriptions) {
		for (const roomData of subscription.room_data) {
			const room = await read
				.getRoomReader()
				.getById(roomData.room_Id!);

			const user = await read
				.getUserReader()
				.getById(subscription.user_id);

			if (room) {
				if ((!roomData.project_Ids || roomData.project_Ids.length == 0) &&  (roomData.file_Ids || roomData.file_Ids!.length > 0)) {
					console.log('roomData has files init - ', roomData);
					if (roomData.file_Ids!.includes(payload.file_key)) {
						const message = `${payload.triggered_by.handle} commented on ${payload.file_name} - ${comment}`;
						await sendMessage(
							modify,
							room,
							user,
							message
						);
					}

				} else if ((!roomData.file_Ids || roomData.file_Ids.length == 0) && (roomData.project_Ids || roomData.project_Ids!.length > 0)) {
					console.log('roomData has projects init - ', roomData);
					// files does not exist this means that there are projects in the room then if the project is present send the message to the room
					// for project we will have to store all the files we are getting from that project and then check if the file is present in the files array
					if (roomData.file_Ids?.includes(payload.file_key)) {
						const message = `${payload.triggered_by.handle} commented on ${payload.file_key} - ${comment}`;
						await sendMessage(
							modify,
							room,
							user,
							message
						);
					}

				} else if (!roomData.file_Ids && !roomData.project_Ids) {
					console.log('roomData has no files or projects init - ', roomData);
					// both project ids and file ids array are undefined which means subscription is for the whole team
				}

			} else {
				console.log( 'Figma pinged but room not found - ', roomData );
			}
		}
	}
}
export async function deleteEvent(
	payload: ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
) {
	//
}
export async function updateEvent(
	payload: ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
) {
	//
}
export async function publishEvent(
	payload: ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
) {
	//
}
export async function versionUpdateEvent(
	payload: ICommentPayload,
	subscriptions: ISubscription[],
	modify: IModify,
	read: IRead,
	http: IHttp
) {
	//
}
