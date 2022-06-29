import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { sendDMToUser, sendNotificationToUsers } from "../src/lib/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { getAccessTokenForUser } from "../src/storage/users";
import {
    BlockElementType,
    TextObjectType,
} from "@rocket.chat/apps-engine/definition/uikit";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { uuid } from "../src/lib/uuid";

export async function figmaSubscribeCommand(
    context: SlashCommandContext,
    read: IRead,
    modify: IModify,
    http: IHttp,
    persist: IPersistence,
    room: IRoom,
    sender: IUser,
    id?: string
) {
    const viewId = id || uuid();
    const accessToken = await getAccessTokenForUser(read, sender);
    if (!accessToken?.token) {
        const message = `Your have not connected your account yet. Use \`/figma connect\` to connect your account.`;
        await sendNotificationToUsers(read, modify, sender, room, message);
        return;
    }

    if (room.type === "d") {
        const message = `You can only subscribe to files inside a channel for notifications. Try \`/figma help\`  `;
        await sendDMToUser(read, modify, sender, message, persist);
        return;
    }

    const triggerId = context.getTriggerId()!;

    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        sender.id
    );
    await persist.createWithAssociation(room, association);

    const block = modify.getCreator().getBlockBuilder();

    block.addSectionBlock({
        text: {
            text: "Subscribe your Rocket Chat channel to notifications about files, teams, or projects. You can only subscribe to resources were you have edit access.",
            type: TextObjectType.PLAINTEXT,
        },
    });

    block.addDividerBlock();
    block.addSectionBlock({
        text: {
            text: "Select a resource to subscribe to",
            type: TextObjectType.PLAINTEXT,
        },
    });

    block.addActionsBlock({
        blockId: "type",
        elements: [
            block.newStaticSelectElement({
                placeholder: block.newPlainTextObject("File"),
                actionId: "type",
                initialValue: "file",
                options: [
                    {
                        text: block.newPlainTextObject("File"),
                        value: "file",
                    },
                    {
                        text: block.newPlainTextObject("Team"),
                        value: "team",
                    },
                    {
                        text: block.newPlainTextObject("Project"),
                        value: "project",
                    },
                ],
            }),
        ],
    });
    block.addInputBlock({
        label: {
            text: "Enter URL of the team or file",
            type: TextObjectType.PLAINTEXT,
        },
        blockId: "URL",
        element: {
            actionId: "URL",
            placeholder: {
                text: "Enter the URL",
                type: TextObjectType.PLAINTEXT,
            },
            type: BlockElementType.PLAIN_TEXT_INPUT,
        },
    });

    return await modify.getUiController().openModalView(
        {
            id: "modelView",
            title: block.newPlainTextObject("Get Figma Notifications"),
            close: block.newButtonElement({
                text: block.newPlainTextObject("Cancel"),
            }),
            submit: block.newButtonElement({
                text: block.newPlainTextObject("Submit"),
            }),
            blocks: block.getBlocks(),
        },
        { triggerId },
        sender
    );
}
