import Anthropic from '@anthropic-ai/sdk';
let _c:Anthropic|null=null;
export function getAnthropicClient():Anthropic{if(!_c)_c=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});return _c;}
