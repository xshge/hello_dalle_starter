import { ask, say } from "./shared/cli.ts";
import { promptDalle, promptGPT } from "./shared/openai.ts";

const seconds = 10;
const easySubject =[
    "cat",
    "watermelon",
    "airplane",
    "monkey",
    "koala",
    "apple",
    "catfish",
    "pineapple"

];
const diffcultSubjects = [
    "fractal",
    "Rube Goldberg machines",
    "Harp",
    "Penrose triangle",
    "Weevil",
    "Mantis Shrimp"
];
function waitForSeconds(s){
    return new Promise(resolve => setTimeout(resolve, s *1000 ));
}
function determineDiff(response){
    if(response.toLowerCase == "yes"){
        return pick(diffcultSubjects);
    }else{
        return pick(easySubject);
    }
}
function pick(array){
    return array[Math.floor(Math.random() * array.length)];
}
async function main()
{   
    say("You will be given 10 seconds to look at an image and give back a description of said image");

    const diff = await ask("Do you want a diffcult subject?");
    const subject = determineDiff(diff);
    const result = await promptDalle(` I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: an image of a ${subject}`);
    say(result.url);
    say("");
    await waitForSeconds(seconds);
    const description = await ask("without mentioning the subject's name, give me a one setence description");
    const guess = await promptGPT(`make a simple and definitive guess of a subject base off of this description: ${description}.NO thought process needed`, {temperature:0.8});

    say(guess);
}

main();

// let steps = [];
//  while (steps.length < 5)
// {   let providedStep = await ask("provide that step in drawing the prompt in a single setence");
//     steps.push(providedStep);

// }

// say(result.url);