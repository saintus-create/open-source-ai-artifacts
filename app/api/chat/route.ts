import { Duration } from '@/lib/duration'
import { getModelClient } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { toGenerationPrompt } from '@/lib/prompt'
import { fragmentSchema as schema } from '@/lib/schema'
import { Templates } from '@/lib/templates'
import { streamObject, LanguageModel } from 'ai'

export const maxDuration = 60

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

export async function POST(req: Request) {
  const {
    messages,
    userID,
    teamID,
    template,
    model,
    config,
  }: {
    messages: any[];
    userID: string | undefined;
    teamID: string | undefined;
    template: Templates;
    model: LLMModel;
    config: LLMModelConfig;
  } = await req.json();

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config;
  console.log('Using model:', model.id, 'Provider:', model.providerId);
  const modelClient = getModelClient(model, config);

  try {
    console.log('Starting Generation');
    const stream = await streamObject({
      model: modelClient as LanguageModel,
      schema,
      system: toGenerationPrompt(template),
      messages,
      maxRetries: 3,
      ...modelParams,
    });
    console.log('Generation stream created');
    return stream.toTextStreamResponse();
  } catch (error: any) {
    console.error('Generation error:', error);
    if (error?.statusCode === 429) {
      return new Response('Rate limit exceeded. Please try again later.', { status: 429 });
    }
    if (error?.statusCode === 503 || error?.statusCode === 529) {
      return new Response('Provider overloaded. Please try again later.', { status: error.statusCode });
    }
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      return new Response('Access denied. Check your API key.', { status: error.statusCode });
    }
    return new Response(`Generation failed: ${error?.message ?? 'unknown error'}`, { status: 500 });
  }
}
