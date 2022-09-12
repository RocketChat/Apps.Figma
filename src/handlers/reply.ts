/* eslint-disable no-mixed-spaces-and-tabs */
import {IHttp,
	IHttpRequest,
	IModify,
	IPersistence,
	IPersistenceRead,
	IRead,} from '@rocket.chat/apps-engine/definition/accessors';
import {IRoom} from '@rocket.chat/apps-engine/definition/rooms';
import {TextObjectType,
	UIKitViewSubmitInteractionContext,} from '@rocket.chat/apps-engine/definition/uikit';
import {getInteractionRoomData,
	clearInteractionRoomData,} from '../storage/room';
import {FigmaApp} from '../../FigmaApp';
import {createSubscription} from '../subscription/createSubscription';
import {BlockActionHandler} from './action';
import {IUser} from '@rocket.chat/apps-engine/definition/users';
import {IState, IModalContext} from '../definition';
import {botNotifyCurrentUser} from '../lib/messages';
import {RocketChatAssociationModel,
	RocketChatAssociationRecord,} from '@rocket.chat/apps-engine/definition/metadata';
import { getAccessTokenForUser } from '../storage/users';

export class ExecuteReplyHandler {
	constructor(
		private readonly app: FigmaApp,
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly modify: IModify,
		private readonly persistence: IPersistence,
	) {}

	public async run(context: UIKitViewSubmitInteractionContext, room: IRoom) {
		console.log('inside run function');

		const view  = context.getInteractionData().view as any;
		const { user } = context.getInteractionData();
		const accessToken = await getAccessTokenForUser(this.read, user);
		console.log('access token - ', accessToken?.token);
		console.log('view - ', view);
		if (room) {
			const postData: IHttpRequest = {
				headers: {
					Authorization: `Bearer ${accessToken?.token}`,
				},
				data: {
					message: view.state.comment_reply.reply,
					comment_id: view.commentData.commentId
				}
			};
			this.http.post(`https://api.figma.com/v1/files/${view.commentData.fileKey}/comments`,  postData).then(async (res) => {
				await botNotifyCurrentUser(this.read, this.modify, user, room, 'Comment added successfully');
			}).catch(async (e) => {
				await botNotifyCurrentUser(this.read, this.modify, user, room, `${e.data.message}`);
			});

		}
		return {
			success: true
		};
	}
}
