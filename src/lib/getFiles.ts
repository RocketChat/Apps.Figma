import {IHttp,
	IModify,
	IPersistence,
	IRead} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { getAccessTokenForUser } from '../storage/users';
import { Subscription } from '../sdk/webhooks.sdk';
import { storedRoomData } from '../definition';
import { botMessageChannel, sendMessage } from './messages';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { blockAction } from '../enums/enums';

export async function getFiles(
	modify: IModify,
	context,
	persistence: IPersistence,
	read: IRead,
	data,
	room: IRoom,
	user: IUser,
	http: IHttp
) {
	const subscriptionStorage = new Subscription(
		persistence,
		read.getPersistenceReader()
	);

	const token = await getAccessTokenForUser(read, user);

	const headers: { Authorization: string } = {
		Authorization: `Bearer ${token?.token}`
	};

	function removeDuplicates(arr: string[]) {
		const unique: string[] = [];
		arr.forEach((element: string) => {
			if (!unique.includes(element)) {
				unique.push(element);
			}
		});
		return unique;
	}

	subscriptionStorage
		.getAllSubscriptions()
		.then(async (subscriptions) => {
			if (!subscriptions) {
				return await sendMessage(
					modify,
					room,
					user,
					'Oho we could not find any files subscribed by you in this room'
				);
			}
			// get all subscriptions then check rom_data for every subscriptions if room_data.room_id matches with the current room then send all the files inside those arrays to the user
			const room_files_ids: string[] = [];
			for (const subscription of subscriptions) {
				const roomData: storedRoomData[] = subscription.room_data;
				for (const room_data of roomData) {
					if (room_data.room_Id === room.id && room_data.file_Ids) {
						room_files_ids.push(...room_data.file_Ids);
					}
				}
			}
			if (room_files_ids.length === 0) {
				console.log('send error message');
				return await sendMessage(
					modify,
					room,
					user,
					'Oho we could not find any files subscribed by you in this room'
				);
			}
			const filesDataReqUrls = removeDuplicates(room_files_ids).map(
				(file_id) => `https://api.figma.com/v1/files/${file_id}`
			);
			try {
				await Promise.all(
					filesDataReqUrls.map((url) =>
						http.get(url, {
							headers
						})
					)
				)
					.then(async (project_response) => {
						// send message to the user with a block of all the files name fetched from figma api
						console.log('here');
						if (project_response.length > 0) {
							const filesData = project_response.map(
								(response) => response.data
							);
							const filesNames = filesData.map(
								(file) => file.name
							);
							console.log('files data ', filesData);
							const filesIds = filesData.map(
								(file) => file.id
							);
							//  console.log('file ids - ', filesIds)
							const block = modify.getCreator().getBlockBuilder();

							block.addSectionBlock({
								text: {
									type: TextObjectType.PLAINTEXT,
									text: 'Files in this room'
								}
							});

							filesNames.map((file_name) => {
								block.addSectionBlock({
									text: {
										type: TextObjectType.MARKDOWN,
										text: `> ${file_name}`
									}
								});
								console.log('file names ', filesIds[filesNames.indexOf(file_name)]);
								block.addActionsBlock({
									blockId: blockAction.FILE_ACTIONS,
									elements: [
										block.newButtonElement({
											actionId: blockAction.COMMENT,
											text: block.newPlainTextObject('Comment'),
											value: `${filesIds[0]}`,
										}),
										block.newButtonElement({
											actionId: blockAction.OPEN_FILE,
											text: block.newPlainTextObject('Open file'),
											value: 'open',
										}),
									],
								});
							});

							//console.log('files blocks', block);
							botMessageChannel(read, modify, room, block);

						} else {
							await sendMessage(
								modify,
								room,
								user,
								'Oho we could not find any files subscribed by you in this room'
							);
						}
					})
					.catch(async () =>
						sendMessage(
							modify,
							room,
							user,
							'Error in fetching files details'
						)
					);
			} catch (e) {
				await sendMessage(
					modify,
					room,
					user,
					'Error in fetching files. Please Report this issue'
				);
			}
			return;
		})
		.catch((error) => {
			console.log('error getting all subscriptions - ', error);
		});
}
