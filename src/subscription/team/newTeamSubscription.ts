/* eslint-disable no-mixed-spaces-and-tabs */
import {
    IHttp,
    IHttpResponse,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { Subscription } from '../../sdk/webhooks.sdk';
import { file } from '../../definition';
import { botMessageChannel } from '../../lib/messages';
import {
    TextObjectType,
    UIKitViewSubmitInteractionContext
} from '@rocket.chat/apps-engine/definition/uikit';
import { events } from '../../enums/enums';
import { getRequest } from '../../helpers/Figma.sdk';
import { getProjectFilesUrl, getTeamProjectsUrl } from '../../lib/const';
export async function newTeamSubscription(
    context: UIKitViewSubmitInteractionContext,
    persistence: IPersistence,
    read: IRead,
    http: IHttp,
    room: IRoom,
    user: IUser,
    team_id: string,
    event: string[],
    current_event_on_loop: events,
    response: IHttpResponse
) {
    // 2 - inside team subscription');
    let projects_to_be_stored: string[];
    let files_to_be_stored: string[];

    const subscriptionStorage = new Subscription(
        persistence,
        read.getPersistenceReader()
    );

    try {
        const teamUrl=getTeamProjectsUrl(team_id)
        await getRequest(
            read,
            context,
            http,
            teamUrl
        )
            .then(async (team_response) => {
                // 3 - got the project from figma');
                if (event.includes(current_event_on_loop)) {
                    projects_to_be_stored = team_response.data.projects.map(
                        (project: any) => project.id // todo: fix this and add a strict type
                    );
                    files_to_be_stored = [];
                    const reqUrls = team_response.data.projects.map(
                        (project: any) =>
                            getProjectFilesUrl(project.id)
                    );
                    try {
                        await Promise.all(
                            reqUrls.map(
                                async (url: string) =>
                                    await getRequest(read, context, http, url)
                            )
                        )
                            .then((project_response) => {
                               // 4 - got all the files from the project this will repeat multiple times'
                                project_response.forEach((response) =>
                                    response.data.files.forEach((file: file) =>
                                        files_to_be_stored.push(file.key)
                                    )
                                );
                            })
                            .catch(async () => {
                                const block = this.modify
                                    .getCreator()
                                    .getBlockBuilder();
                                block.addSectionBlock({
                                    text: {
                                        text: 'Error in fetching Files. Please Report this issue',
                                        type: TextObjectType.PLAINTEXT
                                    }
                                });
                                return await botMessageChannel(
                                    this.read,
                                    this.modify,
                                    room,
                                    block
                                );
                            });
                    } catch (e) {
                        const block = this.modify
                            .getCreator()
                            .getBlockBuilder();
                        block.addSectionBlock({
                            text: {
                                text: 'Error in fetching Files. Please Report this issue',
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
                    return await subscriptionStorage.storeSubscriptionByEvent(
                        'subscription',
                        response.data.id,
                        team_id,
                        room,
                        user,
                        current_event_on_loop,
                        projects_to_be_stored,
                        files_to_be_stored
                    ); // todo: handle for if data is not stored
                } else {
                    return await subscriptionStorage.storeSubscriptionByEvent(
                        'subscription',
                        response.data.id,
                        team_id,
                        room,
                        user,
                        current_event_on_loop,
                        projects_to_be_stored,
                        files_to_be_stored
                    );
                }
            })
            .catch(async () => {
                const block = this.modify.getCreator().getBlockBuilder();
                block.addSectionBlock({
                    text: {
                        text: 'Error in fetching Projects. Please Report this issue',
                        type: TextObjectType.PLAINTEXT
                    }
                });
                return await botMessageChannel(
                    this.read,
                    this.modify,
                    room,
                    block
                );
            });
    } catch (error) {
        const block = this.modify.getCreator().getBlockBuilder();
        block.addSectionBlock({
            text: {
                text: 'Error in fetching Projects. Please Report this issue',
                type: TextObjectType.PLAINTEXT
            }
        });
        return await botMessageChannel(this.read, this.modify, room, block);
    }
    return;
}
