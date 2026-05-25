import { google } from "@ai-sdk/google";
import {
	findSupportedChatModel,
	type SupportedChatModel,
	type SupportedChatModelId,
	type SupportedProvider,
} from "@zeocode/shared";
import type { LanguageModel } from "ai";

type GoogleModelId = Extract<SupportedChatModel, { provider: "google" }>["id"];
// type AnthropicModelId = Extract<
// 	SupportedChatModel,
// 	{ provider: "anthropic" }
// >["id"];
// type OpenAIModelId = Extract<SupportedChatModel, { provider: "openai" }>["id"];

export type ResolvedModel = {
	model: LanguageModel;
	provider: SupportedProvider;
	modelId: SupportedChatModelId;
};

function assertUnsupportedProvider(provider: string): never {
	throw new Error(`Unsupported provider: ${provider}`);
}

function resolveGoogleModel(modelId: GoogleModelId): ResolvedModel {
	return {
		model: google(modelId),
		provider: "google",
		modelId,
	};
}

function resolveSupportedChatModel(model: SupportedChatModel): ResolvedModel {
	const provider = model.provider;

	switch (provider) {
		case "google":
			return resolveGoogleModel(model.id);
		default:
			return assertUnsupportedProvider(provider);
	}
}

export function isSupportedChatModel(
	modelId: string,
): modelId is SupportedChatModelId {
	return findSupportedChatModel(modelId) != null;
}

export function resolveChatModel(modelId: string): ResolvedModel {
	const model = findSupportedChatModel(modelId);

	if (!model) {
		throw new Error(`Unsupported model ID: ${modelId}`);
	}

	return resolveSupportedChatModel(model);
}
