import { ask, say } from "./shared/cli.ts";
import {
  Confirm,
  Select,
} from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/mod.ts";
import { Table } from "https://deno.land/x/cliffy@v1.0.0-rc.4/table/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.4/ansi/colors.ts";
import boxen from "npm:boxen@7.1.1";
import { gpt, promptGPT } from "./shared/openai.ts";

import { debug } from "./shared/logger.ts";

let userDoesntExist;
const savePath = "src/user.json";
let suggestion = String.empty;
const begginer = colors.rgb24("begginer", 0xE875B1);
const intermediate = colors.rgb24("intemediate", 0x6AD23D);
const advanced = colors.rgb24("advanced", 0x28c78f);
const master = colors.rgb24("master", 0xedca18);

const cupcake = `
     --@--
   (_______)
  (_________)
   \\ __/___/
`;
let newUserProfile = {
  "fileName": " ",
  "expertise": " ",
  "skillLevel": " ",
};
//console.log(cupcake);
say("Welcomes to Craft Your Path");
say("");
const startDate = new Date();
console.log(startDate);
say("");
console.log(
  boxen(`\n ${begginer} \n ${intermediate} \n ${advanced} \n ${master}`, {
    title: "Levels",
    titleAlignment: "center",
    textAlignment: "center",
    padding: { top: 1, bottom: 2 },
  }),
);
const userProfile = await readUserProfile(savePath);

// showing user skillTree if it exist

if ("SkillTree" in userProfile && userProfile.SkillTree != undefined) {
  const tree = new Table()
    .header([colors.rgb24("Skill Name", 0xff3333), "Level"])
    .column(0, { border: true });

  //go through skillTree and check if cIndex exist
  for (const item of userProfile["SkillTree"]) {
    if ("cIndex" in item) {
      const _color = item["cIndex"];
      //console.log("checking color index");
      for (const [key, value] of Object.entries(item)) {
        if (key != "cIndex" && key != "topped") {
          tree.push([colors.rgb24(key, _color), value]);
        }
      }
    } else {
      const key = Object.keys(item)[0];
      const value = item[key];
      noCIndexTree(tree, key, value);
      break;
    }
  }

  userDoesntExist = false;
  tree.render();
} else {
  userDoesntExist = true;
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
  console.clear();

  newUserProfile.fileName = await ask("How would you like to name your file?");
  newUserProfile.expertise = await ask(
    "Which craft would you like to practice?",
  );
  newUserProfile.skillLevel = await Select.prompt({
    message: "what is your current skill level in that craft?",
    options: [
      "begginer",
      "intermediate",
      "advanced",
    ],
  });
  await createSkillTree(newUserProfile);
  await writeUserSaveFile("src/user.json", newUserProfile);
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
        No repeat on skills that the user already has in their profile. 
        `,
    { max_tokens: 200 },
  );

  say(suggestion);
  return suggestion;
}

//add a new section in skill tree;
async function addSkill(file) {
  console.clear();
  say(" ");

  const adding = await Confirm.prompt("Would you like to add a new skill?");

  if (adding) {
    const newSkill = await createSuggestion(file);
    say(" ");
    say(`${newSkill} has been added!`);

    file["SkillTree"].push({ [newSkill]: 5 });
    await writeUserSaveFile(savePath, file);
  }
}

async function createSkillTree(profile) {
  say(" ");
  say("lets start you off with your first skill to practice on!");

  const newSkill = await createSuggestion(profile);

  profile.SkillTree = [];
  profile.SkillTree.push({ [newSkill]: 5 });
}
//create a skill tree;

async function updatingProfile(existingProfile) {
  //asking user for what do they want to do;
  console.clear();
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
  await QuitorContinue(existingProfile);
}

async function loggingProgress(existingProfile) {
  console.clear();
  if ("SkillTree" in existingProfile) {
    //logging user practice streak;
    const skillTreeObj = existingProfile["SkillTree"];
    let mastered = false;
    //console.log(skillTreeObj.values());
    const confirm = await Confirm.prompt(
      "Would you like to log your practice streak?",
    );
    if (confirm) {
      say("Updating Your SkillTree");
      const skills = existingProfile["SkillTree"].map((item) => {
        const keys = Object.keys(item);

        // Find the first key that isn't 'cIndex'
        const skillName = keys.find((key) => key !== "cIndex");

        return skillName;
      });

      const entry = await ask(
        "Please provide a description of what have you done recently",
      );
      //feed it to gpt;
      //gpt response format [{"skill1" : 2}, {"skill2" : 3}];

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
              `You are an helpful but critical assistant that evaluate artists' progress in their journey of bettering their skills. 
              Basing off of user's dexription, you always evaluate for each skills in this array ${skills}, and you always give points to each skills within the range of 1 through 10. 
              Your number of outputs should always match the number of skills in this array.
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

      //say(rating.content);
      const pointObject = JSON.parse(rating.content);
      const addedPoints = pointObject["skillpoints"].map((item) =>
        Object.values(item)[0]
      );

      let levelUpCount = 0;
      const allEqual = (arr) => arr.every((v) => v === 0);
      if (allEqual(addedPoints)) {
        say("sorry u made no progress");
        return;
      } else {
        //go through add the points to the values of the original skill field
        for (let i = 0; i < skillTreeObj.length; i++) {
          let skillobj = skillTreeObj[i];
          for (const [key, value] of Object.entries(skillobj)) {
            if (addedPoints[i] != null) {
              if (key != "cIndex") {
                skillobj[key] = value + addedPoints[i];

                if (skillobj[key] >= 30) {
                  levelUpCount++;

                  if (!mastered) {
                    mastered = true;
                  }
                }
              }
            } else {
              if (key != "cIndex") {
                skillobj[key] = value + 0;
              }
            }
          }
        }
      }
      //console.log("count for leveled up skills" + levelUpCount);
      if (mastered) {
        checkProgress(existingProfile, levelUpCount);
      }
      showSkillTree(existingProfile);
      await writeUserSaveFile(savePath, existingProfile);
      await QuitorContinue(existingProfile);
    }
  } else {
    say("Sorry, there is no skill tree in your profile");
    //ask if want to start one.
  }

  //checking out the skill tree;
}
//call this only when one of user
function checkProgress(profileObj, counts) {
  //check if there have been masteredflag
  if ("masteredCount" in profileObj) {
    //compare the exist value to the one that are counted through loop;
    say(" ");

    const flags = profileObj["masteredCount"];
    if (counts > flags) {
      //congrats
      say(" Yay!! ☜(⌒▽⌒)☞ !!");
      say(" ");
      say("Congratulation!");
      say(" ");
      say("Here is another cupcake!");
      console.log(cupcake);
      profileObj["masteredCount"] = counts;
    }
  } else {
    say("Omg you mastered a skill!!");
    say(" ");
    say("Here is a cupcake as the reward!");
    console.log(cupcake);
    say(" ");
    profileObj.masteredCount = counts;
    say("You will get a cupcake everytime that you mastered a skill");
  }
}
function showSkillTree(file) {
  let colorIndex;
  const newTree = new Table()
    .header([colors.rgb24("Skill Name", 0xff3333), "Level"])
    .column(0, { border: true });
  //going through the values of the skills
  for (const item of file["SkillTree"]) {
    for (const [key, value] of Object.entries(item)) {
      //compare each of their points to a bench mark (switch cases), 25:advanced beginner color hexcode, 50: intermediate color hexcode,

      if (key != "cIndex") {
        if (5 <= value && value <= 10) {
          colorIndex = 0xE875B1;
          newTree.push([colors.rgb24(key, colorIndex), value]);
          // add cIndex for the section or adding it;
          editingCIndex(item, colorIndex);
        } else if (10 <= value && value <= 20) {
          colorIndex = 0x6AD23D;
          newTree.push([colors.rgb24(key, colorIndex), value]);
          editingCIndex(item, colorIndex);
        } else if (20 <= value && value <= 30) {
          colorIndex = 0x28c78f;
          newTree.push([colors.rgb24(key, colorIndex), value]);
          editingCIndex(item, colorIndex);
        } else if (value > 30) {
          colorIndex = 0xedca18;
          newTree.push([colors.rgb24(key, colorIndex), value]);
          editingCIndex(item, colorIndex);
        }
      }
    }
  }

  newTree.render();
}

