import { IUIKitBlockIncomingInteraction } from "@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { events } from "./enums";

export interface IState {
    state: {
        resource_type: {
            type: string;
            [option: string]: string;
        };
        team_url: {
            url: string;
        };
    };
}
export interface IModalContext extends Partial<IUIKitBlockIncomingInteraction> {
    id?: string;
}
export interface storedRoomData {
    room_id: string | undefined;
    project_ids?: string[];
    file_ids?: string[];
}
export interface ISubscription {
    webhook_id: string;
    user_id: string;
    name: string;
    event_name: string;
    team_id: string;
    room_data: storedRoomData[];
}
export interface ITeamSubscriptions {
    webhookId: string;
    teamId: string;
    user: IUser;
    events: Array<string>;
}

export interface IProjectsResponse {
    id: string;
    name: string;
}

export interface IProjectModalData {
    state: {
        resource_type: { type: string };
        team_url: { url: string };
        selectedEvents: { events: string[] };
        selectedProjects: { projects: string[] };
    };
}
