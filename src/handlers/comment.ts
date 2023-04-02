/* eslint-disable no-mixed-spaces-and-tabs */
import {
    IHttp,
    IHttpRequest,
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { FigmaApp } from '../../FigmaApp';
import { getFileCommentsUrl } from '../lib/const';
import { botNotifyCurrentUser } from '../lib/messages';
import { getAccessTokenForUser } from '../storage/users';

export class CommentModalHandler {
    constructor(
        private readonly app: FigmaApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async run(context: UIKitViewSubmitInteractionContext, room: IRoom) {
        const view = context.getInteractionData().view as any;
        const { user } = context.getInteractionData();
        const accessToken = await getAccessTokenForUser(this.read, user);
        if (room) {
            const postData: IHttpRequest = {
                headers: {
                    Authorization: `Bearer ${accessToken?.token}`
                },
                data: {
                    message: view.state.new_comment.comment
                }
            };
            console.log('post data - ', postData, view.commentData);
            const url = getFileCommentsUrl(view.commentData);
            this.http
                .post(
                    url,
                    postData
                )
                .then(async (res) => {

                    console.log('post comment data ', res); // remove this
                    // if res.data.status starts with 400 then show error message
                    if (res.data.status === 404) {
                        return await botNotifyCurrentUser(
                            this.read,
                            this.modify,
                            user,
                            room,
                            'There was an error in posting the comment please report the issue'
                        );
                    } else if (res.data.status === 400) {
                        return await botNotifyCurrentUser(
                            this.read,
                            this.modify,
                            user,
                            room,
                            res.data.message
                        );
                    } else {
                        await botNotifyCurrentUser(
                            this.read,
                            this.modify,
                            user,
                            room,
                            'Comment added successfully'
                        );
                    }
                })
                .catch(async (e) => {
                    await botNotifyCurrentUser(
                        this.read,
                        this.modify,
                        user,
                        room,
                        `${e.data.message}`
                    );
                });
        } else {
            console.log('room not found');
        }
        return {
            success: true
        };
    }
}
