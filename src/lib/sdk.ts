import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
const crypto = require("crypto");

const BaseFileHost = "https://www.figma.com/file/";
const BaseTeamHost = "https://www.figma.com/files/team/";
const BaseApiHost = "https://www.figma.com/api";

const passcode = crypto.randomBytes(48).toString("hex");

// figmaSDK class contains all the methods to interact with figma API
export class FigmaSDK {
    constructor(private readonly http: IHttp, private readonly accessToken) {}

    public createWebhook(fileID: string, webhookUrl: string) {
        return this.post("https://api.figma.com/v2/webhooks", {
            active: true,
            event_type: "FILE_COMMENT",
            team_id: "1051788064684166795",
            events: ["push"],
            endpoint: webhookUrl,
            passcode,
            content_type: "json",
        });
    }

    private async post(url: string, data: any): Promise<any> {
        const response = await this.http.post(url, {
            headers: {
                "X-Figma-Token": this.accessToken,
                "Content-Type": "application/json",
                "User-Agent": "Rocket.Chat-Apps-Engine",
            },
            data,
        });

        console.log(response.statusCode);
        // If it isn't a 2xx code, something wrong happened
        if (!response.statusCode.toString().startsWith("2")) {
            throw response;
        }
        console.log("figma response - ", response);

        return JSON.parse(response.content || "{}");
    }
}
//file url example - https://www.figma.com/file/b0l0lp73g04EgbqDeNiHh4/file-2
export function getFileName(fileURL: string): string {
    if (!fileURL.startsWith(BaseTeamHost)) {
        return "";
    }

    const apiUrl = fileURL.substring(BaseFileHost.length);
    const fileName = apiUrl.split("/")[1].split("?")[0];
    return fileName;
}

export function getFileID(fileURL: string): string {
    if (!fileURL.startsWith(BaseTeamHost)) {
        return "";
    }

    const apiUrl = fileURL.substring(BaseTeamHost.length);
    const fileID = apiUrl.split("/")[0];
    return fileID;
}

export function getTeamID(teamURL: string): string {
    if (!teamURL.startsWith(BaseTeamHost)) {
        return "";
    }
    const id = teamURL.substring(BaseTeamHost.length).split("/")[0];
    const teamID = id;
    return teamID;
}

export function getTeamName(teamURL: string): string {
    if (!teamURL.startsWith(BaseTeamHost)) {
        return "";
    }

    const apiUrl = teamURL.substring(BaseTeamHost.length);
    const teamID = apiUrl.split("/")[0];
    return teamID;
}
