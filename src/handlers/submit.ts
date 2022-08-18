import {
    IHttp,
    IModify,
    IPersistence,
    IPersistenceRead,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    TextObjectType,
    UIKitViewSubmitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import {
    getInteractionRoomData,
    clearInteractionRoomData,
} from "../storage/room";
import { FigmaApp } from "../../FigmaApp";
import { createSubscription } from "../subscription/createSubscription";
import { BlockActionHandler } from "./action";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IState, IModalContext } from "../definition";
import { sendNotificationToUsers } from "../lib/messages";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";

export class ExecuteViewSubmitHandler {
    constructor(
        private readonly app: FigmaApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async run(context: UIKitViewSubmitInteractionContext, room: IRoom) {
        const data = context.getInteractionData();
        const { state }: IState = data.view as any;
        const team_url = state?.team_url?.url;
        const resource_type = state.resource_type.type;

        const user: IUser = context.getInteractionData().user;

        if (room) {
            if (!resource_type) {
                console.log("resource type not selected 🔴");
                sendNotificationToUsers(
                    this.read,
                    this.modify,
                    user,
                    room,
                    "Please select a resource type"
                );
                return;
            } else if (!team_url) {
                console.log("team url not entered 🔴");
                sendNotificationToUsers(
                    this.read,
                    this.modify,
                    user,
                    room,
                    "Please enter a team url"
                );
                return;
            } else if (!resource_type || !team_url) {
                console.log("team url and resource type not entered 🔴");
                sendNotificationToUsers(
                    this.read,
                    this.modify,
                    user,
                    room,
                    "Please enter a team url and a resource type"
                );
                return;
            }

            const handler = new BlockActionHandler(
                this.app,
                this.read,
                this.http,
                this.modify,
                this.persistence
            );
            return await handler.run(context, team_url, resource_type);
        }

        return {
            success: true,
        };
    }
}
