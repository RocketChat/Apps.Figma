import {
    IHttp,
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { getAccessTokenForUser } from '../storage/users';
import { Subscription } from '../sdk/webhooks.sdk';
import { storedRoomData } from '../definition';
import {
    botMessageChannel,
    botNotifyCurrentUser,
    sendMessage
} from './messages';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { blockAction } from '../enums/enums';

export async function getProjects(
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
                return await botNotifyCurrentUser(
                    read,
                    modify,
                    user,
                    room,
                    'Could not find any project subscribed in this room'
                );
            }
            const room_projects_ids: string[] = [];
            for (const subscription of subscriptions) {
                const roomData: storedRoomData[] = subscription.room_data;
                for (const room_data of roomData) {
                    if (
                        room_data.room_Id === room.id &&
                        room_data.project_Ids
                    ) {
                        room_projects_ids.push(...room_data.project_Ids);
                    }
                }
            }
            if (room_projects_ids.length === 0) {
                return await botNotifyCurrentUser(
                    read,
                    modify,
                    user,
                    room,
                    'Could not find any projects subscribed by you in this room'
                );
            }
            const projectDataRequestUrl = removeDuplicates(
                room_projects_ids
            ).map(
                (projectId) =>
                    `https://api.figma.com/v1/projects/${projectId}/files`
            );
            try {
                await Promise.all(
                    projectDataRequestUrl.map((url) =>
                        http.get(url, {
                            headers
                        })
                    )
                )
                    .then(async (project_response) => {
                        if (project_response.length > 0) {
                            const projectDetails = project_response.map(
                                (response) => response.data
                            );
                            const projectName = projectDetails.map(
                                (project) => project.name
                            );
                            const block = modify.getCreator().getBlockBuilder();

                            block.addSectionBlock({
                                text: {
                                    type: TextObjectType.PLAINTEXT,
                                    text: 'Projects Subscribed in this room'
                                }
                            });

                            projectName.map((projectName) => {
                                block.addSectionBlock({
                                    text: {
                                        type: TextObjectType.MARKDOWN,
                                        text: `> ${projectName}`
                                    }
                                });
                            });

                            botNotifyCurrentUser(
                                read,
                                modify,
                                user,
                                room,
                                '',
                                block
                            );
                            return;
                        } else {
                            return await botNotifyCurrentUser(
                                read,
                                modify,
                                user,
                                room,
                                'Could not find any projects subscribed by you in this room'
                            );
                        }
                    })
                    .catch(async () => {
                        return await botNotifyCurrentUser(
                            read,
                            modify,
                            user,
                            room,
                            'Error in fetching files details'
                        );
                    });
            } catch (e) {
                return await botNotifyCurrentUser(
                    read,
                    modify,
                    user,
                    room,
                    'Error in fetching projects. Please Report this issue'
                );
            }
        })
        .catch(async (error) => {
            return await botNotifyCurrentUser(
                read,
                modify,
                user,
                room,
                'error getting all subscriptions'
            );
        });
}
