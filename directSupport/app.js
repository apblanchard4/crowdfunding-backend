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

    
    let getSupporterID = (supporterEmail) => {
        return new Promise((resolve, reject) => {
            console.log(supporterEmail);
            pool.query("SELECT idSupporter FROM Supporters WHERE supporterEmail=?",[supporterEmail], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                     console.log("SUPPORTER ID" + result[0].idSupporter)
                    return resolve(result[0].idSupporter);   // TRUE if does exist
               
                } else { 
                     console.log("didnt work")
                    return resolve([]);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    
    
    
    // get raw value or, if a string, then get from database if exists.
    
    
    let CheckProjectExistence = (projectID) => {
        let project = parseFloat(projectID)
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Project WHERE idProject=?", [project], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    let addTable = (idSupporter, idProject, amount) => {
        return new Promise((resolve, reject) => {
            let supporter = parseFloat(idSupporter);
            let project = parseFloat(idProject);
             let funds = parseFloat(amount);
            //make sure the constants is consistant with SQL
            pool.query("INSERT INTO DirectFunding (idSupporter,idProject, amount) VALUES(?,?,?)", [supporter, project, funds], (error, rows) => {
                if (error) { return reject(error); }
                if (rows) {
                    return resolve(true);   // TRUE if was able to add
                } else { 
                    return resolve(false);   // REJECT if couldn't add  WAIT TO CHECK
                }
            });
        });
    }
    let updateAmount = (idProject, amount) => {
        return new Promise((resolve, reject) => {
            let project = parseFloat(idProject);
            let updateAmount = parseFloat(amount);
            //make sure the constants is consistant with SQL
            pool.query("UPDATE Project SET currentAmount =? WHERE idProject=? ", [updateAmount, project], (error, result) => {
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
     let getAmount = (idProject) => {
        return new Promise((resolve, reject) => {
            let project = parseInt(idProject)
           pool.query("SELECT currentAmount FROM Project WHERE idProject=?", [project], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.length == 1)) {
                    return resolve(rows[0].currentAmount);   // TRUE if does exist
                } else { 
                    return resolve([]);   // FALSE if doesn't exist
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
    let updateSupporters = (idPledge, supporterNumber) => {
        return new Promise((resolve, reject) => {
            let pledge = parseFloat(idPledge);
            let number = parseFloat(supporterNumber);
            number += 1;
            console.log(number);
            //make sure the constants is consistant with SQL
            pool.query("UPDATE Pledges SET currentSupporters=? WHERE idPledge=? ", [number, pledge], (error, rows) => {
                console.log(rows)
                if (error) { return reject(error); }
                if (rows) {
                    return resolve(true);   // TRUE if was able to add
                } else { 
                    return resolve(false);   // REJECT if couldn't add  WAIT TO CHECK
                }
            });
        });
    }
    let getMaxNum = (pledgeID) => {
        let pledge = parseFloat(pledgeID)
        return new Promise((resolve, reject) => {
            pool.query("SELECT maxSupporters FROM Pledges WHERE idPledge=?",[pledge], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                   
                    return resolve(result[0].maxSupporters);   // TRUE if does exist
                } else { 
                    return resolve([]);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    let getSupporterNum = (pledgeID) => {
        let pledge = parseFloat(pledgeID)
        return new Promise((resolve, reject) => {
            pool.query("SELECT currentSupporters FROM Pledges WHERE idPledge=?",[pledge], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                   
                    return resolve(result[0].currentSupporters);   // TRUE if does exist
                } else { 
                    return resolve([]);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    let getBudget = (supporterID) => {
        let supporter = parseFloat(supporterID)
        return new Promise((resolve, reject) => {
            pool.query("SELECT budget FROM Supporters WHERE idSupporter=?",[supporter], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                   
                    return resolve(result[0].budget);   // TRUE if does exist
                } else { 
                    return resolve([]);   // FALSE if doesn't exist
                }
            });
        });
    }
    let getPledgeCost = (pledgeID) => {
        let pledge = parseFloat(pledgeID)
        return new Promise((resolve, reject) => {
            pool.query("SELECT amount FROM Pledges WHERE idPledge=?",[pledge], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                   
                    return resolve(result[0].amount);   // TRUE if does exist
                } else { 
                    return resolve([]);   // FALSE if doesn't exist
                }
            });
        });
    }
    
       let getProjectID = (pledgeID) => {
        let pledge = parseFloat(pledgeID)
        return new Promise((resolve, reject) => {
            pool.query("SELECT idProject FROM ProjectPledges WHERE idPledge=?",[pledge], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                    
                    return resolve(result[0].idProject);   // TRUE if does exist
                } else { 
                    return resolve([]);   // FALSE if doesn't exist
                }
            });
        });
    }
 let getGoalAmount = (projectID) => {
        let project = parseFloat(projectID)
        return new Promise((resolve, reject) => {
            pool.query("SELECT goalAmount FROM Project WHERE idProject=?",[project], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                    
                    return resolve(result[0].goalAmount);   // TRUE if does exist
                } else { 
                    return resolve([]);   // FALSE if doesn't exist
                }
            });
        });
    }
    
     let updateMetGoal = (projectid) => {
        return new Promise((resolve, reject) => {
            let project = parseFloat(projectid);
            console.log(project);
            //make sure the constants is consistant with SQL
            pool.query("UPDATE Project SET metGoal=? WHERE idProject=? ", [1, project], (error, rows) => {
                console.log(rows)
                if (error) { return reject(error); }
                if (rows) {
                    return resolve(true);   // TRUE if was able to add
                } else { 
                    return resolve(false);   // REJECT if couldn't add  WAIT TO CHECK
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
        let supporterID = await getSupporterID(info.supporterEmail);
        console.log("supporterID" + supporterID);
        if (supporterID.length!==0) {
            const projectExists = await CheckProjectExistence(info.projectID);
            const exists = projectExists
            console.log("Exists: " + exists)
                if (!exists) {
                response.statusCode = 400;
                 response.error = "This project doesn't exist";
                } else {
                console.log("Project ID" + info.projectID);
                console.log("Supporter ID" + supporterID);
             
                let supporterBudget = await getBudget(supporterID);
             
                let directAmount = parseFloat(info.amount);
                let budget = parseFloat(supporterBudget);
            
                console.log("direct support" + directAmount);
                console.log("budget" + budget);
            
                if (budget >= directAmount) { //can be afforded
                 // INSERT
                    const inserted = await addTable(supporterID, info.projectID, directAmount);
                    console.log("Inserted " + inserted)
                    if (inserted) {
                    //update supporters budget
                        let newBudget = budget - directAmount; 
                        const updated = await updateBudget(supporterID, newBudget);
                        console.log("Updated " + updated)
                        if (updated) {
                            let projectAmount = parseFloat(await getAmount(info.projectID));
                            console.log("Project Amount" + projectAmount);
                            let newAmount = projectAmount + directAmount;
                            let updatedAmount = await updateAmount(info.projectID, newAmount);
                            console.log("Updated amount " + updatedAmount)
                            if (updatedAmount) {
                                
                                 let goal= parseFloat(await getGoalAmount(info.projectID));
                                if (newAmount >= goal) {
                                    
                                    let updatedGoal= await updateMetGoal(info.projectID);
                                    if (updatedGoal) {
                                        response.statusCode = 200;
                                        console.log("Success, direct support completed and the goal has been reached");
                                    }
                                    else {
                                        response.statusCode = 400;
                                        response.error = "Couldn't update met goal";
                                    }
                                }
                                else {
                                    response.statusCode = 200;
                                    console.log("Success, direct support completed ");
                                    response.result = newBudget;
                                }
                                
                                
                        
                            }
                            else {
                                response.statusCode = 400;
                                response.error = "Couldn't find pledge ";
                            }
                         
                       
                        }
                      else {
                         response.statusCode = 400;
                    response.error = "Couldn't find pledge ";
                    }  
                        
                    
                    }
                    else {
                         response.statusCode = 400;
                    response.error = "Couldn't update supporter num ";
                    }
                   
                    
                   
                    
                  
                   
            } else {
                    response.statusCode = 400;
                    response.error = "The support cannot afford the amount ";
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
