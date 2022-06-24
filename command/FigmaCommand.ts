import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { FigmaApp } from "../FigmaApp";
import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { createSectionBlock, IButton } from "../src/lib/block";
import { sendDM } from "../src/lib/messages";

export class FigmaCommand implements ISlashCommand {
    public command = "figma";
    public i18nParamsExample = "params_example";
    public i18nDescription = "cmd_description";
    public providesPreview = false;

    public constructor(private readonly app: FigmaApp) {}

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence
    ): Promise<void> {
        const [command] = context.getArguments();

        switch (command) {
            case "connect":
                await this.figmaConnectCommand(
                    this.app,
                    read,
                    modify,
                    context.getSender(),
                    persistence
                );
                break;
            case "help":
                await this.figmaHelpCommand(
                    read,
                    modify,
                    context.getSender(),
                    persistence
                );
                break;
            default:
                await this.figmaConfuseCommand(
                    read,
                    modify,
                    context.getSender(),
                    persistence
                );
                break;
        }
    }

    public async figmaHelpCommand(
        read: IRead,
        modify: IModify,
        user: IUser,
        persistence: IPersistence
    ) {
        const message = `Commands available inside a channel:
        \xa0\xa0• To connect your Figma account with the rocket chat server use command \`/figma connect\`.
        \xa0\xa0• To subscribe for updates to a any file/project from figma inside rocket chat use command \`/figma subscribe\`.
        \xa0\xa0 • To unsubscribe to a file inside a channel use \`/figma unsubscribe\`.

          Commands available inside Direct Messages:
        \xa0\xa0• \` /figma off \` to turn off notifications.
        \xa0\xa0• \` /figma on \` to turn notifications back on.
         `;
        await sendDM(read, modify, user, message, persistence);
    }
    public async figmaConfuseCommand(
        read: IRead,
        modify: IModify,
        user: IUser,
        persistence: IPersistence
    ) {
        const message = `Hmmm. I didn't really understand that last message.
         Try \`/figma help\` to see the commands available
         `;
        await sendDM(read, modify, user, message, persistence);
    }
    public async figmaConnectCommand(
        app: FigmaApp,
        read: IRead,
        modify: IModify,
        user: IUser,
        persistence: IPersistence
    ) {
        const url = await app
            .getOauth2ClientInstance()
            .getUserAuthorizationUrl(user);

        const button: IButton = {
            text: "Connect Your Account",
            url: url.toString(),
        };

        const message = `
        Connect your Figma account to start getting notifications.
        With Figma App, you can reply to file comments directly in a rocket chat channel. You will get notified when:
            \xa0\xa0 • A new comment is added to a file you are collaborating on.
            \xa0\xa0 • Someone replies to a comment you made.
            \xa0\xa0 • You are tagged in a file.
            \xa0\xa0 • You are invited to a file.
            \xa0\xa0 • A file you are collaborating on is updated.`;

        const block = await createSectionBlock(modify, message, button);
        await sendDM(read, modify, user, "", persistence, block);
    }
}
