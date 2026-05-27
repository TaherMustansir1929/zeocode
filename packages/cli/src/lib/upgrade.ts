import open from "open";
import { apiClient } from "./api-client";
import { getErrorMessage } from "./http-errors";

function getSafeHttpsUrl(data: unknown, source: string): string {
	if (!data || typeof data !== "object" || !("url" in data)) {
		throw new Error(`${source} did not return a valid URL`);
	}

	const rawUrl = (data as { url: unknown }).url;
	if (typeof rawUrl !== "string") {
		throw new Error(`${source} did not return a valid URL`);
	}

	const parsed = new URL(rawUrl);
	if (parsed.protocol !== "https:") {
		throw new Error(`${source} URL must use https`);
	}

	return parsed.toString();
}

export async function openUpgradeCheckout() {
	const response = await apiClient.billing.checkout.$post();

	if (response.ok) {
		const data = await response.json();
		await open(getSafeHttpsUrl(data, "Checkout"));
		return;
	}

	throw new Error(await getErrorMessage(response));
}

export async function openBillingPortal() {
	const response = await apiClient.billing.portal.$post();

	if (response.ok) {
		const data = await response.json();
		await open(getSafeHttpsUrl(data, "Billing portal"));
		return;
	}

	throw new Error(await getErrorMessage(response));
}
