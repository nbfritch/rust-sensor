import { createResource, createSignal, For, Match, Suspense, Switch } from "solid-js";

interface ICurrentReading {
  id: number;
  name: string;
  description: string;
  readingValue: number;
  minutesAgo: number;
  readingDate: number;
  readingTypeLabel: string;
}

async function fetchCurrentReadings(): Promise<Array<ICurrentReading>> {
  return await (await fetch("http://localhost:3000/api/current")).json();
}

export function Current() {
  const [currentReadings] = createResource<Array<ICurrentReading>>(fetchCurrentReadings)

  return (
    <main id="app-main">
      <div class="container has-text-centered">
        <Suspense fallback={<p>Loading...</p>}>
          <h1 class="is-size-1">Current Readings:</h1>
          <Switch>
            <Match when={currentReadings.error}>
              <p>Error: {currentReadings.error}</p>
            </Match>
            <Match when={(currentReadings() ?? []).length === 0}>
              <p>No readings found.</p>
            </Match>
            <Match when={(currentReadings() ?? []).length > 0} >
              <For each={currentReadings()}>
                {(reading) => (
                  <div>
                    <h2 class="is-size-2">
                      {reading.description}
                    </h2>
                    <p>aka {reading.name}</p>
                    <p>
                      {reading.readingValue}{reading.readingTypeLabel} {reading.minutesAgo} minutes ago
                    </p>
                  </div>
                )}</For>
            </Match>
          </Switch>
        </Suspense>
      </div>
    </main>
  );
}
