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
    
    let projectScucceed = (projectID) => {
        let project = parseFloat(projectID)
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Project WHERE idProject=? AND metGoal=?",[project, 1], (error, result) => {
                console.log("Project succeed: " + JSON.stringify(result))
                if (error) { return reject(error); }
                if (result && (result.length == 1)) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    let deleteProject = (name) => {
        return new Promise((resolve, reject) => {
            //make sure the constants is consistant with SQL
            pool.query("DELETE FROM Project WHERE idProject=?", [name], (error, rows) => {
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
  
      let verifyAdminID = (email) => {
        return new Promise((resolve, reject) => {
            pool.query("SELECT * FROM Administrator WHERE adminEmail=?",[email], (error, result) => {
                console.log("OU:" + JSON.stringify(result))
                if (error) { return reject(error); }
                if (result && (result.length == 1)) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }

      let CheckProjectsDeadline = () => {
        return new Promise((resolve, reject) => {
            
            pool.query("SELECT * from Project where fixedDeadline < SYSDATE()", (error, rows) => {
                if (error) { return reject(error); }
                // console.log("rows!!!!" + JSON.stringify(rows))
                if (rows && rows.length>=1) {
                    return resolve(rows);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }
    let updateBudget = (supporterid, amount) => {
        return new Promise((resolve, reject) => {
            let supporter = parseFloat(supporterid);
            let newBudget = parseFloat(amount);
           pool.query("UPDATE Supporters SET budget=? WHERE idSupporter=? ", [newBudget, supporter], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                    return resolve(true);   // TRUE if does exist
                } else { 
                    return resolve(false);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    let getPledgeCost = (pledgeid) => {
        return new Promise((resolve, reject) => {
            let pledge = parseFloat(pledgeid);
            pool.query("SELECT * FROM Pledges WHERE idPledge=?",[pledge], (error, result) => {
                if (error) { return reject(error); }
                if (result) {
                   console.log("COST " + result.amount)
                    return resolve(result[0].amount);   // TRUE if does exist
                } else { 
                    return resolve(0);   // FALSE if doesn't exist
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
  
    let checkPledgeClaimed = (pledgeid) => {
        return new Promise((resolve, reject) => {
            let pledge = parseFloat(pledgeid);
            pool.query("SELECT * FROM PledgeSupporters WHERE idPledge=?",[pledge], (error, result) => {
                if (error) { return reject(error); }
                if (result && (result.length >= 1)) {
                    console.log("RESULTS " + result)
                    console.log("Supporter claimed " + result[0].idSupporter)
                    return resolve(result[0].idSupporter);   // TRUE if does exist
                } else { 
                    return resolve([]);   // FALSE if doesn't exist
                }
            });
        });
    }
    
    
    let getSupportersDirectFund = (projectid) => {
        console.log("PRoject ID: " + projectid)
        return new Promise((resolve, reject) => {
            let project = parseFloat(projectid);
            pool.query("SELECT * FROM DirectFunding WHERE idProject=?",[project], (error, result) => {
                if (error) { return reject(error); }
                if (result && (result.length >= 1)) {
                    console.log("RESULTS " + result)
                   console.log("Supporters with direct funding " + result)
                    return resolve(result);   // TRUE if does exist
                } else { 
                    return resolve([]);   // FALSE if doesn't exist
                }
            });
        });
    }
    let getSupportersBudget= (supporterID) => {
        return new Promise((resolve, reject) => {
            let supporter = parseFloat(supporterID);
            pool.query("SELECT * FROM Supporters WHERE idSupporter=?",[supporter], (error, result) => {
                if (error) { return reject(error); }
                if (result && (result.length >= 1)) {
                    console.log("RESULTS " + result)
                   console.log("Supporters budget" + result[0].budget)
                    return resolve(result[0].budget);   // TRUE if does exist
                } else { 
                    return resolve([]);   // FALSE if doesn't exist
                }
            });
        });
    }
      let getPledges = (projectid) => {
        return new Promise((resolve, reject) => {
            let project = parseFloat(projectid);
            pool.query("SELECT * FROM Pledges WHERE idProject=?",[project], (error, rows) => {
                if (error) { return reject(error); }
                if (rows) {
                    return resolve(rows);   // TRUE if does exist
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
        //const projectID = await getProjectID(info.name);
        const validAccess = await verifyAdminID(info.admin);
        //const projectExists = await CheckProjectExistence(info.project);
        console.log(validAccess)
        
        const projects = await CheckProjectsDeadline();
        console.log("exists" + projects)
        if (projects===false || !validAccess) {
            // already exist
            response.statusCode = 400;
            response.error = "No projects reaped.";
        } else {
            
            console.log("Project Length " + projects.length)
            // console.log(projects[0])
            for (var i = 0; i < projects.length; i++) {
                console.log(projects[i]);
                let cur_project = projects[i]
                let projectid = cur_project.idProject
                
                //check wheter failed and return money back.
                let succeedProject = await projectScucceed(projectid);
                
                if (succeedProject){
                    console.log("Project met the goal.")
                }else{
                    //check for direct funding and return fundign to supporters as needed
                    let supportersDF = await getSupportersDirectFund(projectid)
                   console.log("Length of Direct Fund List: " + supportersDF)
                    if (supportersDF.length > 0) {
                        //there are supporters with direct funding
                        for (var support=0; support<supportersDF.length; support++) {
                            
                            let currentSupporter = supportersDF[support].idSupporter;
                            console.log("CURRENT SUP " + currentSupporter);
                            
                            let fundingAmount = parseFloat(supportersDF[support].amount);
                            console.log("CURRENT SUP Direct amount " + fundingAmount);
                            
                            //get the current budge
                            let currentBudget = parseFloat(await getSupportersBudget(currentSupporter))
                            console.log("Current budget: " + currentBudget);
                            //calculate the new budget
                            let newBudget = currentBudget + fundingAmount
                            console.log("NEW budget: " + newBudget);
                            //update
                            let updatedBudget = await updateBudget(currentSupporter, newBudget);
                            if (!updatedBudget) {
                                response.statusCode = 400;
                                response.error = "Couldn't update budget ";
                            }
                            
                        }
                        
                    }
                    //check with pledges in the project
                    let pledges = await getPledges(projectid);
                    console.log("PLEDGES: " + pledges)
                    if (pledges.length !==0) {
                        //there are pledges associated with the project
                        for (var pledgeNum=0; pledgeNum<pledges.length; pledgeNum++) {
                            let currentPledge = pledges[pledgeNum].idPledge;
                    
                            
                            console.log("Pledge" + currentPledge)
                            let pledgeSupporter = await checkPledgeClaimed(currentPledge);
                            
                            console.log("Pledge Supporter" + pledgeSupporter)
                            if (pledgeSupporter.length !== 0) {
                                //if the project is claimed, need to return the funds
                                //get the current funds of the supporter
                                let currentBudget = parseFloat(await getSupportersBudget(pledgeSupporter));
                                console.log("Current budget" + currentBudget)
                                //get the cost of pledge
                                console.log("Current pledge id" + currentPledge)
                                let pledgeCost = parseFloat(await getPledgeCost(currentPledge));
                                console.log("Current cost" + pledgeCost)
                                //add the cost of the pledge 
                                let newBudget = pledgeCost + currentBudget;
                                console.log("New budget" + newBudget)
                                let updatedBudget = await updateBudget(pledgeSupporter, newBudget); 
                                if (!updatedBudget) {
                                    response.statusCode = 400;
                                    response.error = "Couldn't update budget for " + pledgeSupporter;
                                }
                            }
                        }
                    }
                    
                }
                
                //Starts deleting everything related to this project
                const deleted = await deleteProject(projectid);
                
                if (deleted) {
                    const deletedPledge = await deleteProjectPledge(projectid);
                    const deletedDesigner = await deleteProjectDesigner(projectid);
                    console.log(deletedDesigner);
                    
                    if (deletedDesigner&&deletedPledge) {
                        response.statusCode = 200;
                        console.log("Success, deleted project:" + info.projectid);
                    }
                    else {
                        response.statusCode = 400;
                     response.error = "Couldn't delete " + info.projectid;
                    }
                    
                } else {
                     response.statusCode = 400;
                     response.error = "Couldn't delete " + info.projectid;
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
