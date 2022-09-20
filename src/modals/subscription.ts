import {
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    BlockElementType,
    TextObjectType
} from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { getRoom, storeInteractionRoomData } from '../storage/room';
import { blockId, modalId, modalTitle } from '../enums/enums';

export async function subscriptionsModal({
    modify,
    read,
    persistence,
    SlashCommandContext
}: {
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    SlashCommandContext?: SlashCommandContext;
}): Promise<IUIKitModalViewParam> {
    const block = modify.getCreator().getBlockBuilder();
    const room = SlashCommandContext?.getRoom();
    const user = SlashCommandContext?.getSender();

    if (user?.id) {
        let roomId: string;
        if (room?.id) {
            roomId = room.id;
            await storeInteractionRoomData(persistence, user.id, roomId);
        } else {
            const room = await getRoom(read, user);
            if (room) {
                roomId = room.id;
            } else {
                console.log('error: room is not there');
            }
        }
    }

    block.addSectionBlock({
        text: {
            text: 'Subscribe your Rocket Chat channel to notifications about Files, Teams, or Projects. You can only subscribe to resources were you have edit access or you are an admin.',
            type: TextObjectType.PLAINTEXT
        }
    });

    block.addDividerBlock();
    block.addSectionBlock({
        text: {
            text: '**Select a resource type**',
            type: TextObjectType.MARKDOWN
        }
    });

    block.addActionsBlock({
        blockId: blockId.RESOURCE_BLOCK,
        elements: [
            block.newStaticSelectElement({
                placeholder: block.newPlainTextObject('File'),
                actionId: 'type',
                initialValue: 'file',
                options: [
                    {
                        text: block.newPlainTextObject('File'),
                        value: 'file'
                    },
                    {
                        text: block.newPlainTextObject('Team'),
                        value: 'team'
                    },
                    {
                        text: block.newPlainTextObject('Project'),
                        value: 'project'
                    }
                ]
            })
        ]
    });
    block.addInputBlock({
        label: {
            text: '**Enter team URL**',
            type: TextObjectType.MARKDOWN
        },
        blockId: blockId.TEAM_URL,
        element: {
            actionId: 'url',
            placeholder: {
                text: 'Enter the URL',
                type: TextObjectType.PLAINTEXT
            },
            type: BlockElementType.PLAIN_TEXT_INPUT
        }
    });

    return {
        id: modalId.SUBSCRIPTION_VIEW,
        title: block.newPlainTextObject(modalTitle.NOTIFICATION_MODAL),
        close: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: 'Close'
            }
        }),
        submit: block.newButtonElement({
            actionId: 'subscription view',
            text: {
                type: TextObjectType.PLAINTEXT,
                text: 'Next'
            }
        }),

        blocks: block.getBlocks()
    };
}
