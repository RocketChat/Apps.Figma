import { IUIKitBlockIncomingInteraction } from "@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes";

export interface IState {
    state: {
        type: {
            type: string;
            [option: string]: string;
        };
        URL: {
            URL: string;
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
    event: string;
}
