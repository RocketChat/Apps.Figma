import {
    IHttp,
    IHttpRequest,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    BlockElementType,
    IBlock,
    TextObjectType,
    UIKitViewSubmitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitViewSubmitIncomingInteraction } from "@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes";
import { FigmaApp } from "../../FigmaApp";
import { getAccessTokenForUser } from "../storage/users";
import { FigmaSDK, getFileID, getProjectID, getTeamID } from "./sdk";
import {
    appUserSendMessage,
    sendDMToUser,
    sendMessage,
    sendNotificationToUsers,
} from "./messages";
import { IState } from "../definition";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IModalContext } from "../definition";
import { getFilesUrl, getProjectFilesUrl, getTeamProjectsUrl } from "./const";

export async function createSubscription(
    context: UIKitViewSubmitInteractionContext,
    data: IUIKitViewSubmitIncomingInteraction,
    read: IRead,
    http: IHttp,
    modify: IModify,
    persistence: IPersistence
) {
    const { state }: IState = data.view as any;
    const user: IUser = context.getInteractionData().user;
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        user.id
    );
    const [record] = (await read
        .getPersistenceReader()
        .readByAssociation(association)) as Array<IModalContext>;

    const room = await read.getRoomReader().getById(record.id!);
    const token = await getAccessTokenForUser(read, user);

    const headers: any = {
        Authorization: `Bearer ${token?.token}`,
    };
    console.log("type - ", state.type.type);
    if (state.type.type === "file") {
        const fileId = getFileID(state.URL.URL);

        // if user inserts a wrong url
        if (fileId.length !== 22) {
            if (room) {
                sendNotificationToUsers(
                    read,
                    modify,
                    user,
                    room,
                    "The File URL Entered by you is wrong"
                );
            }
            return;
        }
        const fileUrl=getFilesUrl(fileId);
        const response = await http.get(
            fileUrl,
            { headers }
        );

        if (room) {
            // image block builder
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
            //create a button block to open the file in figma
            block.addActionsBlock({
                elements: [
                    block.newButtonElement({
                        text: block.newPlainTextObject("Open in Figma"),
                        actionId: "open",
                        url: state.URL.URL,
                    }),
                ],
            });

            appUserSendMessage(read, modify, room, block);
        }
        return;
    } else if (state.type.type === "team") {
        const teamId = getTeamID(state.URL.URL);

        if (teamId.length !== 19) {
            if (room) {
                sendNotificationToUsers(
                    read,
                    modify,
                    user,
                    room,
                    "The Team URL Entered by you is wrong"
                );
            }
            return;
        }
        const teamUrl=getTeamProjectsUrl(teamId);
        const response = await http.get(
            teamUrl,
            { headers }
        );

        if (room) {
            const block = modify.getCreator().getBlockBuilder();
            block.addSectionBlock({
                text: {
                    text: `${user.name} subscribed to ${response.data.name}`,
                    type: TextObjectType.PLAINTEXT,
                },
            });
            response.data.projects.forEach((project) => {
                block.addActionsBlock({
                    elements: [
                        block.newButtonElement({
                            text: block.newPlainTextObject(project.name),
                            actionId: "subscribe",
                            url: `https://www.figma.com/files/project/${project.id}`,
                        }),
                    ],
                });
            });
            appUserSendMessage(read, modify, room, block);
            return;
        }
    } else if (state.type.type === "project") {
        const projectID = getProjectID(state.URL.URL);

        if (projectID.length !== 8) {
            if (room) {
                sendNotificationToUsers(
                    read,
                    modify,
                    user,
                    room,
                    "The Project URL Entered by you is wrong"
                );
            }
            return;
        }
        const projecturl=getProjectFilesUrl(projectID);
        const response = await http.get(
            projecturl,
            { headers }
        );

        // if room exists then create a button block with all the files from the response and send it to the user
        if (room) {
            const block = modify.getCreator().getBlockBuilder();
            block.addSectionBlock({
                text: {
                    text: `${user.name} subscribed to ${response.data.name}`,
                    type: TextObjectType.PLAINTEXT,
                },
            });
            response.data.files.forEach((file) => {
                block.addActionsBlock({
                    elements: [
                        block.newButtonElement({
                            text: block.newPlainTextObject(file.name),
                            actionId: "subscribe",
                            url: `https://www.figma.com/files/${file.id}`,
                        }),
                    ],
                });
            });
            appUserSendMessage(read, modify, room, block);
            return;
        }
    }
}
