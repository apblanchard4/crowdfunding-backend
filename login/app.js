//login

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
// {  body: '{    "email"
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

    console.log(event)
    let actual_event = event.body;
    let info = JSON.parse(actual_event);
    console.log("info:" + JSON.stringify(info)); 
    let email = info.emailAddress; //get the email from the JSON payload

    
    let CheckEmailExistenceDesigner = (email) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Designer WHERE designerEmail=?", [email], (error, rows) => {
                if (error) { return reject(error); }
                console.log(email);
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    };
    
     let CheckEmailExistenceSupporter = (email) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Supporters WHERE supporterEmail=?", [email], (error, rows) => {
                console.log("Supporter check: " + rows)
                console.log("Supporter check: " + error)
                if (error) { return reject(error); }
                
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
     };
    
     let CheckEmailExistenceAdministrator = (email) => {
        return new Promise((resolve, reject) => {
            
            pool.query("SELECT * FROM Administrator WHERE adminEmail=?", [email], (error, rows) => {
                console.log(rows)
                if (error) { return reject(error); }
                
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    };
    
    let getSupporterBudget = (email) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Supporters WHERE supporterEmail=?",[email], (error, result) => {
                console.log("OU:" + JSON.stringify(result))
                if (error) { return reject(error); }
                if (result && (result.length == 1)) {
                    return resolve(result[0].budget);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    
    
    try {
        
        // 1. Query RDS for the email value to see if it exists!
        //   1.1. If doesn't exist then return 400
        //   1.2  If it DOES exist, then 200, return 
        // ----> These have to be done asynchronously in series, and you wait for earlier 
        // ----> request to complete before beginning the next one
        console.log("E1")
        const designerExists = await CheckEmailExistenceDesigner(info.emailAddress);
        
        console.log("E2")
        if (designerExists) {
            // exists as a designer
            response.statusCode = 200;
            response.success = "You have logged in as a designer";
            response.result = {"account":"Designer"};
            
            //add the response
            
            
           
        } else { //doesn't exist as a designer, check to see if the email is under supporter
             const supporterExists = await CheckEmailExistenceSupporter(info.emailAddress);
             if (supporterExists) {
            //take budget from database     
            let currentBudget = await getSupporterBudget(info.emailAddress);
            // exists as a supporter
            response.statusCode = 200;
            response.success = "You have logged in as a supporter";
            response.result = {"budget": currentBudget,"account":"Supporter"};
            //add the response
            
             }
            else { //either admin or doesn't exist
            console.log("checking admin")
                const adminExists = await CheckEmailExistenceAdministrator(info.emailAddress);
                if (adminExists) {
                 // exists as an admin
                 response.statusCode = 200;
                 response.success = "You have logged in as an Admin";
                 response.result = {"account":"Admin"};
                 
                  //add the response
                  
             }
                else { //doesn't exist
                response.statusCode = 400;
                response.error = "Email is not registered"
                    
                }
                
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
