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


    let actual_event = event.body;
    let info = JSON.parse(actual_event);
    console.log("info:" + JSON.stringify(info)); //  info.arg1 and info.arg2

let CheckProjectExistence = (name) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Project WHERE projectName=?", [name], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    let CheckPledgeExistence = (pledge) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Pledges WHERE pledgeTitle=?", [pledge], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }
 
  let getProjectID = (name) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Project WHERE projectName=?",[name], (error, result) => {
                if (error) { return reject(error); }
                if (result && (result.length == 1)) {
                    //console.log("rows!!!!!!!!!!!!!: " ); 
                    //console.log(rows); 
                    return resolve(result[0].idProject);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }

    //one promise to insert, 
   let Verification = (designerID, projectID) => {
        return new Promise((resolve, reject) => {
            //make sure the constants is consistant with SQL
            //verify two of them
            pool.query("SELECT * FROM DesignerProjects WHERE idDesigner=? AND idProject=?", [designerID, projectID], (error, result) => {
               console.log(JSON.stringify(result)); //give fulls results info, possible use AffectedRows can get the auto ID, 
                if (error) { return reject(error); } //insert into the table
                if ((result) && (result.length == 1)) {
                    return resolve(true);   // TRUE if was able to add
                } else { 
                    return resolve(false);   // REJECT if couldn't add  WAIT TO CHECK
                }
            });
        });
      }
    
    let getDesignerID = (email) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Designer WHERE designerEmail=?",[email], (error, result) => {
                console.log("OU:" + JSON.stringify(result))
                if (error) { return reject(error); }
                if (result && (result.length == 1)) {
                    return resolve(result[0].idDesigner);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    let getPledge = (name) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Pledges WHERE pledgeTitle=?",[name], (error, rows) => {
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
        const designerId = await getDesignerID(info.designer);
        const projectId = await getProjectID(info.project);
        const projectExists = await CheckProjectExistence(info.project);
        const pledgeExists = await CheckPledgeExistence(info.pledge);
        var validAccess = false;
        if(projectId!=false && designerId!=false){
            validAccess = await Verification(designerId, projectId);
        }else{
            validAccess = false;
        }
        
        const exists = pledgeExists && projectExists && validAccess;
        
        console.log("E2")
        if (!exists) {
            // already exist
            response.statusCode = 400;
            response.error = "This project or pledge doesn't exist";
       
        } else { //project / pledge does exist, check if active
                
                let pledgeInfo = await getPledge(info.pledge);
                response.result = pledgeInfo;
                response.statusCode = 200;
                console.log("Success, retrieved info from: " + info.pledge);

          
        }
        
    } catch (error) {
        console.log("ERROR: " + error);
        response.statusCode = 400;
        response.error = error;
    }
    
    // full response is the final thing to send back
    return response;
}
