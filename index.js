"use strict";

require("dotenv").config();
const axios = require("axios");
const moment = require("moment");
const fs = require("fs");

// @ts-ignore
axios.defaults.baseURL = process.env.URL_API;
const model = require("./model/model");

var dbHIS = require("knex")({
    client: "mysql",
    // debug: true,
    connection: {
        host: process.env.DB_HIS_HOST,
        user: process.env.DB_HIS_USER,
        port: +process.env.DB_HIS_PORT,
        password: process.env.DB_HIS_PASSWORD,
        database: process.env.DB_HIS_NAME,
        insecureAuth: true
    },
    pool: {
        min: 0,
        max: 100,
        afterCreate: (conn, done) => {
            conn.query("SET NAMES utf8", err => {
                done(err, conn);
            });
        }
    }
});

function log(text, log = true) {
    var _text = `${moment().format("DD-MM-YYYY HH:mm:ss")} - ${text}`;
    // fs.appendFileSync('./log.log', `${_text}\n`);
    if (log) {
        fs.appendFileSync("./log.log", `${_text}\n`);
    }
    console.log(_text);
}

function log_sum(text) {
    var _text = `${moment().format("DD-MM-YYYY HH:mm:ss")} - ${text}`;
    // fs.appendFileSync('./log.log', `${_text}\n`);

    fs.appendFileSync("./log_sum.log", `${_text}\n`);
    
    console.log(_text);
}


const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function callNHSOServiceLatestAuthenCode(cid,vn,hn) {
    try {
        // @ts-ignore
        await delay(process.env.URL_API_CALL_DELAY_MS || 1000);
        // @ts-ignore
        let response = await axios.get(`/api/nhso-service/latest-authen-code/${cid}`);
        // console.log(response.data);
        if (response.data.claimCode) {
            // UPDATE HIS
            if (process.env.HIS_HCODE == response.data.hcode) {
                await model.updateVN_VisitPttypeAuthen(dbHIS, { auth_code: response.data.claimCode }, vn)
                log("[OK AUTHEN TODAY] CID:" + cid+ ' [claimCode]'+ response.data.claimCode, true);
                await removeNoteHIS(hn);
                return true;
            } else {
                // console.log('not today');
                log("[NO AUTHEN TODAY] CID:" + cid, true);
                await createNoteHIS(hn);
                return false;
            }
        } else {
            log("[NO AUTHEN DATA] CID:" + cid, true);
            await createNoteHIS(hn);
             return false;
        }
        
    } catch (error) {
        log("[ERROR]" + error);
    }
}

async function getList_bk() {
    log("[START] getList...", false);
    const rs = await model.getVisitCIDNoAuthen(dbHIS);
    console.log('all: ' + rs[0].length);
    const cal_rs = Math.ceil(rs[0].length / process.env.MULTI_TASK_CALL_PER_LOOP || 10);
console.log('cal_rs: ' + cal_rs);    
    const _loop = process.env.MULTI_TASK_CALL_PER_LOOP;
// console.log('_loop: ' + _loop);
const items = rs[0];
var item_arr = [];
    for (let i = 0; i < items.length; i++) {
        // console.log('i:'+i)
    for (let index = i; index < cal_rs; index++) {
   
        // console.log(`Chunk ${i}:`, item_arr[i]);
        item_arr.push(items[i]);
        // if (index == _loop) { index = 0; }
    }
}
    console.log('item_arr', item_arr);
    // console.log('item_arr', item_arr);


// for (let i = 0; i < item_arr.length; i++) {
//     // @ts-ignore
//     //  console.log('item_arr:'+item_arr.length);
//     await Promise.all(item_arr[i].map(async (item,k_item) => {
//     //   console.log('i:'+i +' k_item:'+k_item);
        
//     //   callNHSOServiceLatestAuthenCode(item);
//     }));
//   }

    // await Promise.all(item_arr.map(async (chunk, chunkIndex) => {

    //     console.log('chunkIndex: '+chunkIndex);
    //     console.log(chunk);
    //     // return await Promise.all(chunk.map(async (v, k) => {
    //     //     await delay(process.env.URL_API_CALL_DELAY_MS || 1000);
    //     //     // console.log('chunk', v);
    //     // log(`Chunk ${chunkIndex}, item๘รืกำป ${k} => [CID] : ${v.cid} | [VN] : ${v.vn}`, false);
    //     // if (v.auth_code) {
    //     //     await removeNoteHIS(v.hn);
    //     // } else {
    //     //     await callNHSOServiceLatestAuthenCode(v.cid, v.vn,v.hn);
    //     // }
    //     // }));
    // }));    

    // log("[getList] Patient COUNT: " + rs[0].length);
    // var i = 0;
    // for await (const v of rs[0]) {
    //     i = i + 1;
    //     log(`index loop : ${i}  [CID] : ${v.cid} | [VN] : ${v.vn}`, false);
    //     if (v.auth_code) {
    //         await removeNoteHIS(v.hn);
    //     } else {
    //          await callNHSOServiceLatestAuthenCode(v.cid, v.vn,v.hn);
    //     }
    // }
    log("[END] getList...", false);
    // await getList()
}


