import { newFileSubscription } from '../../subscription/file/newFileSubscription';
import { newTeamSubscription } from '../../subscription/team/newTeamSubscription';
import { newProjectSubscription } from '../../subscription/project/newProjectSubscription';
import {
    IHttp,
    IHttpResponse,
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { botMessageChannel } from '../../lib/messages';
import {
    TextObjectType,
    UIKitViewSubmitInteractionContext
} from '@rocket.chat/apps-engine/definition/uikit';
import { events } from '../../enums/enums';

export class WebhookSubscription {
    constructor(
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async createWebhookResponseHandler(
        context: UIKitViewSubmitInteractionContext,
        response: IHttpResponse,
        room: IRoom,
        user: IUser,
        project_Ids: string[] | undefined,
        file_Ids: string[] | undefined,
        team_id: string,
        event_type: string[],
        current_event_on_loop: events
    ) {
        if (response.data.error) {
            throw new Error(response.data.error);
        } else {
            // todo: if subscription is for team add all the projects ( will check project ids for that )
            if (!project_Ids && !file_Ids) {
                await newTeamSubscription(
                    context,
                    this.persistence,
                    this.read,
                    this.http,
                    room,
                    user,
                    team_id,
                    event_type,
                    current_event_on_loop,
                    response
                );
            } else if (project_Ids || file_Ids) {
                if (project_Ids && project_Ids?.length > 0) {
                    return await newProjectSubscription(
                        context,
                        current_event_on_loop,
                        this.http,
                        this.read,
                        this.persistence,
                        room,
                        event_type,
                        project_Ids,
                        team_id,
                        user,
                        response
                    );
                } else if (file_Ids && file_Ids?.length > 0) {
                    return await newFileSubscription(
                        this.read,
                        this.persistence,
                        event_type,
                        file_Ids,
                        response,
                        team_id,
                        user,
                        room,
                        current_event_on_loop
                    );
                } else {
                    const block = this.modify.getCreator().getBlockBuilder();
                    block.addSectionBlock({
                        text: {
                            text: 'No project or file Ids found',
                            type: TextObjectType.PLAINTEXT
                        }
                    });
                    return await botMessageChannel(
                        this.read,
                        this.modify,
                        room,
                        block
                    );
                }
            }
        }
        return;
    }
}
