import { IUIKitBlockIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { events } from './enums';

export type IState = {
    state: {
        resource_type: {
            type: string;
            [option: string]: string;
        };
        team_url: {
            url: string;
        };
    };
};
export type IModalContext = {
    id?: string;
} & Partial<IUIKitBlockIncomingInteraction>;

export type storedRoomData = {
    room_id: string | undefined;
    project_ids?: string[];
    file_ids?: string[];
};
export type ISubscription = {
    webhook_id: string;
    user_id: string;
    name: string;
    event_name: string;
    team_id: string;
    room_data: storedRoomData[];
};
export type ITeamSubscriptions = {
    webhookId: string;
    teamId: string;
    user: IUser;
    events: string[];
};

export type IProjectsResponse = {
    id: string;
    name: string;
};

export type IProjectModalData = {
    state: {
        resource_type: { type: string };
        team_url: { url: string };
        selectedEvents: { events: string[] };
        selectedProjects: { projects: string[] | undefined };
    };
};

export type ICommentPayload = {
    comment: [
        {
            text: string;
        },
        {
            mention: string;
        },
        {
            text: string;
        }
    ];
    comment_id: string;
    created_at: string;
    event_type: events;
    file_key: string;
    file_name: string;
    mentions: [
        {
            id: string;
            handle: string;
        }
    ];
    order_id: string;
    parent_id: string | undefined;
    passcode: string;
    resolved_at: string | undefined;
    timestamp: Date;
    triggered_by: {
        id: string;
        handle: string;
    };
    webhook_id: string;
};

export type IPingPayload = {
    event_type: events;
    passcode: string;
    timestamp: Date;
    webhook_id: string;
};

export type IUpdatePayload = {
    event_type: events;
    file_key: string;
    file_name: string;
    passcode: string;
    timestamp: Date;
    webhook_id: string;
};
export type IDeletePayload = {
    event_type: events;
    file_key: string;
    file_name: string;
    passcode: string;
    timestamp: Date;
    triggered_by: {
        id: string;
        handle: string;
    };
    webhook_id: string;
};
export type IVersionUpdatePayload = {
    created_at: Date;
    description: string;
    event_type: events;
    file_key: string;
    file_name: string;
    label: string;
    passcode: string;
    timestamp: Date;
    triggered_by: {
        id: string;
        handle: string;
    };
    version_id: string;
    webhook_id: string;
};
export type ILibraryPublishPayload = {
    created_components: [
        {
            key: string;
            name: string;
        }
    ];
    created_styles: [
        {
            key: string;
            name: string;
        }
    ];
    deleted_components: [
        {
            key: string;
            name: string;
        }
    ];
    deleted_styles: [
        {
            key: string;
            name: string;
        }
    ];
    description: string;
    event_type: events;
    file_key: string;
    file_name: string;
    modified_components: [
        {
            key: string;
            name: string;
        }
    ];
    modified_styles: [
        {
            key: string;
            name: string;
        }
    ];
    passcode: string;
    timestamp: string;
    triggered_by: {
        id: string;
        handle: string;
    };
    webhook_id: string;
};
