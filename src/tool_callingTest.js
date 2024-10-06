
import { ask, say } from "./shared/cli.ts";
import { promptGPT, gpt } from "./shared/openai.ts";
import { LogLevel, setLogLevel } from "./shared/logger.ts";
setLogLevel(LogLevel.Debug);

const savePath = "src/user.json";
async function writeUserSaveFile(filePath, Json){
    try{
        await Deno.writeTextFile(filePath, JSON.stringify(Json));
    }catch(_e){
        console.log(_e);
    }
}
let userProfile = {
    "fileName": " ",
    "expertise" : " ",
    "skillLevel" : " ",
    
}

async function updatingProfile(){
    //asking user for what do they want to change;
    const field = await ask("What would you like change?");
    let changes = await ask("What would you want to update it to?");

    //then update the json object
    let existingProfile = await readUserProfile('src/user.json');


    existingProfile[field] = changes;
    //then save it to local file with writeUserFile
    await writeUserSaveFile('src/user.json', existingProfile);
}

say("Welcomes to artist skill tree");
say("");

const response = await ask("Would you like to load up a previous profiles?");
if(response.includes("n")){
    userProfile.fileName = await ask("How would you like to name your file?");
    userProfile.expertise = await ask ("Which craft would you like to practice?");
    userProfile.skillLevel = await ask("what is your current skill level in that craft?");
    await writeUserSaveFile('src/user.json', userProfile);

}else{
    await updatingProfile();
}

say("Here, we are gonna start generating some suggestions for you to improve upon");

//reading the userProfile;
async function readUserProfile(filePath){

    return JSON.parse(await Deno.readTextFile(filePath));
}

// const profile = await readUserProfile('src/user.json');
// //console.log(JSON.stringify(profile));
// const suggestion = await promptGPT (`Give me 2 ahort suggestions for skills to imporve basing off of this user profile: ${JSON.stringify(profile)}.`, {max_tokens: 200});

// say(suggestion);
// const tools =  {
//     type: "function",
//     function: {
//         name: "readUserProfile",
//         description: "read the local JSON file and return a JSON object",
//         parameters: {
//             type: "object",
//             properties: {
//                 filePath: {
//                     type: "string",
//                     description:"the local file path that it would read from",
//                 }
//             },
//             required: ["filePath"],
//             additionalProperties: false
//         },
//         strict: true
//     }
// };
// passing the function definition to GPT;
// let suggestion = await gpt (
//     {
//         messages:[
//         {   role:"system", 
//             content:"You are a helpful assistant for artists. Call functions that are supplied to fulfill artists' request."
          
//         },
//         {
//             role: "user",
//             content:"Give me suggestions for skills to imporve basing off of my skill tree profile"
         
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
// say(JSON.stringify(suggestion, null, 2));
// say(JSON.stringify(suggestion.tool_calls[0]));

// const messages = [];
// messages.push ({role:"system", content:"You are a helpful customer support assistant. Use the supplied tools to assist the user."});
// messages.push({role: "user", content:"Give me suggestions for skills to imporve basing off of my skill tree profile"});
// messages.push({role: "assistant", content: `${suggestion.content}`});


// const toolCalls = await gpt(
//     {
//         messages: messages,
//         tools: tools

//     }
// )

// if(suggestion.tool_calls){
//     say("calling function now");
//     await handleFunctionCall(suggestion.tool_calls);
//     suggestion = await gpt(
//         {
//             messages,
//             max_tokens: 256
//         }
//     )

// }
// say(suggestion.content);

// async function handleFunctionCall(tool_calls){
//     const functionName = tool_calls[0].name;
//     const usingFunction = await readUserProfile(savePath);

//     messages.push([{
//         tool_call_id: tool_calls[0].id,
//         role: "tool",
//         name: functionName,
//         content: usingFunction
//     }])

// }
   
