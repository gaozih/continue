import type {
  ArtifactType,
  EmbeddingsCacheResponse,
  IContinueServerClient,
} from "../interface.js";

export class ContinueServerClient implements IContinueServerClient {
  url: URL | undefined;

  constructor(
    serverUrl: string | undefined,
    private readonly userToken: string | undefined,
  ) {
    try {
      this.url =
        typeof serverUrl !== "string" || serverUrl === ""
          ? undefined
          : new URL(serverUrl);
    } catch (e) {
      console.warn("Invalid Continue server url", e);
      this.url = undefined;
    }
  }

  getUserToken(): string | undefined {
    return this.userToken;
  }

  get connected(): boolean {
    return this.url !== undefined && this.userToken !== undefined;
  }

  public async getConfig(): Promise<{ configJson: string; configJs: string }> {
    const userToken = await this.userToken;

    //let requestUrl: URL | RequestInfo = this.url ?? new URL('https://raw.githubusercontent.com/gaozih/continue_config/refs/heads/main/.continuerc.json');
    //const response = await fetch(requestUrl, {
    const JsonResponse = await fetch(new URL("config.json", this.url).href, {
      method: "GET",
      //headers: {
      //  Authorization: `Bearer ${userToken}`,
      //},
    });
    if (!JsonResponse.ok) {
      throw new Error(
        `Failed to sync remote config (HTTP ${JsonResponse.status}): ${JsonResponse.statusText}`,
      );
    }
    const JsResponse = await fetch(new URL("config.js", this.url).href, {
      method: "GET",
      //headers: {
      //  Authorization: `Bearer ${userToken}`,
      //},
    });
    if (!JsResponse.ok) {
      throw new Error(
        `Failed to sync remote config (HTTP ${JsResponse.status}): ${JsResponse.statusText}`,
      );
    }
    //const data = await response.json();
    const configJson = await JsonResponse.text();
    const configJs = await JsResponse.text();
    return {configJson, configJs};
  }

  public async getFromIndexCache<T extends ArtifactType>(
    keys: string[],
    artifactId: T,
    repoName: string | undefined,
  ): Promise<EmbeddingsCacheResponse<T>> {
    if (repoName === undefined) {
      console.warn(
        "No repo name provided to getFromIndexCache, this may cause no results to be returned.",
      );
    }

    if (keys.length === 0) {
      return {
        files: {},
      };
    }
    const url = new URL("indexing/cache", this.url);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await this.userToken}`,
        },
        body: JSON.stringify({
          keys,
          artifactId,
          repo: repoName ?? "NONE",
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(
          `Failed to retrieve from remote cache (HTTP ${response.status}): ${text}`,
        );
        return {
          files: {},
        };
      }

      const data = await response.json();
      return data;
    } catch (e) {
      console.warn("Failed to retrieve from remote cache", e);
      return {
        files: {},
      };
    }
  }

  public async sendFeedback(feedback: string, data: string): Promise<void> {
    if (!this.url) {
      return;
    }

    const url = new URL("feedback", this.url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await this.userToken}`,
      },
      body: JSON.stringify({
        feedback,
        data,
      }),
    });
  }
}
