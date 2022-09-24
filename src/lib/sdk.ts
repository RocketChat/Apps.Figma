const BaseFileHost = 'https://www.figma.com/file/';
const BaseTeamHost = 'https://www.figma.com/files/team/';
const BaseProjectHost = 'https://www.figma.com/files/project/';


export function getFileName(fileURL: string): string {
    if (!fileURL.startsWith(BaseFileHost)) {
        return '';
    }

    const apiUrl = fileURL.substring(BaseFileHost.length);
    const fileName = apiUrl.split('/')[1].split('?')[0];
    return fileName;
}

// file url - https://www.figma.com/file/f6dNpg1iG3KXgy4BpPaKMK/Twitter-Content?node-id=0%3A1
export function getFileID(fileURL: string): string {
    if (!fileURL.startsWith(BaseFileHost)) {
        return '';
    }
    const apiUrl = fileURL.substring(BaseFileHost.length);
    const fileID = apiUrl.split('/')[0];
    return fileID;
}

export function getTeamID(teamURL: string): string {
    if (!teamURL.startsWith(BaseTeamHost)) {
        return '';
    }
    const id = teamURL.substring(BaseTeamHost.length).split('/')[0];
    const teamID = id;
    return teamID;
}
// project url - https://www.figma.com/files/project/53807385/project1?fuid=983416835186317142
export function getProjectID(teamURL: string): string {
    if (!teamURL.startsWith(BaseProjectHost)) {
        return '';
    }
    const id = teamURL.substring(BaseProjectHost.length).split('/')[0];
    const projectID = id;
    return projectID;
}