// async function getList() {

// // กำหนดจำนวนแถวของแต่ละ array
// const chunkSize = +process.env.MULTI_TASK_CALL_PER_LOOP||10;

// // สร้าง array ของ array obj ที่แบ่งเป็นชุด
// const chunkedItems = [];
// for (let i = 0; i < items.length; i += chunkSize) {
//     chunkedItems.push(items.slice(i, i + chunkSize));
// }

    // console.log(chunkedItems.length);
    
// // ทำงานแบบ multi task พร้อมกัน
//  await chunkedItems.forEach(async (chunk) => {
//     // เรียกใช้งาน axios ตามจำนวนแถวในแต่ละ chunk
//      await chunk.forEach(async (v) => {
//         // await callNHSOServiceLatestAuthenCode(v.cid, v.vn, v.hn);
//         if (v.auth_code) {
//             await removeNoteHIS(v.hn);
//         } else {
//             await delay(process.env.URL_API_CALL_DELAY_MS || 1000);
//             await callNHSOServiceLatestAuthenCode(v.cid, v.vn,v.hn);
//         }
//     });
// });
// }

let _fn_loop = 0;
async function getList() {
    log("[START] getList...", false);

    const rs = await model.getVisitCIDNoAuthen(dbHIS);
    const all_data = rs[0].length;
    let num_auth = 0;
    let num_auth_nhso = 0;
    let num_noauth_nhso = 0;
    var i = 0;
    for await (const v of rs[0]) {
        i = i + 1;
        log(`index loop : ${i}  [CID] : ${v.cid} | [VN] : ${v.vn}`, false);
        if (v.auth_code) {
            await removeNoteHIS(v.hn);
            num_auth = num_auth+1;
        } else {
            if (v.cid.startsWith("007") || v.cid.startsWith("77298") || v.cid.startsWith("60161")) { 
                log(`index loop : ${i}  [CID] : ${v.cid} | [VN] : ${v.vn} | ไม่ต้องตรวจสอบ สปสช`, true);
                await removeNoteHIS(v.hn);
                 num_noauth_nhso = num_noauth_nhso + 1;
            } else {
                await delay(250);
                let c_auth = callNHSOServiceLatestAuthenCode(v.cid, v.vn, v.hn);
                if (c_auth) {
                    num_auth = num_auth + 1;
                    num_auth_nhso = num_auth_nhso + 1;
                }
            }
        }
    }
    _fn_loop++;

    log_sum(`[Loop] : ${_fn_loop} | [SUM_Visit] : ${all_data}  |NO_Auth_code : ${num_noauth_nhso} | NHSO_Round : ${num_auth_nhso} | [SUM_AUTHEN] : ${num_auth}`);
    log("[END] getList...", false);
    num_auth = 0;
    num_auth_nhso = 0;
    num_noauth_nhso = 0;
    await getList();
}


