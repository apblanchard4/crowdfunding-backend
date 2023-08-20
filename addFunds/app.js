//registerDesigner

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

    console.log("EB:" + event.body)
    let actual_event = event.body;
    let info = JSON.parse(actual_event);
    console.log("info:" + JSON.stringify(info)); //  info.arg1 and info.arg2

    // get raw value or, if a string, then get from database if exists.
    let CheckSupporterExistence = (name) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Supporters WHERE supporterEmail=?", [name], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    
    let updateBudget = (idSupporter, newBudget) => {
        return new Promise((resolve, reject) => {
            let supporter = parseFloat(idSupporter);
            let newbudget = parseFloat(newBudget);
            //make sure the constants is consistant with SQL
            pool.query("UPDATE Supporters SET budget =? WHERE idSupporter=? ", [newbudget, supporter], (error, result) => {
                console.log(result)
                if (error) { return reject(error); }
                if (result) {
                    return resolve(true);   // TRUE if was able to add
                } else { 
                    return resolve(false);   // REJECT if couldn't add  WAIT TO CHECK
                }
            });
        });
    }
    
    let getBudget = (supporter) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT budget FROM Supporters WHERE supporterEmail=?",[supporter], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                   
                    return resolve(result[0].budget);   // TRUE if does exist
                } else { 
                    return resolve([]);   // FALSE if doesn't exist
                }
            });
        });
    }
  
    
    let getSupporterID = (name) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT idSupporter FROM Supporters WHERE supporterEmail=?",[name], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                    //console.log("rows!!!!!!!!!!!!!: " ); 
                    //console.log(rows); 
                    return resolve(result[0].idSupporter);   // TRUE if does exist
                } else { 
                    return resolve([]);   // FALSE if doesn't exist
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
        const supporterExists = await CheckSupporterExistence(info.supporterEmail);
        const exists = supporterExists
        console.log("E2")
        if (!exists) {
            response.statusCode = 400;
            response.error = "This supporter doesn't exist";
            
        } else {
             let supporterid = await getSupporterID(info.supporterEmail);
            console.log("Supporter id" + supporterid);
             
            let supporterBudget = await getBudget(info.supporterEmail);
            let budget = parseFloat(supporterBudget);
            let fund = parseFloat(info.amount);
            
            console.log("budget" + budget);
            console.log("funds" + fund);
           
                    //update supporters budget
                    let newBudget = budget + fund; 
                    const updated = await updateBudget(supporterid, newBudget);
                    
                    if (updated) {
                         response.statusCode = 200;
                        console.log("Success, updated the budget from " + budget + " to " + newBudget);
                        response.result = newBudget;
                    }
            else {
                 response.statusCode = 400;
                 response.error = "The budget was not updated";
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
