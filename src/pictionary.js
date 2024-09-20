import { ask, say } from "./shared/cli.ts";
import { promptDalle, promptGPT, gpt } from "./shared/openai.ts";

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
    if(response.includes("y")){
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
    say("You will be given a subject and give back a description of said subject for gpt to guess");

    const diff = await ask("Do you want a diffcult subject?");
    const subject = determineDiff(diff);
    say(subject);
    const steps = await describeImage();
    const img = await promptDalle(`My prompt has full detail so no need to add more. Just follow the steps in the array to create the image:${steps} `);

    const guess = await gpt(
        {
            messages:[{
                 role: "user",
                content:[
                    {
                        type: "text",
                        text:"Give me one precise guess for the object in the image",
                    },
                    {
                        type:"image_url",
                        image_url:{
                            "url":img.url,
                        },
                    }

                ]
            }
               
            ]
        }
    )
    say(guess.content);
    say(img.url);
    //const result = await promptDalle(` I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: an image of a ${subject}`);
    // say(result.url);
    // say("");
    // await waitForSeconds(seconds);
    // const description = await ask("without mentioning the subject's name, give me a one setence description");
    // const guess = await promptGPT(`make a simple and definitive guess of a subject base off of this description: ${description}.NO thought process needed`, {temperature:0.8});

    // say(guess);
}

main();

async function describeImage()
{
    let steps = [];
     while (steps.length < 5)
    {   let providedStep = await ask("provide that step in drawing the prompt in a single setence");
        steps.push(providedStep);

    }

    return steps;


}

// say(result.url);