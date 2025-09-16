// src/ai/flows/generate-mining-tool-variants.ts
'use server';
/**
 * @fileOverview Generates variations of mining tools using GenAI to provide varied and interesting mining experiences.
 *
 * - generateMiningToolVariants - A function that generates different mining tool variants.
 * - MiningToolVariantsInput - The input type for the generateMiningToolVariants function.
 * - MiningToolVariantsOutput - The return type for the generateMiningToolVariants function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MiningToolVariantsInputSchema = z.object({
  baseToolDescription: z
    .string()
    .describe('A description of the base mining tool.'),
  numberOfVariants: z
    .number()
    .int()
    .positive()
    .default(3)
    .describe('The number of tool variants to generate.'),
});
export type MiningToolVariantsInput = z.infer<typeof MiningToolVariantsInputSchema>;

const MiningToolVariantsOutputSchema = z.object({
  variants: z.array(
    z.object({
      name: z.string().describe('The name of the mining tool variant.'),
      description: z.string().describe('A description of the mining tool variant.'),
    })
  ),
});
export type MiningToolVariantsOutput = z.infer<typeof MiningToolVariantsOutputSchema>;

export async function generateMiningToolVariants(input: MiningToolVariantsInput): Promise<MiningToolVariantsOutput> {
  return generateMiningToolVariantsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMiningToolVariantsPrompt',
  input: {schema: MiningToolVariantsInputSchema},
  output: {schema: MiningToolVariantsOutputSchema},
  prompt: `You are a creative game designer tasked with generating variations of mining tools for a gamified experience.

You will receive a description of a base mining tool and the number of variants to generate.
Your task is to create distinct and imaginative variants that offer subtly different visual effects and resource generation possibilities.

Base Tool Description: {{{baseToolDescription}}}
Number of Variants: {{{numberOfVariants}}}

Ensure each variant has a unique name and a concise description highlighting its special characteristics.
The variants should sound plausible as mining tools in a sci-fi setting, but their precise effects will be up to the
game engine to decide, so focus on creative tool names and descriptions.

Output the variants in the following JSON format:
{
  "variants": [
    {
      "name": "Variant Name 1",
      "description": "Variant Description 1"
    },
    {
      "name": "Variant Name 2",
      "description": "Variant Description 2"
    }
  ]
}`,
});

const generateMiningToolVariantsFlow = ai.defineFlow(
  {
    name: 'generateMiningToolVariantsFlow',
    inputSchema: MiningToolVariantsInputSchema,
    outputSchema: MiningToolVariantsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
