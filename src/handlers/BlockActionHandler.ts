import {
    IHttp,
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { blockAction } from '../enums/enums';
import { IUIKitResponse } from '@rocket.chat/apps-engine/definition/uikit';
import { UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { getFiles } from '../lib/getFiles';
import { getInteractionRoomData } from '../storage/room';
import { commentReply } from '../lib/commentReply';
import { newComment } from '../lib/comment';
import { getProjects } from '../lib/getProjects';

export class BlockActionHandler {
    constructor(
        private readonly app: IApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async run(
        context: UIKitBlockInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
        uikitcontext?: UIKitInteractionContext
    ): Promise<IUIKitResponse> {
        const data = context.getInteractionData();
        const { actionId, user } = data;
        const roomFromStorage = (await getInteractionRoomData(
            read.getPersistenceReader(),
            user.id
        )) as { roomId: string };
        if (roomFromStorage) {
            const room = await read
                .getRoomReader()
                .getById(roomFromStorage.roomId);

            if (room) {
                // todo: remove figma subscriptions command to happen inside figma bot DM's
                try {
                    switch (actionId) {
                        case blockAction.FILES:
                            await getFiles(
                                modify,
                                context,
                                persistence,
                                read,
                                data,
                                room,
                                user,
                                http
                            );
                            return context
                                .getInteractionResponder()
                                .successResponse();
                        case blockAction.PROJECTS:
                            await getProjects(
                                modify,
                                context,
                                persistence,
                                read,
                                data,
                                room,
                                user,
                                http
                            );
                            break;
                        case blockAction.REPLY:
                            await commentReply(
                                modify,
                                context,
                                persistence,
                                read,
                                data,
                                room,
                                user,
                                http
                            );
                            break;
                        case blockAction.REACT:
                            break;
                        case blockAction.POST:
                            break;
                        case blockAction.COMMENT:
                            await newComment(
                                modify,
                                context,
                                persistence,
                                read,
                                data,
                                room,
                                user,
                                http
                            );
                            break;
                        default:
                            break;
                    }
                } catch (error) {
                    console.log('error: ', error);
                    return context.getInteractionResponder().viewErrorResponse({
                        viewId: actionId,
                        errors: error
                    });
                }
            } else {
                console.log('result: room does not exist');
            }
        }
        return context.getInteractionResponder().successResponse();
    }
}
