export interface doc {
    id: string;
    name: string;
    users?: string[];
    journal: message[];
}

export interface user {
    id: string;
    token: string;
    email: string;
    keysSecret: string;
}

export interface operation {
    ops: richTextOp[];
    v: number;
    hash?: string;
    deletedItems?: string;
}

export interface richTextOp {
    retain?: number;
    insert?: string;
    delete?: number;
}

export interface delta {
    ops: richTextOp[];
}

export interface player {
    snapshot: { ops: richTextOp[], v: number };
    ops: operation[];
}

export interface message {
    type: messageType;
    operation?: operation;
    newcomer?: string;
}

export enum messageType {
    operation,
    newcomer,
    backup,
}
