const Delta = require('quill-delta');
const richTextType = require('rich-text').type;

export function applyOp(p, r) {
    const player = deepClone(p);
    const receivedOp = deepClone(r);
    const moves = [];
    const alreadySeen = player.ops.find(op => op.v === receivedOp.v && op.hash === receivedOp.hash);

    if (alreadySeen) {
        return { player, moves };
    }

    receivedOp.originalOps = [...receivedOp.ops];
    if (receivedOp.v <= player.snapshot.v) {
        const ops = getOpsFromVersion(player.ops, receivedOp.v);
        ops.forEach(op => {
            const oppositeOp = getOppositeOp(op);
            const applied = richTextType.apply(player.snapshot.ops, oppositeOp).ops[0];
            player.snapshot.ops[0].insert = applied ? applied.insert : '';
            moves.push(oppositeOp);
            player.ops = player.ops.filter(o => o !== op);
        });

        if (isDeleteOperation(receivedOp)) {
            receivedOp.deletedItems = getDeletedCharacters(player, receivedOp);
        }

        const sortedOps = sortOpsByHashAndVersion([...ops, receivedOp]);
        sortedOps.forEach((op, index) => {
            if (index === 0 || op.v !== receivedOp.v) {
                if (isDeleteOperation(op)) {
                    op.deletedItems = getDeletedCharacters(player, op);
                }
                const applied = richTextType.apply(player.snapshot.ops, op).ops[0];
                player.snapshot.ops[0].insert = applied ? applied.insert : '';
                moves.push(op);
                player.ops.push(op);
            } else if (op.v === receivedOp.v) {
                if (op.originalOps) {
                    op.ops = [...op.originalOps];
                }
                op.ops = richTextType.transform(op, sortedOps[index - 1], 'left').ops;
                if (isDeleteOperation(op)) {
                    op.deletedItems = getDeletedCharacters(player, op);
                }
                player.ops.push(op);
                player.snapshot.ops[0].insert = richTextType.apply(player.snapshot.ops, op).ops[0].insert;
                moves.push(op);
            }
        });
    } else {
        if (isDeleteOperation(receivedOp)) {
            receivedOp.deletedItems = getDeletedCharacters(player, receivedOp);
        }
        player.ops.push(receivedOp);
        player.snapshot.ops[0].insert = richTextType.apply(player.snapshot.ops, receivedOp).ops[0].insert;
        moves.push(receivedOp);
    }

    player.snapshot.v = player.ops[player.ops.length - 1].v + 1;

    return { player, moves };
}

function sortOpsByHashAndVersion(ops) {
    return ops.sort((op1, op2) => {
        if (op1.v === op2.v) {
            return op1.hash >= op2.hash ? 1 : -1;
        } else {
            return op1.v >= op2.v ? 1 : -1;
        }
    });
}

function getOpsFromVersion(ops, version) {
    return ops
        .filter(o => o.v >= version)
        .sort((op1, op2) => {
            if (op1.v === op2.v) {
                return op1.hash <= op2.hash ? 1 : -1;
            } else {
                return op1.v < op2.v ? 1 : -1;
            }
        });
}

function getOppositeOp(op) {
    const oppositeOp = deepClone(op);

    if (isDeleteOperation(op)) {
        oppositeOp.ops[oppositeOp.ops.length - 1] = { insert: op.deletedItems };
    } else if (isInsertOperation(op)) {
        oppositeOp.ops[oppositeOp.ops.length - 1] = { delete: op.ops[oppositeOp.ops.length - 1].insert.length };
    }

    return oppositeOp;
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function isDeleteOperation(op) {
    return typeof op.ops[op.ops.length - 1]['delete'] === 'number';
}

function isInsertOperation(op) {
    return typeof op.ops[op.ops.length - 1]['insert'] === 'string';
}

function getDeletedCharacters(player, op) {
    const retain = op.ops[0].retain || 0;
    const deleted = op.ops[op.ops.length - 1].delete;
    return player.snapshot.ops[0].insert.substring(retain, retain + deleted);
}
