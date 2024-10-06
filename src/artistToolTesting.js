
import { ask, say } from "./shared/cli.ts";
import {Confirm, Select } from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/mod.ts";
import { promptGPT, gpt } from "./shared/openai.ts";

let userExist;
const savePath = "src/user.json";
async function writeUserSaveFile(filePath, Json){
    try{
        await Deno.writeTextFile(filePath, JSON.stringify(Json));
    }catch(_e){
        console.log(_e);
    }
}
let newUserProfile = {
    "fileName": " ",
    "expertise" : " ",
    "skillLevel" : " ",
    
}

async function updatingProfile(existingProfile){
    //asking user for what do they want to do;
    const selectedTask = await Select.prompt({
        message: "What would you like to do?",
        options:[
            "Change User Information",
            "Update your Skill Tree"
        ]
    })

    if(selectedTask == "Change User Information")
    {
        //changing information on the profile;
        const changeOptions = [];
        for (const userFields in existingProfile){
            if(userFields != "SkillTree"){
                changeOptions.push(userFields);
            }
        }
            const field = await Select.prompt({
                message:"What would you like to change?",
                options: changeOptions
            });
            let changes = await ask("What would you want to update it to?");

            //then update the json object

            existingProfile[field] = changes;
            //then save it to local file with writeUserFile
            await writeUserSaveFile('src/user.json', existingProfile);
    }else
    {
        if('SkillTree' in existingProfile){
            //logging user practice streak;
            const confirm = await Confirm.prompt("Would you like to log your practice streak?");
            if(confirm)
            {
                say("Updating Your SkillTree");
                const skills = existingProfile['SkillTree'].map(item => Object.keys(item)[0]);
                const selectedSkill = await Select.prompt({
                    message:"Which skill would you like to update on?",
                    options: skills
                })
                let value = existingProfile['SkillTree'].find((item) => item[selectedSkill] != undefined)[selectedSkill];
                value++;
                existingProfile['SkillTree'].find((item) => item[selectedSkill] != undefined)[selectedSkill] = value;

                await writeUserSaveFile('src/user.json', existingProfile);
            }

        }else
        {
            say("Sorry, there is no skill tree in your profile");
            //ask if want to start one.
        }
    }
    //checking out the skill tree;
  
   
}

say("Welcomes to artist skill tree");
say("");

const response = await ask("Would you like to load up a previous profiles?");
if(response.includes("n")){
    //setting up new files
    newUserProfile.fileName = await ask("How would you like to name your file?");
    newUserProfile.expertise = await ask ("Which craft would you like to practice?");
    newUserProfile.skillLevel = await ask("what is your current skill level in that craft?");
    await writeUserSaveFile('src/user.json', newUserProfile);
    userExist = false;
}else{
    const userProfile = await readUserProfile(savePath);
    const userChoice = await Confirm.prompt("Are you going to make changes to your file?");
    if(userChoice)
    {
        await updatingProfile(userProfile);
    }
 
    userExist = true;
    
    
  
}


//reading the userProfile;
async function readUserProfile(filePath){

    return JSON.parse(await Deno.readTextFile(filePath));
}

async function createSuggestion(jsonObj){

    say("Here, we are gonna start generating some suggestions for you to improve upon");

    
    //console.log(JSON.stringify(profile));
    const suggestion = await promptGPT (`
        Basing off of this user profile: ${JSON.stringify(jsonObj)}, 
        give me only the name of one skill relating to this user's expertise that they could expand upon.
        `, {max_tokens: 200});

    say(suggestion);
    return suggestion;
}


if(userExist){
    //update skilltree;
    const profile = await readUserProfile('src/user.json');
    const choices = await Confirm.prompt("Do you want to add a new skill?");
   if(choices){
    //add a new section in skill tree;
    const newSkill = await createSuggestion(profile);
    profile['SkillTree'].push({[newSkill] : 1});

    await writeUserSaveFile(savePath, profile);
   }else{
    say("Ok, good luck in your journey improving your skill, my fellow artist.");
   }
 
}else{
    //create a skill tree;
   let user = await readUserProfile(savePath);
    await createSuggestion(user);

    user.SkillTree = [];
    user.SkillTree.push({[suggestion]: 1});
    await writeUserSaveFile(savePath, user);
}





// const suggestion = await gpt (
//     {
//         messages:[
//         {   role:"system", 
//             content:"Give me a simple list for answers, no extra explannation needed"
          
//         },
//         {
//             role: "user",
//             content:"Give me suggestions for skills to imporve basing off of this user profile"
         
//         }
//         ],

//         tools: [
//             {
//                 type: "function",
//                 function: {
//                     name: "readUserProfile",
//                     description: "read the local JSON file and return a JSON object",
//                     parameters: {
//                         type: "object",
//                         properties: {
//                             filePath: {
//                                 type: "string",
//                                 description:"the local file path that it would read from",
//                             }
//                         },
//                         required: ["filePath"],
//                         additionalProperties: false
//                     },
//                     strict: true
//                 }
//             }

//         ]
//     }
     
// )
// if(suggestion.tool_calls[0]){
    
//     console.log("true");
//     const name = suggestion.tool_calls[0].function.name;

//     if(name == "readUserProfile"){
//         const readFile = await readUserProfile('src/user.json');

//         const finalResponse = await gpt(
//             {
//                 messages:[
//                     {
//                         role: "tool",
//                         name: "readUserProfile",
//                         content: JSON.stringify(readFile),
//                         id: suggestion.tool_calls[0].id
//                     }
//                 ]
//             }
//         )

//         say(finalResponse);
//     }
// }
//say(JSON.stringify(suggestion, null, 2));
   
