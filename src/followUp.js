import { ask, say } from "./shared/cli.ts";
import { promptDalle, promptGPT } from "./shared/openai.ts";


const question = await ask("What do you want to generate with Dalle?");

const followUP = await promptGPT(`Ask only a follow up question about the details regarding this original prompt, ${question}`);

const followUpAnswer = await ask(followUP);

const result = await promptDalle(`Create an illustration with these two prompts: ${question}, ${followUpAnswer}`);

say(`this is the resulting prompt: ${result.revised_prompt}`);
say(result.url);