async function createNoteHIS(hn) {
    try {
        const getPtNote = await model.getPtNoteToday(dbHIS, hn);
        //  console.log('getPtNote',getPtNote);
        if (!getPtNote.length) {
        //  console.log('getPtNote!',getPtNote);
        const ptnote = String.raw`{\rtf1\ansi\deff0\uc1\ansicpg874\deftab720{\fonttbl{\f0\fnil\fcharset1 Angsana New;}{\f1\fnil\fcharset2 Wingdings;}{\f2\fnil\fcharset2 Symbol;}}{\colortbl\red0\green0\blue0;\red255\green0\blue0;\red0\green128\blue0;\red0\green0\blue255;\red255\green255\blue0;\red255\green0\blue255;\red128\green0\blue128;\red128\green0\blue0;\red0\green255\blue0;\red0\green255\blue255;\red0\green128\blue128;\red0\green0\blue128;\red255\green255\blue255;\red192\green192\blue192;\red128\green128\blue128;\red0\green0\blue0;}\wpprheadfoot1\paperw11906\paperh16838\margl527\margr493\margt624\margb493\headery720\footery720\ftnbj\sftnbj\sftnrstcont\nocolbal\sftnnar\saftnnar\fet0\endnhere\sectdefaultcl{\*\generator WPTools_8.008-PRM;}{\plain\fs100\cf1\b == \u3618 ?\u3633 ?\u3591 ?\u3652 ?\u3617 ?\u3656 ?\u3652 ?\u3604 ?\u3657 ? Authen ==\par
\plain\fs32\cf1\cb0 *\cf0\cb0  \u3650 ?\u3611 ?\u3619 ?\u3604 ?\u3649 ?\u3592 ?\u3657 ?\u3591 ?\u3612 ?\u3641 ?\u3657 ?\u3619 ?\u3633 ?\u3610 ?\u3610 ?\u3619 ?\u3636 ?\u3585 ?\u3634 ?\u3619 ?\u3651 ?\u3627 ?\u3657 ?\u3652 ?\u3611 ?\u3592 ?\u3640 ?\u3604 ? \u3618 ?\u3639 ?\u3609 ?\u3618 ?\u3633 ?\u3609 ?\u3605 ?\u3609 ? Authen \u3626 ?\u3611 ?\u3626 ?\u3594 ?\fs34\cf0\cb0 .\par
}}`;    
            const ptnote_id = await model.get_serialnumber(dbHIS, 'ptnote_id');
            // console.log('ptnote_id[0].serial_number',ptnote_id[0][0].serialnumber);
            if (ptnote_id[0].length) {
                const dataCreate = {
                    'ptnote_id': ptnote_id[0][0].serialnumber,
                    'noteflag': '[CALL_API]',
                    'hn': hn,
                    'plain_text': `== ยังไม่ได้ Authen ==
        * โปรดแจ้งผู้รับบริการให้ไปจุด ยืนยันตน Authen สปสช.`,
                    'ptnote': ptnote,
                    'note_staff': '',
                    'has_expired': 'Y',
                    'expire_date': moment().format("YYYY-MM-DD"),
                    'public_note': 'N',
                    'show_all_dep': 'Y',
                    'note_datetime': moment().format("YYYY-MM-DD HH:mm:ss"),
                    'note_staff':'AutoAdd'
                };
                console.log('createNoteHIS');
                await model.createPtNote(dbHIS,dataCreate);
            }
        } 
    } catch (error) {
        console.error(error);
    }

}

async function removeNoteHIS(hn) {
    const getPtNote = await model.getPtNoteToday(dbHIS, hn);
    if (getPtNote[0]) {
        if (getPtNote[0].ptnote_id) {
            await model.deletePtNote(dbHIS, getPtNote[0].ptnote_id);
             log("[Delete] ptnote_id : "+getPtNote[0].ptnote_id, true);
        }
    } 
}


async function runJob() {
    // await checkToken();

    log("[runJob]", false);
    setTimeout(() => {
        getList();
    }, 100);
}
runJob();
