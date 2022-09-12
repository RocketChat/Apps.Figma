import {IHttp,
	IHttpRequest,
	IModify,
	IPersistence,
	IRead,} from '@rocket.chat/apps-engine/definition/accessors';
import {BlockElementType,
	IBlock,
	TextObjectType,
	UIKitViewSubmitInteractionContext,} from '@rocket.chat/apps-engine/definition/uikit';
import {IUIKitViewSubmitIncomingInteraction} from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';
import {getAccessTokenForUser} from '../storage/users';
import {getFileID, getProjectID, getTeamID} from '../sdk/subscription.sdk';
import {botMessageChannel,
	sendDMToUser,
	sendMessage,
	botNotifyCurrentUser,} from '../lib/messages';
import {IState} from '../definition';
import {IUser} from '@rocket.chat/apps-engine/definition/users';
import {IRoom} from '@rocket.chat/apps-engine/definition/rooms';
import {RocketChatAssociationModel,
	RocketChatAssociationRecord,} from '@rocket.chat/apps-engine/definition/metadata';
import {IModalContext} from '../definition';
import {AddSubscription} from './addSubscription';

export async function createSubscription(
	context: UIKitViewSubmitInteractionContext,
	data: IUIKitViewSubmitIncomingInteraction,
	read: IRead,
	http: IHttp,
	modify: IModify,
	persistence: IPersistence,
) {
	const {state}: IState = data.view as any;
	const {user} = context.getInteractionData();
	const association = new RocketChatAssociationRecord(
		RocketChatAssociationModel.MISC,
		user.id,
	);
	const [record] = (await read
		.getPersistenceReader()
		.readByAssociation(association)) as IModalContext[];

	const room = await read.getRoomReader().getById(record.id!);
	const token = await getAccessTokenForUser(read, user);

	const handler = new AddSubscription(this, read, http, modify, persistence);

	const headers: any = {
		Authorization: `Bearer ${token?.token}`
	};
	if (state.resource_type.type === 'file') {
		const fileId = getFileID(state.team_url.url);

		// If user inserts a wrong url
		if (fileId.length !== 22) {
			if (room) {
				botNotifyCurrentUser(
					read,
					modify,
					user,
					room,
					'The File URL Entered by you is wrong',
				);
			}

			return;
		}

		const response = await http.get(
			`https://api.figma.com/v1/files/${fileId}`,
			{
				headers
			},
		);

		if (room) {
			// Image block builder
			const block = modify.getCreator().getBlockBuilder();
			block.addSectionBlock({
				text: {
					text: `${user.name} subscribed to ${response.data.name}`,
					type: TextObjectType.PLAINTEXT,
				},
			});
			block.addImageBlock({
				imageUrl: response.data.thumbnailUrl,
				altText: response.data.name,
			});
			// Create a button block to open the file in figma
			block.addActionsBlock({
				elements: [
					block.newButtonElement({
						text: block.newPlainTextObject('Open in Figma'),
						actionId: 'open',
						url: state.team_url.url,
					}),
				],
			});

			botMessageChannel(read, modify, room, block);
		}
	} else if (state.resource_type.type === 'team') {
		const teamId: string = getTeamID(state.team_url.url);

		if (teamId.length !== 19) {
			if (room) {
				botNotifyCurrentUser(
					read,
					modify,
					user,
					room,
					'The Team URL Entered by you is wrong',
				);
			}

			return;
		}

		const response = await http.get(
			`https://api.figma.com/v1/teams/${teamId}/projects`,
			{
				headers
			},
		);
		if (room) {
			const block = modify.getCreator().getBlockBuilder();
			block.addSectionBlock({
				text: {
					text: `${user.name} subscribed to ${response.data.name}`,
					type: TextObjectType.PLAINTEXT,
				},
			});
			response.data.projects.forEach(project => {
				block.addActionsBlock({
					elements: [
						block.newButtonElement({
							text: block.newPlainTextObject(project.name),
							actionId: 'subscribe',
							url: `https://www.figma.com/files/project/${project.id}`,
						}),
					],
				});
			});

			await handler.run(context, room);
			botMessageChannel(read, modify, room, block);
		}
	} else if (state.resource_type.type === 'project') {
		const projectID = getProjectID(state.team_url.url);

		if (projectID.length !== 8) {
			if (room) {
				botNotifyCurrentUser(
					read,
					modify,
					user,
					room,
					'The Project URL Entered by you is wrong',
				);
			}

			return;
		}

		const response = await http.get(
			`https://api.figma.com/v1/projects/${projectID}/files`,
			{
				headers
			},
		);

		// If room exists then create a button block with all the files from the response and send it to the user
		if (room) {
			const block = modify.getCreator().getBlockBuilder();
			block.addSectionBlock({
				text: {
					text: `${user.name} subscribed to ${response.data.name}`,
					type: TextObjectType.PLAINTEXT,
				},
			});
			response.data.files.forEach(file => {
				block.addActionsBlock({
					elements: [
						block.newButtonElement({
							text: block.newPlainTextObject(file.name),
							actionId: 'subscribe',
							url: `https://www.figma.com/files/${file.id}`,
						}),
					],
				});
			});
			botMessageChannel(read, modify, room, block);
		}
	}
}
