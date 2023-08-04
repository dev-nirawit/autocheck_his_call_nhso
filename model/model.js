module.exports = {
    get_serialnumber(db,serial_name) {
        return db.raw(`SELECT get_serialnumber('${serial_name}') AS serialnumber`);
    },
    getVisitCIDNoAuthen(db, limit_start = '', limit_end = '') {
        let limit = '';
        if (limit_start !== '' && limit_end !== '') {
            limit = `LIMIT ${limit_start},${limit_end}`;
        }
        const sql = `SELECT p.cid,v.auth_code,o.vn,o.hn FROM ovst AS o
LEFT JOIN visit_pttype AS v ON v.vn = o.vn
LEFT JOIN patient AS p ON p.hn = o.hn
LEFT JOIN pttype AS pt ON pt.pttype = o.pttype 
WHERE o.vstdate = DATE(NOW()) 
AND pt.pcode not in('A1','A2','A7') ${limit}`;
        return db.raw(sql);
    },
    updateVN_VisitPttypeAuthen(db, data, vn) {
        return db('visit_pttype')
            .update(data)
            .where('vn', vn)
    },
    getPtNoteToday(db,hn) {
        return db('ptnote')
            .where('hn', hn)
            .where('noteflag', '[CALL_API]')
            .whereRaw('expire_date = DATE(NOW())')
    },
    createPtNote(db, data) {
        return db('ptnote')
            .insert(data)
    },
    deletePtNote(db, ptnote_id) {
        return db('ptnote')
            .where('ptnote_id', ptnote_id)
            // .where('noteflag', '[CALL_API]')
            // .whereRaw('expire_date = DATE(NOW())')
            .del()
        
    }
};