import { ask, say } from "./shared/cli.ts";
import { promptDalle, promptGPT } from "./shared/openai.ts";

const subject1 = await ask("give me a subject");
const subject2 = await ask("give me another subject");
const settings = await ask("now give me a setting");

const result = await promptDalle(`Create a simple illustration with these subjects, ${subject1} and ${subject2} in this setting, ${settings}`);

say(result.url);