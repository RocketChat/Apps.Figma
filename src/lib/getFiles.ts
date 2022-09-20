import {
    IHttp,
    IHttpResponse,
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { getAccessTokenForUser } from '../storage/users';
import { Subscription } from '../sdk/webhooks.sdk';
import { storedRoomData } from '../definition';
import { botMessageChannel, botNotifyCurrentUser } from './messages';
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
                return await botNotifyCurrentUser(
                    read,
                    modify,
                    user,
                    room,
                    'Could not find any files subscriptions'
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
                return await botNotifyCurrentUser(
                    read,
                    modify,
                    user,
                    room,
                    'Could not find any file subscribed in this room'
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
                        const fileDetails: {
                            name: string;
                            apiUrl: string;
                            id: string;
                        }[] = [];
                        if (project_response.length > 0) {
                            project_response.map((response) => {
                                const apiUrl = response.url;
                                const name = response.data.name;
                                const id = apiUrl.split('/')[5];
                                fileDetails.push({ name, apiUrl, id });
                                return;
                            });
                            const block = modify.getCreator().getBlockBuilder();
                            block.addSectionBlock({
                                text: {
                                    type: TextObjectType.PLAINTEXT,
                                    text: 'Files in this room'
                                }
                            });
                            fileDetails.map((file) => {
                                block.addSectionBlock({
                                    text: {
                                        type: TextObjectType.MARKDOWN,
                                        text: `> *${file.name}*`
                                    }
                                });
                                block.addActionsBlock({
                                    blockId: blockAction.FILE_ACTIONS,
                                    elements: [
                                        block.newButtonElement({
                                            actionId: blockAction.COMMENT,
                                            text: block.newPlainTextObject(
                                                'Comment'
                                            ),
                                            value: `${file.apiUrl}`
                                        }),
                                        block.newButtonElement({
                                            actionId: blockAction.OPEN_FILE,
                                            text: block.newPlainTextObject(
                                                'Open file'
                                            ),
                                            url: `https://www.figma.com/file/${file.id}`,
                                            value: `${file.id}`
                                        })
                                    ]
                                });
                            });

                            return await botNotifyCurrentUser(
                                read,
                                modify,
                                user,
                                room,
                                '',
                                block
                            );
                        } else {
                            return await botNotifyCurrentUser(
                                read,
                                modify,
                                user,
                                room,
                                'Could not find any files subscribed in this room'
                            );
                        }
                    })
                    .catch(async (e) => {
                        return await botNotifyCurrentUser(
                            read,
                            modify,
                            user,
                            room,
                            'There was an error'
                        );
                    });
            } catch (e) {
                return await botNotifyCurrentUser(
                    read,
                    modify,
                    user,
                    room,
                    'Error in fetching files. Please Report this issue'
                );
            }
        })
        .catch(async (error) => {
            console.log('error: getting all subscriptions - ', error);
            return await botNotifyCurrentUser(
                read,
                modify,
                user,
                room,
                'Error in fetching files. Please Report this issue'
            );
        });
}
