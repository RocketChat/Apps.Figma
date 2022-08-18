import {
    IAppAccessors,
    IAppInstallationContext,
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import {
    IAppInfo,
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import {
    IAuthData,
    IOAuth2Client,
    IOAuth2ClientOptions,
} from '@rocket.chat/apps-engine/definition/oauth2/IOAuth2';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { sendDMToUser } from './src/lib/messages';
import { create as registerAuthorizedUser } from './src/storage/users';
import { createOAuth2Client } from '@rocket.chat/apps-engine/definition/oauth2/OAuth2';
import { FigmaCommand } from './command/FigmaCommand';
import {
    UIKitBlockInteractionContext,
    UIKitViewSubmitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import { IProjectModalData, IState } from './src/definition';
import { figmaWebHooks } from './src/endpoints/figmaEndpoints';
import {
    ApiSecurity,
    ApiVisibility,
} from '@rocket.chat/apps-engine/definition/api';
import { ExecuteViewSubmitHandler } from './src/handlers/submit';
import { BlockActionHandler } from './src/handlers/action';
import { AddSubscription } from './src/subscription/addSubscription';
import { IModalContext } from './src/definition';
import { getInteractionRoomData } from './src/storage/room';

export class FigmaApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public user: IUser;
    public botName: string;

    public oauth2ClientInstance: IOAuth2Client;
    public oauth2Options: IOAuth2ClientOptions = {
        alias: 'figma',
        accessTokenUri: 'https://www.figma.com/api/oauth/token',
        authUri: 'https://www.figma.com/oauth',
        refreshTokenUri: 'https://www.figma.com/api/oauth/refresh',
        revokeTokenUri: 'https://api.figma.com/v1/oauth/revoke_token',
        defaultScopes: ['file_read'],
        authorizationCallback: this.authorizationCallback.bind(this),
    };

    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        const user: IUser = context.getInteractionData().user;

        const roomFromStorage = await getInteractionRoomData(
            read.getPersistenceReader(),
            user.id
        );
        const room = await read
            .getRoomReader()
            .getById(roomFromStorage.roomId!);

        if (room) {
            if (
                context.getInteractionData().view.title.text ===
                'Select Event Types'
            ) {
                console.log('event type modal submitted');
                const handler = new AddSubscription(
                    this,
                    read,
                    http,
                    modify,
                    persistence
                );

                return await handler.run(context, room);
            } else if (
                context.getInteractionData().view.title.text ===
                'Get Figma Notifications'
            ) {
                console.log('team id modal submitted');
                const handler = new ExecuteViewSubmitHandler(
                    this,
                    read,
                    http,
                    modify,
                    persistence
                );
                // when the second modal is submitted then console.log the data
                return await handler.run(context, room);
            } else {
                console.log('❎❎❎❎❎❎ No modal called ❎❎❎❎❎❎');
                return;
            }
        }
        return;
    }

    public async executeBlockActionHandler(
        context: UIKitBlockInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        const data = context.getInteractionData();
        if (data.blockId === 'project_name') {
        } else {
        }
        // const handler = new BlockActionHandler(
        //     this,
        //     read,
        //     http,
        //     modify,
        //     persistence
        // );
        // return await handler.run(context);
    }

    private async authorizationCallback(
        authData: IAuthData,
        user: IUser,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence
    ) {
        if (authData) {
            await registerAuthorizedUser(read, persistence, user);
        }

        const text = `Authentication was successful! ✨
        You will now be notified for all your Figma comments and notifications.
        You can subscribe to your team channel with files you want to receive notifications from.
        `;
        await sendDMToUser(read, modify, user, text, persistence);
    }

    public async onEnable(): Promise<boolean> {
        this.user = (await this.getAccessors()
            .reader.getUserReader()
            .getByUsername(this.botName)) as IUser;

        this.botName = 'Figma.bot';
        return true;
    }

    public async onInstall(
        context: IAppInstallationContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        const user = context.user;
        const welcomeMessage = `You’ve successfully installed Figma Rocket.Chat app! Now your Figma comments and notifications will show up here. :tada:
        With Figma App, you can reply to file comments directly in a rocket chat channel. You will get notified when:
        \xa0\xa0 • A new comment is added to a file you are collaborating on.
        \xa0\xa0 • Someone replies to a comment you made.
        \xa0\xa0 • You are tagged in a file.
        \xa0\xa0 • You are invited to a file.
        \xa0\xa0 • A file you are collaborating on is updated.

        Some tips:
        \xa0\xa0 • When you reply to a Figma comment here, your reply will automatically be added to the Figma file.
        \xa0\xa0 • Type \` /figma connect \` to connect your figma account to the rocket.chat server.
        \xa0\xa0 • Type \` /figma help  \` for command. `;
        await sendDMToUser(read, modify, user, welcomeMessage, persistence);
    }

    public getOauth2ClientInstance(): IOAuth2Client {
        if (!this.oauth2ClientInstance) {
            this.oauth2ClientInstance = createOAuth2Client(
                this,
                this.oauth2Options
            );
        }
        return this.oauth2ClientInstance;
    }

    protected async extendConfiguration(
        configuration: IConfigurationExtend,
        environmentRead: IEnvironmentRead
    ): Promise<void> {
        await Promise.all([
            this.getOauth2ClientInstance().setup(configuration),
            configuration.slashCommands.provideSlashCommand(
                new FigmaCommand(this)
            ),
        ]);
        configuration.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [new figmaWebHooks(this)],
        });
    }
}
