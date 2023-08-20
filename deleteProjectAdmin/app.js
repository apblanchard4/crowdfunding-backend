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
    
    let deleteProject = (name) => {
        return new Promise((resolve, reject) => {
            //make sure the constants is consistant with SQL
            pool.query("DELETE FROM Project WHERE projectName=?", [name], (error, rows) => {
                if (error) { return reject(error); }
                console.log("deleted");
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if was able to add
                } else { 
                    return resolve(true);   // REJECT if couldn't add  WAIT TO CHECK
                }
            });
        });
    }
    let deleteProjectDesigner = (projectID) => {
       
        let project = parseFloat(projectID);
        return new Promise((resolve, reject) => {
            //make sure the constants is consistant with SQL
            pool.query("DELETE FROM DesignerProjects WHERE idProject=?", [project], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if was able to add
                } else { 
                    return resolve(true);   // REJECT if couldn't add  WAIT TO CHECK
                }
            });
        });
    }
  
 let deleteProjectPledge = (projectID) => {
       
        let project = parseFloat(projectID);
        return new Promise((resolve, reject) => {
            //make sure the constants is consistant with SQL
            pool.query("DELETE FROM ProjectPledges WHERE idProject=?", [project], (error, rows) => {
                console.log(rows);
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if was able to add
                } else { 
                    return resolve(true);   // REJECT if couldn't add  WAIT TO CHECK
                }
            });
        });
    }  
  
      let getAdminID = (email) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Administrator WHERE adminEmail=?",[email], (error, result) => {
                console.log("OU:" + JSON.stringify(result))
                if (error) { return reject(error); }
                if (result && (result.length == 1)) {
                    return resolve(result[0].idAdmin);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }

      let CheckProjectExistence = (name) => {
        return new Promise((resolve, reject) => {
            console.log(name)
            pool.query("SELECT * FROM Project WHERE projectName=?", [name], (error, rows) => {
                if (error) { return reject(error); }
                console.log("rows " + rows)
                if (rows) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
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
        const projectID = await getProjectID(info.name);
        const adminID = await getAdminID(info.admin);
        const projectExists = await CheckProjectExistence(info.project);
        
        
        var validAccess = false;
        if (adminID != false && projectID != false) {
          
           validAccess = true;
        }
       console.log(validAccess)
        
        const exists = projectExists;
        console.log("exists" + exists)
        if (!exists || !validAccess) {
            // already exist
            response.statusCode = 400;
            response.error = "This project doesn't exist or access is not valid.";
        } else {
            const projectid = await getProjectID(info.name);
            console.log(projectid);
            // INSERT
           
            const deleted = await deleteProject(info.name);
            
            if (deleted) {
                const deletedPledge = await deleteProjectPledge(projectid);
                
                const deletedDesigner = await deleteProjectDesigner(projectid);
                console.log(deletedDesigner);
                
                if (deletedDesigner) {
                    response.statusCode = 200;
                    console.log("Success, deleted project:" + info.name);
                }
                else {
                    response.statusCode = 400;
                 response.error = "Couldn't delete " + info.name;
                }
                
            } else {
                 response.statusCode = 400;
                 response.error = "Couldn't delete " + info.name;
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
