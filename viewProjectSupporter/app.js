//viewProject

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
            "Access-Control-Allow-Methods": "POST" // Allow GET request
        }
    }; // response
    
    let actual_event = event.body;
    let info = JSON.parse(actual_event);
    console.log("info:" + JSON.stringify(info)); //  info.arg1 and info.arg2

    
    let CheckProjectValid = (projectid) => {
        let project = parseFloat(projectid);
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Project WHERE idProject=? and isActive =? and isVisible = ?", [projectid,true,true], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    // get raw value or, if a string, then get from database if exists.
     let getProject = (projectid) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Project WHERE idProject=? and isActive =? and isVisible = ?",[projectid,true,true], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    //console.log("rows!!!!!!!!!!!!!: " ); 
                    console.log(rows); 
                    return resolve(rows[0]);   // TRUE if does exist
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
        const valid = await CheckProjectValid(info.projectID);
        //exists = valid;
            if (valid) {
                console.log("E2")
                let projectInfo = await getProject(info.projectID);
                console.log("E3")
                response.result = projectInfo; 
                response.statusCode = 200;
                
            } else {
                 response.statusCode = 400;
                 response.error = "Couldn't find any projects named " + info.projectID;
            }
        
        
    } catch (error) {
        console.log("ERROR: " + error);
        response.statusCode = 400;
        response.error = error;
    }
    
    // full response is the final thing to send back
    return response;
}
