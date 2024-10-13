import { ask, say } from "./shared/cli.ts";
import {
  Confirm,
  Select,
} from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/mod.ts";
import {
  Column,
  Table,
} from "https://deno.land/x/cliffy@v1.0.0-rc.4/table/mod.ts";
import { gpt, promptGPT } from "./shared/openai.ts";
import * as mod from "https://deno.land/std@0.224.0/datetime/mod.ts";

let userDoesntExist;
const savePath = "src/user.json";
let suggestion = String.empty;

let newUserProfile = {
  "fileName": " ",
  "expertise": " ",
  "skillLevel": " ",
};

say("Welcomes to artist skill tree");
say("");
const startDate = new Date();
console.log(startDate);

const userProfile = await readUserProfile(savePath);
// showing user skillTree if it exist
if ("SkillTree" in userProfile && userProfile.SkillTree != undefined) {
  const tree = new Table()
    .header(["Skill Name", "Level"])
    .columns([
      { border: true },
      new Column().align("center"),
    ]);
  for (const item of userProfile["SkillTree"]) {
    for (const [key, value] of Object.entries(item)) {
      tree.push([key, value]);
      //console.log(key, value);
    }
  }

  userDoesntExist = false;
  tree.render();
}

const selectedTask = await Select.prompt({
  message: "What would you like to do?",
  options: [
    "Change User Information",
    { name: "Log your progress", value: true, disabled: userDoesntExist },
    "Start a new profile.",
  ],
});

if (typeof selectedTask === "boolean") {
  console.log("logging trees");
  //calculating their progress
  await loggingProgress(userProfile);
} else {
  if (selectedTask == "Change User Information") {
    await updatingProfile(userProfile);
  } else if (selectedTask == "Start a new profile.") {
    await startNewProfile();
  }
}

async function startNewProfile() {
  //setting up new files
  newUserProfile.fileName = await ask("How would you like to name your file?");
  newUserProfile.expertise = await ask(
    "Which craft would you like to practice?",
  );
  newUserProfile.skillLevel = await ask(
    "what is your current skill level in that craft?",
  );
  await writeUserSaveFile("src/user.json", newUserProfile);
  userExist = false;
}

async function writeUserSaveFile(filePath, Json) {
  try {
    await Deno.writeTextFile(filePath, JSON.stringify(Json));
  } catch (_e) {
    console.log(_e);
  }
}

//reading the userProfile;
async function readUserProfile(filePath) {
  return JSON.parse(await Deno.readTextFile(filePath));
}

async function createSuggestion(jsonObj) {
  say(
    "Here, we are gonna start generating some suggestions for you to improve upon",
  );

  //console.log(JSON.stringify(profile));
  suggestion = await promptGPT(
    `
        Basing off of this user profile: ${JSON.stringify(jsonObj)}, 
        give me only the name of one skill relating to this user's expertise that they could expand upon.
        `,
    { max_tokens: 200 },
  );

  say(suggestion);
  return suggestion;
}

// if(userExist){
//     //update skilltree;
//     const profile = await readUserProfile('src/user.json');
//     const choices = await Confirm.prompt("Do you want to add a new skill?");
//    if(choices){
//     //add a new section in skill tree;
//     const newSkill = await createSuggestion(profile);
//     profile['SkillTree'].push({[newSkill] : 1});

//     await writeUserSaveFile(savePath, profile);
//    }else{
//     say("Ok, good luck in your journey improving your skill, my fellow artist.");
//    }

// }else{
//     //create a skill tree;
//    let user = await readUserProfile(savePath);
//     await createSuggestion(user);

//     user.SkillTree = [];
//     user.SkillTree.push({[suggestion]: 1});
//     await writeUserSaveFile(savePath, user);
// }

async function updatingProfile(existingProfile) {
  //asking user for what do they want to do;

  //changing information on the profile;
  const changeOptions = [];
  for (const userFields in existingProfile) {
    if (userFields != "SkillTree") {
      changeOptions.push(userFields);
    }
  }
  const field = await Select.prompt({
    message: "What would you like to change?",
    options: changeOptions,
  });
  let changes = await ask("What would you want to update it to?");

  //then update the json object

  existingProfile[field] = changes;
  //then save it to local file with writeUserFile
  await writeUserSaveFile("src/user.json", existingProfile);
}

async function loggingProgress(existingProfile) {
  if ("SkillTree" in existingProfile) {
    //logging user practice streak;
    const skillTreeObj = existingProfile["SkillTree"];
    //console.log(skillTreeObj.values());
    const confirm = await Confirm.prompt(
      "Would you like to log your practice streak?",
    );
    if (confirm) {
      say("Updating Your SkillTree");
      const skills = existingProfile["SkillTree"].map((item) =>
        Object.keys(item)[0]
      );
      // const selectedSkill = await Select.prompt({
      //   message: "Which skill would you like to update on?",
      //   options: skills,
      // });
      const entry = await ask(
        "Please provide a description of what have you done recently",
      );
      //feed it to gpt;
      //gpt response format [{"skill1" : 2}, {"skill2" : 3}];
      console.log(skills);
      const skill_schema = {
        name: "skillpoints",
        schema: {
          type: "object",
          properties: {
            skillpoints: {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "skill1": {
                    "type": "integer",
                  },
                },
              },
            },
          },
        },
      };

      const rating = await gpt({
        messages: [
          {
            role: "system",
            content:
              `You are an helful assistant that evaluate artists' progress in their journey of bettering their skills. 
              Basing off of user's dexription, you always evaluate for each skills in this array ${skills}, and you always give points to each skills within the range of 1 through 10. 
              Your number of evaluation should match the number of elements in this array.
              You should only give higher points when user made relevant progress in said skills.
              No points should be given if the description is not relevant to users' skill set.
              `,
          },
          {
            role: "user",
            content:
              `How much have I improved basing off of this description: ${entry}. `,
          },
        ],
        response_format: {
          type: "json_schema",
          "json_schema": skill_schema,
        },
        temperature: 0.1,
      });

      say(rating.content);
      const pointObject = JSON.parse(rating.content);
      const addedPoints = pointObject["skillpoints"].map((item) =>
        Object.values(item)[0]
      );
      const allEqual = (arr) => arr.every((v) => v === 0);
      if (allEqual(addedPoints)) {
        say("sorry u made no progress");
        return;
      } else {
        //go through add the points to the values of the original skill field
        for (let i = 0; i < skillTreeObj.length; i++) {
          let skillobj = skillTreeObj[i];
          for (const [key, value] of Object.entries(skillobj)) {
            skillobj[key] = value + addedPoints[i];
          }
        }
        console.log(JSON.stringify(skillTreeObj));
      }
      // let value = existingProfile["SkillTree"].find((item) =>
      //   item[selectedSkill] != undefined
      // )[selectedSkill];
      // value++;
      // existingProfile["SkillTree"].find((item) =>
      //   item[selectedSkill] != undefined
      // )[selectedSkill] = value;

      // await writeUserSaveFile("src/user.json", existingProfile);
    }
  } else {
    say("Sorry, there is no skill tree in your profile");
    //ask if want to start one.
  }

  //checking out the skill tree;
}
