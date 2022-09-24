import {
    IHttp,
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import {
    IUIKitModalResponse,
    UIKitViewSubmitInteractionContext
} from '@rocket.chat/apps-engine/definition/uikit';
import { FigmaApp } from '../../FigmaApp';
import { BlockActionHandler } from './action';
import { IState, view } from '../definition';
import { botNotifyCurrentUser } from '../lib/messages';
export class ExecuteViewSubmitHandler {
    constructor(
        private readonly app: FigmaApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async run(
        context: UIKitViewSubmitInteractionContext,
        room: IRoom
    ): Promise<{ success: boolean } | IUIKitModalResponse> {
        const data: any = context.getInteractionData(); // todo: fix this add a strict type
        const view: view = data.view;
        let state: IState;

        if (!view.state) {
            return {
                success: false
            };
        } else {
            state = view.state as IState;
            console.log('state', state);
            const team_url = state?.team_url?.url;
            const resource_type = state?.resource_block?.type;
            const { user } = context.getInteractionData();
     
            if (room) {
                if (!resource_type) {
                    botNotifyCurrentUser(
                        this.read,
                        this.modify,
                        user,
                        room,
                        'Please select a resource type'
                    );
                    return {
                        success: false
                    };
                }
                if (!team_url) {
                    botNotifyCurrentUser(
                        this.read,
                        this.modify,
                        user,
                        room,
                        'Please enter a team url'
                    );
                    return {
                        success: false
                    };
                }

                if (!resource_type || !team_url) {
                    botNotifyCurrentUser(
                        this.read,
                        this.modify,
                        user,
                        room,
                        'Please enter a team url and a resource type'
                    );
                    return {
                        success: false
                    };
                }
                const handler = new BlockActionHandler(
                    this.app,
                    this.read,
                    this.http,
                    this.modify,
                    user,
                    room
                );
                return handler.run(context, team_url, resource_type);
            } else {
                botNotifyCurrentUser(
                    this.read,
                    this.modify,
                    user,
                    room,
                    'Room Not found. Try again after some time. Check logs if it still does not work report the issue'
                );
                return {
                    success: false
                };
            }
        }
    }
}
