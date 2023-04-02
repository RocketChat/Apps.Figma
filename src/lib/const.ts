const ApiBaseUrl: string = 'https://api.figma.com';

const ApiVersion = {
    V1: 'v1',
    V2: 'v2'
};

const ApiEndpoint = {
    Team:'teams',
    Project:'projects',
    File:'files',
    Webhook:'webhooks',
    Comment:'comments',
    Me:'me'
};

export const getTeamProjectsUrl =(teamId:string)=>{
    return `${ApiBaseUrl}/${ApiVersion.V1}/${ApiEndpoint.Team}/${teamId}/${ApiEndpoint.Project}`;
};

export const getProjectFilesUrl =(projectId:string)=>{
    return `${ApiBaseUrl}/${ApiVersion.V1}/${ApiEndpoint.Project}/${projectId}/${ApiEndpoint.File}`;
};

export const getFilesUrl =(fileId:string)=>{
    return `${ApiBaseUrl}/${ApiVersion.V1}/${ApiEndpoint.File}/${fileId}`;
};

export const getFileCommentsUrl =(fileId:string)=>{
    return `${ApiBaseUrl}/${ApiVersion.V1}/${ApiEndpoint.File}/${fileId}/${ApiEndpoint.Comment}`;
};

export const webHooksUrl =()=>{
    return `${ApiBaseUrl}/${ApiVersion.V2}/${ApiEndpoint.Webhook}`;
};

export const meUrl =()=>{
    return `${ApiBaseUrl}/${ApiVersion.V2}/${ApiEndpoint.Me}`;
};


