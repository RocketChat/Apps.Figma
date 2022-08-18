import { IUIKitBlockIncomingInteraction } from "@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

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
export interface ISubscription {
    webhook_id: string;
    user: string;
    name: string;
    room: string;
    team_id: string;
    projects: string[];
    events: string[];
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
