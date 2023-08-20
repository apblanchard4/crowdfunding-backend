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

   let Verification = (designerID, projectID) => {
        return new Promise((resolve, reject) => {
            //make sure the constants is consistant with SQL
            //verify two of them
            pool.query("SELECT * FROM Designer WHERE idDesigner=?", [designerID], (error, result) => {
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

    let actual_event = event.body;
    console.log("E0")
    let info = JSON.parse(actual_event);
    console.log("info:" + JSON.stringify(info)); //  info.arg1 and info.arg2

    // get raw value or, if a string, then get from database if exists.
    let CheckNameExistence = (name) => {
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
    
    let InsertProject = (name, story, type, deadline, fundingGoal, designerID, designerName) => {
        let theGoal = parseFloat(fundingGoal);
        let designer = parseFloat(designerID);
        console.log(designer);
        //one promise to insert, 
        return new Promise((resolve, reject) => {
            //make sure the constants is consistant with SQL
            console.log(designer)
            pool.query("INSERT INTO Project (idDesigner,projectName, story,type,fixedDeadline,goalAmount, designerName) VALUES(?,?,?,?,?,?,?)", [designer,name, story, type, deadline, theGoal, designerName], (error, result) => {
               console.log(JSON.stringify(result)); //give fulls results info, possible use AffectedRows can get the auto ID, 
                if (error) { return reject(error); } //insert into the table
         
                if ((result) && (result.length == 1)) {
                    return resolve(true);   // TRUE if was able to add
                } else { 
                    return resolve(true);   // REJECT if couldn't add  WAIT TO CHECK
                }
            });
        });
    }
    
       let InsertProjectDesigner = (designerid, projectid) => {
        let project = parseFloat(projectid);
        let designer = parseFloat(designerid);

        //one promise to insert, 
        return new Promise((resolve, reject) => {
            //make sure the constants is consistant with SQL
            
            pool.query("INSERT INTO DesignerProjects (idDesigner, idProject) VALUES(?,?)", [designer, project], (error, result) => {
               console.log(JSON.stringify(result)); //give fulls results info, possible use AffectedRows can get the auto ID, 
                if (error) { return reject(error); } //insert into the table
         
                if ((result) && (result.length == 1)) {
                    return resolve(true);   // TRUE if was able to add
                } else { 
                    return resolve(true);   // REJECT if couldn't add  WAIT TO CHECK
                }
            });
        });
      }
    
    let getDesignerID = (email) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT idDesigner FROM Designer WHERE designerEmail=?",[email], (error, result) => {
                
                console.log("OU:" + JSON.stringify(result))
                if (error) { return reject(error); }
                 if ((result) && (result.length == 1)) {
                    
                    return resolve(result[0].idDesigner);
                    }
                   else {
                         return resolve(false);   // FALSE if doesn't exist
                    }
                    
            });
        });
    }
   
   let getProjectID = (name) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT idProject FROM Project WHERE projectName=?",[name], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                    return resolve(result[0].idProject);   // TRUE if does exist
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
        let designerid = await getDesignerID(info.designer);
        
        //var validAccess = false;
        //if(designerid!=false){
            //validAccess = await Verification(designerid, projectId);
        //}
       
        //console.log(validAccess);
        const nameExists = await CheckNameExistence(info.name);
        const exists = nameExists //&& !validAccess;
        console.log("E2")
        if (exists) {
            // already exist
            response.statusCode = 400;
            response.error = "This project already exists or invalid designer.";
        } else {
           
            console.log(designerid)
            
            console.log("E4")
            // INSERT
            const inserted = await InsertProject(info.name, info.story, info.type, info.deadline, info.fundingGoal, designerid, info.designerName);
           
            // const inserteddesigner = await InsertProjectDesigner();
            console.log("E6")
            
            if (inserted) {
               
                let projectid = await getProjectID(info.name);
                console.log(projectid);
                console.log(designerid);
                let insertDesigner = await InsertProjectDesigner(designerid, projectid);
                if (insertDesigner) {
                      response.statusCode = 200;
                console.log("Success, project created: " + info.name)
                }
               
        
            } else {
                 response.statusCode = 400;
                 response.error = "Couldn't create " + info.name;
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
