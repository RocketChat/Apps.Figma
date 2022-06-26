import {
    IHttp,
    IHttpRequest,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitViewSubmitIncomingInteraction } from "@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes";
import { FigmaApp } from "../../FigmaApp";
import { getAccessTokenForUser } from "../storage/users";
import { FigmaSDK, getFileID, getTeamID } from "./sdk";
import { sendDMToUser, sendNotificationToUser } from "./messages";
import { IState } from "./interface";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

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
    const token = await getAccessTokenForUser(read, user);
    const headers: any = {
        Authorization: `Bearer ${token?.token}`,
    };
    if (state.type.type === "file") {
        const fileId = getFileID(state.URL.URL);
    } else if (state.type.type === "project") {
        const teamId = getTeamID(state.URL.URL);
        if (teamId) {
            const response = await http.get(
                `https://api.figma.com/v1/teams/${teamId}/projects`,
                { headers }
            );

            console.log("figma response ", response);
        }
    }
}
