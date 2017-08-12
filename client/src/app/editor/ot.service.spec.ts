import { applyOp } from './ot.service';

describe('transformation algorithm', () => {

    it('should work for the trivial situation', () => {
        const op1 = { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '1423' }], v: 1 },
                ops: [Object.assign({}, op1, { originalOps: op1.ops })]
            },
            b: {
                snapshot: { ops: [{ insert: '123' }], v: 0 },
                ops: []
            },
            c: {
                snapshot: { ops: [{ insert: '123' }], v: 0 },
                ops: []
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '1423' }], v: 1 },
            ops: [
                { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a', originalOps: op1.ops },
            ]
        };

        players.b = applyOp(players.b, op1).player;
        players.c = applyOp(players.c, op1).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });

    it('should handle three players send at the same time', () => {
        const op1 = { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a' };
        const op2 = { ops: [{ retain: 1 }, { delete: 1 }], v: 0, hash: 'b', deletedItems: '2' };
        const op3 = { ops: [{ retain: 1 }, { insert: '5' }], v: 0, hash: 'c' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '1423' }], v: 1 },
                ops: [Object.assign({}, op1, { originalOps: op1.ops })]
            },
            b: {
                snapshot: { ops: [{ insert: '13' }], v: 1 },
                ops: [Object.assign({}, op2, { originalOps: op2.ops })]
            },
            c: {
                snapshot: { ops: [{ insert: '1523' }], v: 1 },
                ops: [Object.assign({}, op3, { originalOps: op3.ops })]
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '1543' }], v: 1 },
            ops: [
                { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a', originalOps: op1.ops },
                { ops: [{ retain: 2 }, { delete: 1 }], v: 0, hash: 'b', deletedItems: '2', originalOps: op2.ops },
                { ops: [{ retain: 1 }, { insert: '5' }], v: 0, hash: 'c', originalOps: op3.ops }
            ]
        };

        players.a = applyOp(players.a, op2).player;
        players.a = applyOp(players.a, op3).player;
        players.b = applyOp(players.b, op3).player;
        players.b = applyOp(players.b, op1).player;
        players.c = applyOp(players.c, op2).player;
        players.c = applyOp(players.c, op1).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });

    it('should handle two players send at the same time, third player gets the correct order', () => {
        const op1 = { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a' };
        const op2 = { ops: [{ retain: 1 }, { delete: 1 }], v: 0, hash: 'b', deletedItems: '2' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '1423' }], v: 1 },
                ops: [Object.assign({}, op1, { originalOps: op1.ops })]
            },
            b: {
                snapshot: { ops: [{ insert: '13' }], v: 1 },
                ops: [Object.assign({}, op2, { originalOps: op2.ops })]
            },
            c: {
                snapshot: { ops: [{ insert: '123' }], v: 0 },
                ops: []
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '143' }], v: 1 },
            ops: [
                { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a', originalOps: op1.ops },
                { ops: [{ retain: 2 }, { delete: 1 }], v: 0, hash: 'b', deletedItems: '2', originalOps: op2.ops },
            ]
        };

        players.a = applyOp(players.a, op2).player;
        players.b = applyOp(players.b, op1).player;
        players.c = applyOp(players.c, op1).player;
        players.c = applyOp(players.c, op2).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });

    it('should handle two players send at the same time, third player gets the wrong order', () => {
        const op1 = { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a' };
        const op2 = { ops: [{ retain: 1 }, { delete: 1 }], v: 0, hash: 'b', deletedItems: '2' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '1423' }], v: 1 },
                ops: [Object.assign({}, op1, { originalOps: op1.ops })]
            },
            b: {
                snapshot: { ops: [{ insert: '13' }], v: 1 },
                ops: [Object.assign({}, op2, { originalOps: op2.ops })]
            },
            c: {
                snapshot: { ops: [{ insert: '123' }], v: 0 },
                ops: []
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '143' }], v: 1 },
            ops: [
                { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a', originalOps: op1.ops },
                { ops: [{ retain: 2 }, { delete: 1 }], v: 0, hash: 'b', deletedItems: '2', originalOps: op2.ops },
            ]
        };

        players.a = applyOp(players.a, op2).player;
        players.b = applyOp(players.b, op1).player;
        players.c = applyOp(players.c, op2).player;
        players.c = applyOp(players.c, op1).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });

    it('should handle three players send at the same time, one of them sends two messages', () => {
        const op1 = { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a' };
        const op2 = { ops: [{ retain: 1 }, { delete: 1 }], v: 0, hash: 'b', deletedItems: '2' };
        const op3 = { ops: [{ retain: 1 }, { insert: '5' }], v: 0, hash: 'c' };
        const op4 = { ops: [{ retain: 3 }, { insert: '7' }], v: 1, hash: 'a1' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '14273' }], v: 2 },
                ops: [Object.assign({}, op1, { originalOps: op1.ops }), Object.assign({}, op4, { originalOps: op4.ops })]
            },
            b: {
                snapshot: { ops: [{ insert: '13' }], v: 1 },
                ops: [Object.assign({}, op2, { originalOps: op2.ops })]
            },
            c: {
                snapshot: { ops: [{ insert: '1523' }], v: 1 },
                ops: [Object.assign({}, op3, { originalOps: op3.ops })]
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '15473' }], v: 2 },
            ops: [
                { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a', originalOps: op1.ops },
                { ops: [{ retain: 2 }, { delete: 1 }], v: 0, hash: 'b', deletedItems: '2', originalOps: op2.ops },
                { ops: [{ retain: 1 }, { insert: '5' }], v: 0, hash: 'c', originalOps: op3.ops },
                { ops: [{ retain: 3 }, { insert: '7' }], v: 1, hash: 'a1', originalOps: op4.ops }
            ]
        };

        players.a = applyOp(players.a, op2).player;
        players.a = applyOp(players.a, op3).player;
        players.b = applyOp(players.b, op3).player;
        players.b = applyOp(players.b, op1).player;
        players.b = applyOp(players.b, op4).player;
        players.c = applyOp(players.c, op2).player;
        players.c = applyOp(players.c, op1).player;
        players.c = applyOp(players.c, op4).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });

    it('should handle three players send at the same time, one of them sends two messages', () => {
        const op1 = { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a' };
        const op2 = { ops: [{ retain: 1 }, { delete: 1 }], v: 0, hash: 'bbb', deletedItems: '2' };
        const op3 = { ops: [{ retain: 1 }, { insert: '5' }], v: 0, hash: 'c' };
        const op4 = { ops: [{ retain: 1 }, { insert: '7' }], v: 1, hash: 'aa' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '17423' }], v: 2 },
                ops: [Object.assign({}, op1, { originalOps: op1.ops }), Object.assign({}, op4, { originalOps: op4.ops })]
            },
            b: {
                snapshot: { ops: [{ insert: '13' }], v: 1 },
                ops: [Object.assign({}, op2, { originalOps: op2.ops })]
            },
            c: {
                snapshot: { ops: [{ insert: '1523' }], v: 1 },
                ops: [Object.assign({}, op3, { originalOps: op3.ops })]
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '17543' }], v: 2 },
            ops: [
                { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a', originalOps: op1.ops },
                { ops: [{ retain: 2 }, { delete: 1 }], v: 0, hash: 'bbb', deletedItems: '2', originalOps: op2.ops },
                { ops: [{ retain: 1 }, { insert: '5' }], v: 0, hash: 'c', originalOps: op3.ops },
                { ops: [{ retain: 1 }, { insert: '7' }], v: 1, hash: 'aa', originalOps: op4.ops }
            ]
        };

        players.a = applyOp(players.a, op2).player;
        players.a = applyOp(players.a, op3).player;
        players.b = applyOp(players.b, op3).player;
        players.b = applyOp(players.b, op1).player;
        players.b = applyOp(players.b, op4).player;
        players.c = applyOp(players.c, op2).player;
        players.c = applyOp(players.c, op1).player;
        players.c = applyOp(players.c, op4).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });

    it('should handle delete more than one character', () => {
        const op1 = { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a' };
        const op2 = { ops: [{ retain: 1 }, { delete: 2 }], v: 0, hash: 'b', deletedItems: '23' };
        const op3 = { ops: [{ retain: 1 }, { insert: '5' }], v: 0, hash: 'c' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '1423' }], v: 1 },
                ops: [Object.assign({}, op1, { originalOps: op1.ops })]
            },
            b: {
                snapshot: { ops: [{ insert: '1' }], v: 1 },
                ops: [Object.assign({}, op2, { deletedItems: '23', originalOps: op2.ops })]
            },
            c: {
                snapshot: { ops: [{ insert: '1523' }], v: 1 },
                ops: [Object.assign({}, op3, { originalOps: op3.ops })]
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '154' }], v: 1 },
            ops: [
                { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a', originalOps: op1.ops },
                { ops: [{ retain: 2 }, { delete: 2 }], v: 0, hash: 'b', deletedItems: '23', originalOps: op2.ops },
                { ops: [{ retain: 1 }, { insert: '5' }], v: 0, hash: 'c', originalOps: op3.ops }
            ]
        };

        players.a = applyOp(players.a, op2).player;
        players.a = applyOp(players.a, op3).player;
        players.b = applyOp(players.b, op3).player;
        players.b = applyOp(players.b, op1).player;
        players.c = applyOp(players.c, op2).player;
        players.c = applyOp(players.c, op1).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });

    it('should handle one player gets operations with wrong versions order', () => {
        const op1 = { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a9' };
        const op2 = { ops: [{ retain: 2 }, { delete: 1 }], v: 1, hash: 'a1', deletedItems: '2' };
        const op3 = { ops: [{ retain: 1 }, { insert: '5' }], v: 2, hash: 'a5' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '1543' }], v: 3 },
                ops: [
                    { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a9', originalOps: [{ retain: 1 }, { insert: '4' }] },
                    {
                        ops: [{ retain: 2 }, { delete: 1 }],
                        v: 1, hash: 'a1', deletedItems: '2', originalOps: [{ retain: 2 }, { delete: 1 }]
                    },
                    { ops: [{ retain: 1 }, { insert: '5' }], v: 2, hash: 'a5', originalOps: [{ retain: 1 }, { insert: '5' }] }
                ]
            },
            b: {
                snapshot: { ops: [{ insert: '123' }], v: 0 },
                ops: []
            },
            c: {
                snapshot: { ops: [{ insert: '123' }], v: 0 },
                ops: []
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '1543' }], v: 3 },
            ops: [
                { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a9', originalOps: [{ retain: 1 }, { insert: '4' }] },
                { ops: [{ retain: 2 }, { delete: 1 }], v: 1, hash: 'a1', deletedItems: '2', originalOps: [{ retain: 2 }, { delete: 1 }] },
                { ops: [{ retain: 1 }, { insert: '5' }], v: 2, hash: 'a5', originalOps: [{ retain: 1 }, { insert: '5' }] },
            ]
        };

        players.b = applyOp(players.b, op1).player;
        players.b = applyOp(players.b, op2).player;
        players.b = applyOp(players.b, op3).player;
        players.c = applyOp(players.c, op2).player;
        players.c = applyOp(players.c, op1).player;
        players.c = applyOp(players.c, op3).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });

    it('should handle one player gets operations with wrong versions order', () => {
        const op1 = { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a9' };
        const op2 = { ops: [{ retain: 2 }, { delete: 1 }], v: 1, hash: 'a1', deletedItems: '2' };
        const op3 = { ops: [{ retain: 1 }, { insert: '5' }], v: 2, hash: 'a5' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '1543' }], v: 3 },
                ops: [
                    { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a9', originalOps: [{ retain: 1 }, { insert: '4' }] },
                    {
                        ops: [{ retain: 2 },
                        { delete: 1 }], v: 1, hash: 'a1', deletedItems: '2', originalOps: [{ retain: 2 }, { delete: 1 }]
                    },
                    { ops: [{ retain: 1 }, { insert: '5' }], v: 2, hash: 'a5', originalOps: [{ retain: 1 }, { insert: '5' }] }
                ]
            },
            b: {
                snapshot: { ops: [{ insert: '123' }], v: 0 },
                ops: []
            },
            c: {
                snapshot: { ops: [{ insert: '123' }], v: 0 },
                ops: []
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '1543' }], v: 3 },
            ops: [
                { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a9', originalOps: [{ retain: 1 }, { insert: '4' }] },
                { ops: [{ retain: 2 }, { delete: 1 }], v: 1, hash: 'a1', deletedItems: '2', originalOps: [{ retain: 2 }, { delete: 1 }] },
                { ops: [{ retain: 1 }, { insert: '5' }], v: 2, hash: 'a5', originalOps: [{ retain: 1 }, { insert: '5' }] },
            ]
        };

        players.b = applyOp(players.b, op1).player;
        players.b = applyOp(players.b, op2).player;
        players.b = applyOp(players.b, op3).player;
        players.c = applyOp(players.c, op1).player;
        players.c = applyOp(players.c, op3).player;
        players.c = applyOp(players.c, op2).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });

    it('should handle one player gets operations with wrong versions order', () => {
        const op1 = { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a9' };
        const op2 = { ops: [{ retain: 2 }, { delete: 1 }], v: 1, hash: 'a1', deletedItems: '2' };
        const op3 = { ops: [{ retain: 1 }, { insert: '5' }], v: 2, hash: 'a5' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '1543' }], v: 3 },
                ops: [
                    { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a9', originalOps: [{ retain: 1 }, { insert: '4' }] },
                    {
                        ops: [{ retain: 2 },
                        { delete: 1 }], v: 1, hash: 'a1', deletedItems: '2', originalOps: [{ retain: 2 }, { delete: 1 }]
                    },
                    { ops: [{ retain: 1 }, { insert: '5' }], v: 2, hash: 'a5', originalOps: [{ retain: 1 }, { insert: '5' }] }
                ]
            },
            b: {
                snapshot: { ops: [{ insert: '123' }], v: 0 },
                ops: []
            },
            c: {
                snapshot: { ops: [{ insert: '123' }], v: 0 },
                ops: []
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '1543' }], v: 3 },
            ops: [
                { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a9', originalOps: [{ retain: 1 }, { insert: '4' }] },
                { ops: [{ retain: 2 }, { delete: 1 }], v: 1, hash: 'a1', deletedItems: '2', originalOps: [{ retain: 2 }, { delete: 1 }] },
                { ops: [{ retain: 1 }, { insert: '5' }], v: 2, hash: 'a5', originalOps: [{ retain: 1 }, { insert: '5' }] },
            ]
        };

        players.b = applyOp(players.b, op1).player;
        players.b = applyOp(players.b, op2).player;
        players.b = applyOp(players.b, op3).player;
        players.c = applyOp(players.c, op3).player;
        players.c = applyOp(players.c, op2).player;
        players.c = applyOp(players.c, op1).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });

    it('should handle one player gets operations with wrong versions order and delete two characters', () => {
        const op1 = { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a9' };
        const op2 = { ops: [{ retain: 2 }, { delete: 2 }], v: 1, hash: 'a1', deletedItems: '23' };
        const op3 = { ops: [{ retain: 1 }, { insert: '5' }], v: 2, hash: 'a5' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '154' }], v: 3 },
                ops: [
                    { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a9', originalOps: [{ retain: 1 }, { insert: '4' }] },
                    {
                        ops: [{ retain: 2 },
                        { delete: 2 }], v: 1, hash: 'a1', deletedItems: '23', originalOps: [{ retain: 2 }, { delete: 2 }]
                    },
                    { ops: [{ retain: 1 }, { insert: '5' }], v: 2, hash: 'a5', originalOps: [{ retain: 1 }, { insert: '5' }] }
                ]
            },
            b: {
                snapshot: { ops: [{ insert: '123' }], v: 0 },
                ops: []
            },
            c: {
                snapshot: { ops: [{ insert: '123' }], v: 0 },
                ops: []
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '154' }], v: 3 },
            ops: [
                { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a9', originalOps: [{ retain: 1 }, { insert: '4' }] },
                { ops: [{ retain: 2 }, { delete: 2 }], v: 1, hash: 'a1', deletedItems: '23', originalOps: [{ retain: 2 }, { delete: 2 }] },
                { ops: [{ retain: 1 }, { insert: '5' }], v: 2, hash: 'a5', originalOps: [{ retain: 1 }, { insert: '5' }] },
            ]
        };

        players.b = applyOp(players.b, op1).player;
        players.b = applyOp(players.b, op2).player;
        players.b = applyOp(players.b, op3).player;
        players.c = applyOp(players.c, op2).player;
        players.c = applyOp(players.c, op1).player;
        players.c = applyOp(players.c, op3).player;


        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });

    it('should handle new two operations when user already have older operation', () => {
        const op1 = { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a' };
        const op2 = { ops: [{ retain: 1 }, { delete: 1 }], v: 1, hash: 'b', deletedItems: '4' };
        const op3 = { ops: [{ retain: 1 }, { insert: '5' }], v: 1, hash: 'c' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '1423' }], v: 1 },
                ops: [{ ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a', originalOps: [{ retain: 1 }, { insert: '4' }] }]
            },
            b: {
                snapshot: { ops: [{ insert: '123' }], v: 2 },
                ops: [
                    { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a', originalOps: [{ retain: 1 }, { insert: '4' }] },
                    { ops: [{ retain: 1 }, { delete: 1 }], v: 1, hash: 'b', deletedItems: '4', originalOps: [{ retain: 1 }, { delete: 1 }] }
                ]
            },
            c: {
                snapshot: { ops: [{ insert: '15423' }], v: 2 },
                ops: [
                    { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a', originalOps: [{ retain: 1 }, { insert: '4' }] },
                    { ops: [{ retain: 1 }, { insert: '5' }], v: 1, hash: 'c', originalOps: [{ retain: 1 }, { insert: '5' }] }
                ]
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '1523' }], v: 2 },
            ops: [
                { ops: [{ retain: 1 }, { insert: '4' }], v: 0, hash: 'a', originalOps: [{ retain: 1 }, { insert: '4' }] },
                { ops: [{ retain: 1 }, { delete: 1 }], v: 1, hash: 'b', deletedItems: '4', originalOps: [{ retain: 1 }, { delete: 1 }] },
                { ops: [{ retain: 1 }, { insert: '5' }], v: 1, hash: 'c', originalOps: [{ retain: 1 }, { insert: '5' }] }
            ]
        };

        players.a = applyOp(players.a, op2).player;
        players.a = applyOp(players.a, op3).player;
        players.b = applyOp(players.b, op3).player;
        players.c = applyOp(players.c, op2).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });

    it('should handle the first operation with empty snapshot', () => {
        const op1 = { ops: [{ insert: '4' }], v: 0, hash: 'a' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '4' }], v: 1 },
                ops: [{ ops: [{ insert: '4' }], v: 0, hash: 'a', originalOps: [{ insert: '4' }] }]
            },
            b: {
                snapshot: { ops: [{ insert: '' }], v: 0 },
                ops: []
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '4' }], v: 1 },
            ops: [
                { ops: [{ insert: '4' }], v: 0, hash: 'a', originalOps: [{ insert: '4' }] },
            ]
        };

        players.b = applyOp(players.b, op1).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
    });

    it('should drop an already seen operation', () => {
        const op1 = { ops: [{ insert: '4' }], v: 0, hash: 'a' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '4' }], v: 1 },
                ops: [{ ops: [{ insert: '4' }], v: 0, hash: 'a', originalOps: [{ insert: '4' }] }]
            }
        };

        const result = applyOp(players.a, op1);

        expect(result.player).toEqual(players.a);
        expect(result.moves).toEqual([]);
    });

    it('should handle delete operation without retain', () => {
        const op1 = { ops: [{ delete: 1 }], v: 0, hash: 'b' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '123' }], v: 0 },
                ops: []
            }
        };

        const expected = {
            a: {
                snapshot: { ops: [{ insert: '23' }], v: 1 },
                ops: [
                    { ops: [{ delete: 1 }], v: 0, hash: 'b', deletedItems: '1', originalOps: [{ delete: 1 }] },
                ]
            },
        };

        players.a = applyOp(players.a, op1).player;
        expect(players).toEqual(expected);
    });

    it('should handle three players send at the same time (delete, insert, delete)', () => {
        const op1 = { ops: [{ retain: 1 }, { delete: 1 }], v: 0, hash: 'a' };
        const op2 = { ops: [{ retain: 1 }, { insert: '5' }], v: 0, hash: 'b' };
        const op3 = { ops: [{ retain: 1 }, { delete: 2 }], v: 0, hash: 'c' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '13' }], v: 1 },
                ops: [{
                    ops: [{ retain: 1 },
                    { delete: 1 }], v: 0, hash: 'a', deletedItems: '2', originalOps: [{ retain: 1 }, { delete: 1 }]
                }]
            },
            b: {
                snapshot: { ops: [{ insert: '1523' }], v: 1 },
                ops: [{ ops: [{ retain: 1 }, { insert: '5' }], v: 0, hash: 'b', originalOps: [{ retain: 1 }, { insert: '5' }] }]
            },
            c: {
                snapshot: { ops: [{ insert: '1' }], v: 1 },
                ops: [{
                    ops: [{ retain: 1 },
                    { delete: 2 }], v: 0, hash: 'c', deletedItems: '23', originalOps: [{ retain: 1 }, { delete: 2 }]
                }]
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '15' }], v: 1 },
            ops: [
                { ops: [{ retain: 1 }, { delete: 1 }], v: 0, hash: 'a', deletedItems: '2', originalOps: [{ retain: 1 }, { delete: 1 }] },
                { ops: [{ retain: 1 }, { insert: '5' }], v: 0, hash: 'b', originalOps: [{ retain: 1 }, { insert: '5' }] },
                { ops: [{ retain: 2 }, { delete: 2 }], v: 0, hash: 'c', deletedItems: '3', originalOps: [{ retain: 1 }, { delete: 2 }] }
            ]
        };

        players.a = applyOp(players.a, op2).player;
        players.a = applyOp(players.a, op3).player;
        players.b = applyOp(players.b, op3).player;
        players.b = applyOp(players.b, op1).player;
        players.c = applyOp(players.c, op2).player;
        players.c = applyOp(players.c, op1).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });

    it('should handle operations without retain (retain=0)', () => {
        const op1 = { ops: [{ delete: 1 }], v: 0, hash: 'a' };
        const op2 = { ops: [{ insert: '5' }], v: 0, hash: 'b' };
        const op3 = { ops: [{ delete: 2 }], v: 0, hash: 'c' };
        const players = {
            a: {
                snapshot: { ops: [{ insert: '23' }], v: 1 },
                ops: [{ ops: [{ delete: 1 }], v: 0, hash: 'a', deletedItems: '1', originalOps: [{ delete: 1 }] }]
            },
            b: {
                snapshot: { ops: [{ insert: '5123' }], v: 1 },
                ops: [{ ops: [{ insert: '5' }], v: 0, hash: 'b', originalOps: [{ insert: '5' }] }]
            },
            c: {
                snapshot: { ops: [{ insert: '3' }], v: 1 },
                ops: [{ ops: [{ delete: 2 }], v: 0, hash: 'c', deletedItems: '12', originalOps: [{ delete: 2 }] }]
            }
        };

        const expected = {
            snapshot: { ops: [{ insert: '5' }], v: 1 },
            ops: [
                { ops: [{ delete: 1 }], v: 0, hash: 'a', deletedItems: '1', originalOps: [{ delete: 1 }] },
                { ops: [{ insert: '5' }], v: 0, hash: 'b', originalOps: [{ insert: '5' }] },
                { ops: [{ retain: 1 }, { delete: 2 }], v: 0, hash: 'c', deletedItems: '23', originalOps: [{ delete: 2 }] }
            ]
        };

        players.a = applyOp(players.a, op2).player;
        players.a = applyOp(players.a, op3).player;
        players.b = applyOp(players.b, op3).player;
        players.b = applyOp(players.b, op1).player;
        players.c = applyOp(players.c, op2).player;
        players.c = applyOp(players.c, op1).player;

        expect(players.a).toEqual(expected);
        expect(players.b).toEqual(expected);
        expect(players.c).toEqual(expected);
    });
});
