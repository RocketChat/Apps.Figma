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
