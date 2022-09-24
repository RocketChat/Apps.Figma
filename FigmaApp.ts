import {
    IAppAccessors,
    IAppInstallationContext,
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import {
    IAuthData,
    IOAuth2Client,
    IOAuth2ClientOptions
} from '@rocket.chat/apps-engine/definition/oauth2/IOAuth2';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { botNotifyCurrentUser, sendDMToUser } from './src/lib/messages';
import { create as registerAuthorizedUser } from './src/storage/users';
import { createOAuth2Client } from '@rocket.chat/apps-engine/definition/oauth2/OAuth2';
import { FigmaCommand } from './src/command/FigmaCommand';
import {
    UIKitBlockInteractionContext,
    UIKitViewSubmitInteractionContext
} from '@rocket.chat/apps-engine/definition/uikit';
import { figmaWebHooks } from './src/endpoints/figmaEndpoints';
import {
    ApiSecurity,
    ApiVisibility
} from '@rocket.chat/apps-engine/definition/api';
import { ExecuteViewSubmitHandler } from './src/handlers/submit';
import { AddSubscription } from './src/subscription/addSubscription';
import { getRoom } from './src/storage/room';
import { BlockActionHandler } from './src/handlers/BlockActionHandler';
import { ExecuteReplyHandler } from './src/handlers/reply';
import { modalTitle } from './src/enums/enums';
import { CommentModalHandler } from './src/handlers/comment';

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
        authorizationCallback: this.authorizationCallback.bind(this)
    };

    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        const user: IUser = context.getInteractionData().user;
        const room = await getRoom(read, user);
        if (room) {
            // we are using modal title to check different modals as for updated modal modal id will be same
            if (
                context.getInteractionData().view.title.text ===
                modalTitle.NOTIFICATION_MODAL
            ) {
                const handler = new ExecuteViewSubmitHandler(
                    this,
                    read,
                    http,
                    modify,
                    persistence
                );
                return await handler
                    .run(context, room)
                    .catch((err) =>
                        console.log('error: submitting Events modal', err)
                    );
            } else if (
                context.getInteractionData().view.title.text ===
                modalTitle.EVENT_MODAL
            ) {
                const handler = new AddSubscription(
                    this,
                    read,
                    http,
                    modify,
                    persistence
                );
                return await handler
                    .run(context, room)
                    .catch((err) =>
                        console.log('error: submitting 2nd modal', err)
                    );
            } else if (
                context.getInteractionData().view.title.text ===
                modalTitle.REPLY_MODAL
            ) {
                const handler = new ExecuteReplyHandler(
                    this,
                    read,
                    http,
                    modify,
                    persistence
                );
                return await handler.run(context, room);
            } else if (
                context.getInteractionData().view.title.text ===
                modalTitle.CREATE_COMMENT_MODAL
            ) {
                const handler = new CommentModalHandler(
                    this,
                    read,
                    http,
                    modify,
                    persistence
                );
                return await handler.run(context, room);
            } else {
                console.log('error: please check the modal title');
                return context.getInteractionResponder().successResponse();
            }
        } else {
            console.log('error: room does not exist');
        }
        context.getInteractionResponder().successResponse();
    }

    public async executeViewClosedHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        const user = context.getInteractionData().user;
        const room = await getRoom(read, user);

        if (room) {
            botNotifyCurrentUser(
                read,
                modify,
                user,
                room,
                'Modal View was closed'
            );
        } else {
            console.log('error: room not found');
        }
        return context.getInteractionResponder().successResponse();
    }

    public async executeBlockActionHandler(
        context: UIKitBlockInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        // handle action when the subscriptions buttons are clicked
        const blockActionHandler = new BlockActionHandler(
            this,
            read,
            http,
            modify,
            persistence
        );
        return blockActionHandler.run(context, read, http, persistence, modify);
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
            const userData = await http.get('https://api.figma.com/v1/me', {
                headers: {
                    Authorization: `Bearer ${authData.token}`
                }
            });
            await registerAuthorizedUser(
                read,
                persistence,
                user,
                authData,
                userData.data
            );
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
        const welcomeMessage = `You’ve successfully installed Figma Rocket.Chat app! Now the admin of the server has to create an app on figma.com and add the figma client id and client secret to the app settings in order to connect the server with figma.
        1. Go to  https://www.figma.com/developers/apps and create a new app.
        2. Get the callback url from the app settings page ( -> admin panel -> apps) in rocket.chat and add it to the figma app.
        3. Copy the client id and client secret and paste it in the app settings ( don't forget to click on save button )
        :tada: You are all set!

        Now your Figma comments and notifications will show up in the rocket chat server.
        With Figma App, you can reply to file comments directly in a rocket chat channel. You will get notified when:
        \xa0\xa0 • A new comment is added to a file you are collaborating on.
        \xa0\xa0 • Someone replies to a comment you made.
        \xa0\xa0 • You are tagged in a file.
        \xa0\xa0 • You are invited to a file.
        \xa0\xa0 • A file you are collaborating on is updated.
        \xa0\xa0 • Notifications on Branches ( for organizations only ).

        Some tips:
        \xa0\xa0 • When you reply to a Figma comment here, your reply will automatically be added to the Figma file.
        \xa0\xa0 • Type \` /figma connect \` to connect your figma account to the rocket.chat server.
        \xa0\xa0 • Type \` /figma help  \` for all the commands command.
        \xa0\xa0 • Subscribe a file, team, or project in a channel using \` /figma subscribe  \` and notify all the users that they will have to authenticate their figma accounts using  \` /figma connect \`. `;
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
            )
        ]);
        configuration.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [new figmaWebHooks(this)]
        });
    }
}
