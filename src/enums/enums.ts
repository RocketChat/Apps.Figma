enum events {
    PING = 'PING',
    UPDATE = 'FILE_UPDATE',
    DELETE = 'FILE_DELETE',
    COMMENT = 'FILE_COMMENT',
    VERSION_UPDATE = 'FILE_VERSION_UPDATE',
    LIBRARY_PUBLISHED = 'LIBRARY_PUBLISH'
}

enum blockAction {
    SUBSCRIPTIONS = 'GET_SUBSCRIPTIONS',
    FILES = 'GET_FILES',
    PROJECTS = 'GET_PROJECTS',
    TEAMS = 'GET_TEAMS',
    REPLY = 'REPLY_TO_COMMENT',
    OPEN_FILE = 'OPEN_FILE',
    REACT = 'REACT_TO_COMMENT',
    POST = 'POST_REPLY',
    FILE_ACTIONS = 'FILES_ACTIONS',
    COMMENT = 'COMMENT_ON_FILE'
}

enum modalTitle {
    EVENT_MODAL = 'Select Event Types',
    NOTIFICATION_MODAL = 'Get Figma Notifications',
    REPLY_MODAL = 'Reply to Comment'
}

enum modalId {
    SUBSCRIPTION_VIEW = 'subscriptionView',
    EVENT_MODAL_VIEW = 'eventView',
    REPLY_VIEW = 'replyView',
    COMMENT_VIEW = 'commentView'
}

enum commands {
    FIGMA = 'figma',
    CONNECT = 'connect',
    SUBSCRIBE = 'subscribe',
    UNSUBSCRIBE = 'unsubscribe',
    HELP = 'help',
    LIST = 'list',
    REPLY = 'reply',
    REACT = 'react',
    POST = 'post',
    OFF = 'off',
    ON = 'on'
}

enum blockId {
    RESOURCE_BLOCK = 'resource_block',
    TEAM_URL = 'team_url'
}
export { events, blockAction, modalTitle, commands, blockId, modalId };
