//createProject

// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';

let response;
const mysql = require('mysql');

var config = require('./config.json');
var pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});

// https://www.freecodecamp.org/news/javascript-promise-tutorial-how-to-resolve-or-reject-promises-in-js/#:~:text=Here%20is%20an%20example%20of,message%20Something%20is%20not%20right!%20.
function query(conx, sql, params) {
    return new Promise((resolve, reject) => {
        conx.query(sql, params, function(err, rows) {
            if (err) {
                // reject because there was an error
                reject(err);
            } else {
                // resolve because we have result(s) from the query. it may be an empty rowset or contain multiple values
                resolve(rows);
            }
        });
    });
}


// Take in as input a payload.
//
// {  body: '{    "name" : "abc",   "value" : "8"}'
//
// }
//
// ===>  { "result" : "SUCCESS"}
//
exports.lambdaHandler = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

   // ready to go for CORS. To make this a completed HTTP response, you only need to add a statusCode and a body.
    let response = {
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*", // Allow from anywhere
            "Access-Control-Allow-Methods": "POST" // Allow POST request
        }
    }; // response


    let actual_event = event.body;
    console.log("E0")
    let info = JSON.parse(actual_event);
    console.log("info:" + JSON.stringify(info)); //  info.arg1 and info.arg2

    // get raw value or, if a string, then get from database if exists.
    let CheckPledgeExistence = (title) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Pledges WHERE idPledge=?", [title], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    let deletePledge = (title) => {
        console.log(title);
        return new Promise((resolve, reject) => {
            //make sure the constants is consistant with SQL
            pool.query("DELETE FROM Pledges WHERE idPledge=?", [title], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if was able to add
                } else { 
                    return resolve(true);   // REJECT if couldn't add  WAIT TO CHECK
                }
            });
        });
    }
    let deletePledgeProject = (pledgeid) => {
        let pledge = parseFloat(pledgeid);
        return new Promise((resolve, reject) => {
            //make sure the constants is consistant with SQL
            pool.query("DELETE FROM ProjectPledges WHERE idPledge=?", [pledge], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if was able to add
                } else { 
                    return resolve(true);   // REJECT if couldn't add  WAIT TO CHECK
                }
            });
        });
    }
    let getPledgeID = (title) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT idPledge FROM Pledges WHERE pledgeTitle=?",[title], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                   
                    return resolve(result[0].idPledge);   // TRUE if does exist
                } else { 
                    return resolve([]);   // FALSE if doesn't exist
                }
            });
        });
    }
 

     let getSupporterBudget = (supporterid) => {
        return new Promise((resolve, reject) => {
            let supporter = parseFloat(supporterid);
            pool.query("SELECT budget FROM Supporters WHERE idSupporter=?",[supporter], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                   console.log("SUPPORTER BUDGET " + result[0].budget)
                    return resolve(result[0].budget);   // TRUE if does exist
                } else { 
                    return resolve(0);   // FALSE if doesn't exist
                }
            });
        });
    }

    
    try {
        
        // 1. Query RDS for the first constant value to see if it exists!
        //   1.1. If doesn't exist then ADD
        //   1.2  If it DOES exist, then I need to replace
        // ----> These have to be done asynchronously in series, and you wait for earlier 
        // ----> request to complete before beginning the next one
        console.log("E1")
        const nameExists = await CheckPledgeExistence(info.pledgeID);
        const exists = nameExists
        console.log("E2")
        if (!exists) {
            // already exist
            response.statusCode = 400;
            response.error = "This pledge doesn't exist.";
        } 
            else {
               
            //let pledgeid = await getPledgeID(info.pledgeID)
            //console.log(pledgeid)
            const deleted = await deletePledge(info.pledgeID);
            if (deleted) {
                const deletedSecond = await deletePledgeProject(info.pledgeID);
               if (deletedSecond) {
                  
                   
                    response.statusCode = 200;
                console.log("Success, pledge " + info.pledgeID + " has been deleted")
               }
               else {
                   response.statusCode = 400;
                 response.error = "Couldn't delete " + info.pledgeID;
               }
               
            } else {
                 response.statusCode = 400;
                 response.error = "Couldn't delete " + info.pledgeID;
            }
        }
        
        
    } catch (error) {
        console.log("ERROR: " + error);
        response.statusCode = 400;
        response.error = error;
    }
    
    // full response is the final thing to send back
    return response;
}