function editingCIndex(profileobj, index) {
  //check if this skill has a color index section
  if ("cIndex" in profileobj) {
    profileobj["cIndex"] = index;
  } else {
    profileobj.cIndex = index;
  }
}
function noCIndexTree(_tree, ky, val) {
  const startingLevel = userProfile.skillLevel;
  switch (startingLevel) {
    case ("begginer"):
      _tree.push([colors.rgb24(ky, 0xE875B1), val]);

      break;

    case ("intermediate"):
      _tree.push([colors.rgb24(ky, 0x6AD23D), val]);

      break;
    case ("advanced"):
      _tree.push([colors.rgb24(ky, 0x28c78f), val]);

      break;

    default:
      _tree.push([ky, val]);

      break;
  }
}
async function QuitorContinue(file) {
  const answer = await Confirm.prompt("Would you like to do something else?");
  if (answer) {
    const newTask = await Select.prompt({
      message: "What would you like to do?",
      options: [
        "Change my profile",
        "Log your progress",
        "Start a new profile",
        "Add new skill",
      ],
    });

    //choose a new task;
    switch (newTask) {
      case "Change my profile":
        await updatingProfile(file);

        break;
      case "Log your progress":
        await loggingProgress(file);

        break;
      case "Start new profile":
        await startNewProfile();

        break;
      case "Add new skill":
        await addSkill(file);

        break;
    }
  } else {
    say(" ");
    say(
      "Ok, good luck in your journey improving your skill, my fellow artist. (｡◕‿◕｡)",
    );
  }
}
