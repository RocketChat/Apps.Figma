import { FigmaApp } from "../FigmaApp";
import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { createSectionBlock, IButton } from "../src/lib/block";
import { sendDMToUser } from "../src/lib/messages";

export async function figmaConnectCommand(
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
    await sendDMToUser(read, modify, user, "", persistence, block);
}
